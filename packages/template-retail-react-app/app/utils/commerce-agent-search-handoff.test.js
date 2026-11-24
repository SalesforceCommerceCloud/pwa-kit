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
        toggleWidgetOpen.mock.invocationCallOrder[0]
    )
    expect(widget.sendMessage.mock.calls).toEqual([
        [query, {displayContent: query, pageContextSnapshot: pageContext}]
    ])
})

test('passes the selected question and real results into the existing chat', async () => {
    const signal = new AbortController().signal
    const widget = {
        setPageContext: jest.fn(),
        sendMessage: jest.fn().mockResolvedValue({outcome: 'success'}),
        eventHandlers: {components: {toggleWidgetOpen: jest.fn()}}
    }
    const query = 'linen shirts'
    const question = 'Which of these would be best for a wedding?'
    const results = {
        resultCount: 32,
        matches: ['Linen Resort Shirt'],
        overview: 'Lightweight options.'
    }
    await handoffSearch(query, signal, {question, results, getWidget: () => widget})
    expect(widget.setPageContext).toHaveBeenCalledWith({type: 'srp', query})
    expect(widget.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify({query, ...results})),
        {displayContent: question, pageContextSnapshot: {type: 'srp', query}}
    )
})
