/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {handoffSearch} from '@salesforce/retail-react-app/app/utils/commerce-agent-search-handoff'

test('passes page context before opening the drawer and queues the original search once', async () => {
    const signal = new AbortController().signal
    const toggleWidgetOpen = jest.fn()
    const widget = {
        setPageContext: jest.fn(),
        sendMessage: jest.fn().mockResolvedValue({outcome: 'success'}),
        eventHandlers: {components: {toggleWidgetOpen}}
    }
    const getWidget = jest.fn().mockReturnValueOnce(null).mockReturnValue(widget)
    const query = 'How do I return an order?'
    await handoffSearch(query, signal, {getWidget, wait: jest.fn().mockResolvedValue()})
    const pageContext = {type: 'srp', query}
    expect(widget.setPageContext).toHaveBeenCalledWith(pageContext)
    expect(toggleWidgetOpen).toHaveBeenCalledWith(true)
    expect(widget.setPageContext.mock.invocationCallOrder[0]).toBeLessThan(
        widget.sendMessage.mock.invocationCallOrder[0]
    )
    expect(widget.sendMessage.mock.invocationCallOrder[0]).toBeLessThan(
        toggleWidgetOpen.mock.invocationCallOrder[0]
    )
    expect(widget.sendMessage.mock.calls).toEqual([
        [query, {displayContent: query, pageContextSnapshot: pageContext, hideWelcome: true}]
    ])
})

test('does not open chat for a cancelled search', async () => {
    const controller = new AbortController()
    controller.abort()
    const getWidget = jest.fn()
    await handoffSearch('basketball shoes', controller.signal, {getWidget})
    expect(getWidget).not.toHaveBeenCalled()
})

test('retries an async not-ready rejection before opening the drawer', async () => {
    const sendMessage = jest
        .fn()
        .mockRejectedValueOnce(new Error('Messaging widget not ready until it has mounted'))
        .mockResolvedValueOnce({outcome: 'success'})
    const toggleWidgetOpen = jest.fn()
    const widget = {
        setPageContext: jest.fn(),
        sendMessage,
        eventHandlers: {components: {toggleWidgetOpen}}
    }
    await handoffSearch('basketball shoes', new AbortController().signal, {
        getWidget: () => widget,
        wait: jest.fn().mockResolvedValue()
    })
    expect(sendMessage).toHaveBeenCalledTimes(2)
    expect(toggleWidgetOpen).toHaveBeenCalledTimes(1)
})

test('sends the utterance with a widget that only supports PDP context', async () => {
    const query = 'Can you help me choose basketball shoes?'
    const widget = {
        setPageContext: jest.fn(() => {
            throw new Error('Unsupported page context type: srp')
        }),
        sendMessage: jest.fn().mockResolvedValue({outcome: 'success'}),
        eventHandlers: {components: {toggleWidgetOpen: jest.fn()}}
    }
    await handoffSearch(query, new AbortController().signal, {getWidget: () => widget})
    expect(widget.sendMessage).toHaveBeenCalledTimes(1)
    expect(widget.sendMessage).toHaveBeenCalledWith(
        query,
        expect.objectContaining({hideWelcome: true})
    )
    expect(widget.eventHandlers.components.toggleWidgetOpen).toHaveBeenCalledWith(true)
})
