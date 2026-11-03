/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    openSearchConversation,
    sendAgentHandoff
} from '@salesforce/retail-react-app/app/utils/search-agent-handoff'
import {searchPageContext} from '@salesforce/retail-react-app/app/utils/search-page-context'

const payload = {
    query: 'boots',
    message: 'boots with previous overview context',
    page_context: {type: 'srp', query: 'boots'}
}
const sdk = () => ({
    setPageContext: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue({outcome: 'success'}),
    eventHandlers: {components: {toggleWidgetOpen: jest.fn()}}
})
const session = () => ({
    active: {
        contextId: 'context',
        revision: 'turn-3',
        token: 'shopper',
        getToken: async () => 'shopper'
    },
    handoffs: new Map()
})

test('sets context before opening, then queues one query with the visible query and page snapshot', async () => {
    const widget = sdk()
    await sendAgentHandoff(payload, {sdk: widget})
    expect(widget.setPageContext).toHaveBeenCalledWith(payload.page_context)
    expect(widget.setPageContext.mock.invocationCallOrder[0]).toBeLessThan(
        widget.eventHandlers.components.toggleWidgetOpen.mock.invocationCallOrder[0]
    )
    expect(widget.sendMessage).toHaveBeenCalledWith(payload.message, {
        displayContent: 'boots',
        pageContextSnapshot: payload.page_context
    })
    expect(widget.sendMessage).toHaveBeenCalledTimes(1)
})
test('waits for SDK registration but never retries an accepted send whose result times out', async () => {
    const widget = sdk(),
        wait = jest.fn().mockResolvedValue()
    widget.sendMessage.mockImplementationOnce(() => {
        throw new Error(
            'Cimulate messaging widget is not ready. Call after the widget has mounted.'
        )
    })
    await sendAgentHandoff(payload, {sdk: widget, wait})
    expect(wait).toHaveBeenCalledTimes(1)
    widget.sendMessage.mockClear().mockResolvedValue({outcome: 'timeout'})
    await expect(sendAgentHandoff(payload, {sdk: widget, wait})).rejects.toThrow('not_confirmed')
    expect(widget.sendMessage).toHaveBeenCalledTimes(1)
})
test('repeated opens reuse the same handoff and do not resend a query', async () => {
    const state = session(),
        fetchImpl = jest.fn().mockResolvedValue({ok: true, json: async () => payload}),
        send = jest.fn().mockResolvedValue(),
        open = jest.fn()
    await Promise.all([
        openSearchConversation(state, {fetchImpl, send, open}),
        openSearchConversation(state, {fetchImpl, send, open})
    ])
    await openSearchConversation(state, {fetchImpl, send, open})
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/search-assistant/handoff')
})
test('auth changes and active model work prevent transmitting a previous conversation', async () => {
    const state = session(),
        fetchImpl = jest.fn(),
        send = jest.fn()
    state.active.getToken = async () => 'new-shopper'
    await expect(openSearchConversation(state, {fetchImpl, send})).rejects.toThrow('expired')
    state.active.busy = true
    await expect(openSearchConversation(state, {fetchImpl, send})).rejects.toThrow('not_ready')
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
})
test('an uncertain send is reserved so opening the panel again cannot duplicate it', async () => {
    const state = session(),
        fetchImpl = jest.fn().mockResolvedValue({ok: true, json: async () => payload}),
        send = jest.fn().mockRejectedValue(new Error('handoff_not_confirmed')),
        open = jest.fn()
    await expect(openSearchConversation(state, {fetchImpl, send, open})).rejects.toThrow()
    await expect(openSearchConversation(state, {fetchImpl, send, open})).rejects.toThrow()
    expect(send).toHaveBeenCalledTimes(1)
})
test('search context preserves typed refinements and numeric price bounds', () => {
    expect(
        searchPageContext('boots', ['color=red|blue', 'color=green', 'price=(10..150)'])
    ).toEqual({
        type: 'srp',
        query: 'boots',
        refinements: [{name: 'color', values: ['red', 'blue', 'green']}],
        minPrice: 10,
        maxPrice: 150
    })
    expect(searchPageContext('')).toBeUndefined()
})
