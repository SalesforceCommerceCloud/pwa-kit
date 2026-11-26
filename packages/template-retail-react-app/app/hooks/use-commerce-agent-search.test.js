/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act, renderHook, waitFor} from '@testing-library/react'
import useCommerceAgentSearch from '@salesforce/retail-react-app/app/hooks/use-commerce-agent-search'
import {handoffSearch} from '@salesforce/retail-react-app/app/utils/commerce-agent-search-handoff'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useAccessToken: () => ({getTokenWhenReady: async () => 'shopper-token'})
}))
jest.mock('@salesforce/retail-react-app/app/utils/commerce-agent-search-handoff')

const search = {query: 'vest', siteId: 'test-site', locale: 'en-US', currency: 'USD'}
const jsonResponse = (body) => ({ok: true, json: async () => body})

beforeEach(() => {
    jest.spyOn(global, 'fetch')
    handoffSearch.mockResolvedValue(undefined)
})

afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
})

test('classifies a normal search without starting chat or requesting any other AI endpoint', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({type: 'search'}))

    renderHook(() => useCommerceAgentSearch(true, search, 'vest', true))
    await act(async () => {})
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
        '/api/commerce-agent/classify?siteId=test-site&query=vest',
        expect.objectContaining({method: 'GET', headers: {Authorization: 'Bearer shopper-token'}})
    )
    expect(handoffSearch).not.toHaveBeenCalled()
})

test('cancels an old search and hands off the current agent route once', async () => {
    let finishOldQuery
    const oldQuery = new Promise((resolve) => {
        finishOldQuery = () => resolve(jsonResponse({type: 'agent'}))
    })
    global.fetch.mockReturnValueOnce(oldQuery).mockResolvedValueOnce(jsonResponse({type: 'agent'}))

    const {rerender} = renderHook(
        ({query}) => useCommerceAgentSearch(true, {...search, query}, query, true),
        {initialProps: {query: 'vest'}}
    )
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    const oldSignal = global.fetch.mock.calls[0][1].signal
    rerender({query: 'jacket'})
    await waitFor(() => expect(handoffSearch).toHaveBeenCalledWith('jacket', expect.anything()))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => finishOldQuery())
    expect(handoffSearch).toHaveBeenCalledTimes(1)
    expect(handoffSearch).toHaveBeenCalledWith('jacket', expect.anything())
})

test('does not automatically hand off on direct navigation', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse({type: 'agent'}))
    renderHook(() => useCommerceAgentSearch(true, search, 'vest', false))
    await act(async () => {})
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(handoffSearch).not.toHaveBeenCalled()
})

test.each([jsonResponse({type: 'search'}), {ok: false, status: 502}])(
    'leaves native results alone on the search route or a classification failure',
    async (response) => {
        global.fetch.mockResolvedValueOnce(response)
        renderHook(() => useCommerceAgentSearch(true, search, 'vest', true))
        await act(async () => {})
        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(handoffSearch).not.toHaveBeenCalled()
    }
)
