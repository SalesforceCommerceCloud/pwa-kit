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
    {question = query, results, getWidget = () => window.CimulateMessaging, wait = delay} = {}
) {
    const context = {type: 'srp', query}
    const message = results
        ? `${question}\n\nStorefront search context for reference: ${JSON.stringify({
              query,
              ...results
          })}`
        : question
    let opened = false
    for (let attempt = 0; attempt < 100 && !signal.aborted; attempt++) {
        const widget = getWidget()
        if (
            !widget?.setPageContext ||
            !widget?.sendMessage ||
            !widget?.eventHandlers?.components?.toggleWidgetOpen
        ) {
            await wait(100)
            continue
        }
        if (!opened) {
            widget.setPageContext(context)
            widget.eventHandlers.components.toggleWidgetOpen(true)
            opened = true
        }
        let send
        try {
            send = widget.sendMessage(message, {
                displayContent: question,
                pageContextSnapshot: context
            })
        } catch (error) {
            if (!/not ready.*mounted/i.test(error.message)) throw error
            await wait(100)
            continue
        }
        const result = await send
        if (result?.outcome !== 'success') throw new Error('Agent handoff could not be confirmed')
        return
    }
    if (!signal.aborted) throw new Error('Agent is unavailable')
}
