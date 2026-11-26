/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export async function handoffSearch(
    query,
    signal,
    {getWidget = () => window.CimulateMessaging, wait = delay} = {}
) {
    const context = {type: 'srp', query}
    for (let attempt = 0; attempt < 100 && !signal.aborted; attempt++) {
        const widget = getWidget()
        if (!widget?.sendMessage || !widget?.eventHandlers?.components?.toggleWidgetOpen) {
            await wait(100)
            continue
        }
        try {
            widget.setPageContext?.(context)
        } catch (error) {
            if (error.message !== 'Unsupported page context type: srp') throw error
        }
        try {
            const result = await widget.sendMessage(query, {
                displayContent: query,
                pageContextSnapshot: context,
                hideWelcome: true
            })
            if (result?.outcome !== 'success')
                throw new Error('Agent handoff could not be confirmed')
        } catch (error) {
            if (!/not ready.*mounted/i.test(error.message)) throw error
            await wait(100)
            continue
        }
        if (!signal.aborted) widget.eventHandlers.components.toggleWidgetOpen(true)
        return
    }
    if (!signal.aborted) throw new Error('Agent is unavailable')
}
