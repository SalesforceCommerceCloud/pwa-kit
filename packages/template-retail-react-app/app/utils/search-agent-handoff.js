/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {openShopperAgentWidget} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

// The SDK queues a message until its connection and agent welcome are ready.
// Retry only a synchronous "not mounted" failure, never an accepted send or an ambiguous timeout.
export async function sendAgentHandoff(
    payload,
    {sdk = window.CimulateMessaging, wait = delay} = {}
) {
    if (
        !sdk?.setPageContext ||
        !sdk?.sendMessage ||
        !sdk?.eventHandlers?.components?.toggleWidgetOpen
    )
        throw new Error('context_api_unavailable')
    sdk.setPageContext(payload.page_context)
    sdk.eventHandlers.components.toggleWidgetOpen(true)
    for (let attempt = 0; attempt < 40; attempt++) {
        let accepted
        try {
            accepted = sdk.sendMessage(payload.message, {
                displayContent: payload.query,
                pageContextSnapshot: payload.page_context
            })
        } catch (error) {
            if (!/not ready.*mounted/i.test(error.message) || attempt === 39)
                throw new Error('agent_unavailable')
            await wait(100)
            continue
        }
        const result = await accepted
        if (result?.outcome !== 'success') throw new Error('handoff_not_confirmed')
        return
    }
}

export async function openSearchConversation(
    session,
    {fetchImpl = fetch, send = sendAgentHandoff, open = openShopperAgentWidget} = {}
) {
    const active = session.active
    if (!active || active.busy) throw new Error('search_not_ready')
    // An auth transition must not hand another shopper's conversation to the agent.
    const token = await active.getToken()
    if (token !== active.token) throw new Error('context_expired')
    const key = `${active.contextId}:${active.revision}`
    if (session.handoffs.has(key)) {
        open()
        return session.handoffs.get(key)
    }
    const pending = (async () => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        let payload
        try {
            const response = await fetchImpl('/api/search-assistant/handoff', {
                method: 'POST',
                redirect: 'error',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({contextId: active.contextId}),
                signal: controller.signal
            })
            if (!response.ok)
                throw new Error(response.status === 404 ? 'context_expired' : 'handoff_unavailable')
            payload = await response.json()
        } finally {
            clearTimeout(timeout)
        }
        await send(payload)
    })()
    session.handoffs.set(key, pending)
    while (session.handoffs.size > 20) session.handoffs.delete(session.handoffs.keys().next().value)
    // Keep an unconfirmed send reserved: automatic retries could duplicate an already-delivered turn.
    return pending
}
