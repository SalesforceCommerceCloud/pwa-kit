/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {TextDecoder} from 'node:util'
import {act, renderHook, waitFor} from '@testing-library/react'
import useCommerceAgentSearch from '@salesforce/retail-react-app/app/hooks/use-commerce-agent-search'
import {handoffSearch} from '@salesforce/retail-react-app/app/utils/commerce-agent-search-handoff'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useAccessToken: () => ({getTokenWhenReady: async () => 'shopper-token'})
}))
jest.mock('@salesforce/retail-react-app/app/utils/commerce-agent-search-handoff')

const search = {query: 'vest', siteId: 'test-site', locale: 'en-US', currency: 'USD'}
const jsonResponse = (body) => ({ok: true, json: async () => body})
const originalDecoder = global.TextDecoder

beforeEach(() => {
    global.TextDecoder = TextDecoder
    jest.spyOn(global, 'fetch')
    handoffSearch.mockResolvedValue(undefined)
})

afterEach(() => {
    global.TextDecoder = originalDecoder
    jest.restoreAllMocks()
    jest.clearAllMocks()
})

test('streams a search turn without using the query product payload', async () => {
    let finishStream
    const completed = new Promise((resolve) => {
        finishStream = () =>
            resolve({value: Buffer.from('event: completed\ndata: {"turnId":"turn_test"}\n\n')})
    })
    const reader = {
        read: jest
            .fn()
            .mockResolvedValueOnce({
                value: Buffer.from(
                    'event: content_delta\ndata: {"turnId":"turn_test","content":{"type":"ai_overview","delta":"A vest for cooler days."}}\n\n'
                )
            })
            .mockReturnValueOnce(completed),
        cancel: jest.fn().mockResolvedValue(undefined),
        releaseLock: jest.fn()
    }
    global.fetch
        .mockResolvedValueOnce(
            jsonResponse({route: 'search', nextStep: {type: 'stream', turnId: 'turn_test'}})
        )
        .mockResolvedValueOnce({
            ok: true,
            headers: {get: () => 'text/event-stream'},
            body: {getReader: () => reader}
        })

    const {result} = renderHook(() => useCommerceAgentSearch(true, search, 'vest', true))
    await waitFor(() => expect(result.current.text).toBe('A vest for cooler days.'))
    expect(result.current.streaming).toBe(true)
    expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/commerce-agent/turns/turn_test/events?siteId=test-site',
        expect.objectContaining({
            headers: {Authorization: 'Bearer shopper-token', Accept: 'text/event-stream'}
        })
    )
    await act(async () => finishStream())
    expect(result.current.streaming).toBe(false)
})

test('cancels an old search and hands off the current agent route once', async () => {
    let finishOldQuery
    const oldQuery = new Promise((resolve) => {
        finishOldQuery = () => resolve(jsonResponse({route: 'agent'}))
    })
    global.fetch.mockReturnValueOnce(oldQuery).mockResolvedValueOnce(jsonResponse({route: 'agent'}))

    const {result, rerender} = renderHook(
        ({query}) => useCommerceAgentSearch(true, {...search, query}, query, true),
        {initialProps: {query: 'vest'}}
    )
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    const oldSignal = global.fetch.mock.calls[0][1].signal
    rerender({query: 'jacket'})
    await waitFor(() => expect(result.current.agentRouted).toBe(true))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => finishOldQuery())
    expect(handoffSearch).toHaveBeenCalledTimes(1)
    expect(handoffSearch).toHaveBeenCalledWith('jacket', expect.anything(), {
        question: 'jacket',
        results: undefined
    })
})

test('keeps agent handoff manual on direct navigation', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({route: 'agent'}))
    const {result} = renderHook(() => useCommerceAgentSearch(true, search, 'vest', false))
    await waitFor(() => expect(result.current.agentRouted).toBe(true))
    expect(handoffSearch).not.toHaveBeenCalled()
    await act(async () => result.current.openAgent())
    expect(handoffSearch).toHaveBeenCalledTimes(1)
})

test.each([jsonResponse({route: 'search'}), {ok: false}])(
    'finishes quietly when the query does not yield a turn',
    async (response) => {
        global.fetch.mockResolvedValueOnce(response)
        const {result} = renderHook(() => useCommerceAgentSearch(true, search, 'vest', false))
        await act(async () => {})
        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(result.current.hasOverview).toBeUndefined()
        expect(result.current.error).toBeUndefined()
    }
)
