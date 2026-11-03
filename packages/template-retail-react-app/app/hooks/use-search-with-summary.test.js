/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, waitFor, act} from '@testing-library/react'
import useSearchWithSummary from '@salesforce/retail-react-app/app/hooks/use-search-with-summary'
import {SearchAssistantSessionProvider} from '@salesforce/retail-react-app/app/contexts/search-assistant-session'

const mockGetToken = jest.fn().mockResolvedValue('shopper')
const mockNavigation = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useAccessToken: () => ({getTokenWhenReady: mockGetToken}),
    useProductSearch: jest.fn(() => ({}))
}))
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => ({app: {searchSummary: {enabled: true}}})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({site: {id: 'NTOManaged'}, locale: {id: 'en-US'}})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-currency', () => ({
    useCurrency: () => ({currency: 'USD'})
}))
jest.mock('@salesforce/retail-react-app/app/utils/search-assistant-stream', () => ({
    readAssistantResponse: async (response, onEvent) => {
        if (response.wait) await response.wait
        if (!response.ok) throw new Error('request failed')
        for (const [event, data] of response.events) onEvent(event, data)
    }
}))
const wrapper = ({children}) => (
    <SearchAssistantSessionProvider>{children}</SearchAssistantSessionProvider>
)
const overview = (query, history = []) => ({
    ok: true,
    status: 200,
    events: [
        [
            'products',
            {
                session_id: 'one-session',
                context_id: query,
                search_key: query,
                result: {total: 2, hits: [{productId: '1'}]},
                picks: [],
                suggestions: [{id: query, question: `Compare ${query} options`}],
                history
            }
        ],
        ['content_delta', {text: `Overview for ${query}`}],
        [
            'completed',
            {
                search_key: query,
                history: [
                    ...history,
                    {
                        id: `${query}-overview`,
                        kind: 'overview',
                        contextId: query,
                        searchKey: query,
                        question: query,
                        text: `Overview for ${query}`
                    }
                ],
                suggestions: [{id: query, question: `Compare ${query} options`}]
            }
        ]
    ]
})
let originalFetch
beforeEach(() => {
    originalFetch = global.fetch
    window.sessionStorage.clear()
    mockNavigation.mockClear()
})
afterEach(() => {
    global.fetch = originalFetch
})
const useSearch = ({query}) =>
    useSearchWithSummary({parameters: {q: query}}, {}, true, mockNavigation)

test('a new query keeps the session but shows only that search conversation', async () => {
    const oldTurn = {
        id: 'old',
        searchKey: 'boots',
        kind: 'answer',
        question: 'Which is cheaper?',
        text: 'The first boot.'
    }
    global.fetch = jest
        .fn()
        .mockResolvedValueOnce(overview('boots'))
        .mockResolvedValueOnce(overview('jackets', [oldTurn]))
    const {result, rerender} = renderHook(useSearch, {initialProps: {query: 'boots'}, wrapper})
    await waitFor(() => expect(result.current.contextId).toBe('boots'))
    rerender({query: 'jackets'})
    await waitFor(() => expect(result.current.contextId).toBe('jackets'))
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).sessionId).toBe('one-session')
    expect(result.current.followUps).toEqual([])
    expect(result.current.suggestions[0].id).toBe('jackets')
})
test('follow-ups keep the current result context and refresh result-derived suggestions', async () => {
    global.fetch = jest
        .fn()
        .mockResolvedValueOnce(overview('boots'))
        .mockResolvedValueOnce({
            ok: true,
            status: 200,
            events: [
                ['content_delta', {text: 'The first boot is cheaper.'}],
                [
                    'completed',
                    {
                        history: [{id: 'answer-2'}],
                        suggestions: [{id: 'waterproof', question: 'Which boots are waterproof?'}]
                    }
                ]
            ]
        })
    const {result} = renderHook(useSearch, {initialProps: {query: 'boots'}, wrapper})
    await waitFor(() => expect(result.current.contextId).toBe('boots'))
    await act(async () => {
        await result.current.askFollowUp('Which is cheaper?')
    })
    expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({
        contextId: 'boots',
        message: 'Which is cheaper?'
    })
    expect(result.current.followUps.at(-1).text).toBe('The first boot is cheaper.')
    expect(result.current.suggestions).toEqual([
        {id: 'waterproof', question: 'Which boots are waterproof?'}
    ])
})
test('an expired conversation starts a fresh session on search instead of reusing stale history', async () => {
    window.sessionStorage.setItem('pwa-search-assistant-session', 'expired-session')
    global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ok: false, status: 404})
        .mockResolvedValueOnce(overview('boots'))
    const {result} = renderHook(useSearch, {initialProps: {query: 'boots'}, wrapper})
    await waitFor(() => expect(result.current.contextId).toBe('boots'))
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).sessionId).toBe('expired-session')
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).sessionId).toBeNull()
    expect(window.sessionStorage.getItem('pwa-search-assistant-session')).toBe('one-session')
})

test('same-search follow-ups survive reload, while overview duplicates and other searches are excluded', async () => {
    const currentTurn = {
        id: 'current',
        searchKey: 'jackets',
        question: 'Which jacket is warmer?',
        text: 'The insulated jacket.'
    }
    const otherTurn = {
        id: 'old',
        searchKey: 'bike computers',
        question: 'bike computers',
        text: 'Bike computer results.'
    }
    const previousOverview = {
        id: 'overview-old',
        searchKey: 'jackets',
        kind: 'overview',
        question: 'jackets',
        text: 'Previous overview.'
    }
    global.fetch = jest
        .fn()
        .mockResolvedValue(overview('jackets', [otherTurn, previousOverview, currentTurn]))
    const {result} = renderHook(useSearch, {initialProps: {query: 'jackets'}, wrapper})
    await waitFor(() => expect(result.current.contextId).toBe('jackets'))
    expect(result.current.followUps).toEqual([currentTurn])
    expect(JSON.stringify(result.current)).not.toContain('Bike computer results')
})

test('late events from a previous search cannot overwrite the current result context', async () => {
    let release
    const wait = new Promise((resolve) => {
        release = resolve
    })
    global.fetch = jest
        .fn()
        .mockResolvedValueOnce({...overview('bike computers'), wait})
        .mockResolvedValueOnce(overview('jackets'))
    const {result, rerender} = renderHook(useSearch, {
        initialProps: {query: 'bike computers'},
        wrapper
    })
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    rerender({query: 'jackets'})
    await waitFor(() => expect(result.current.contextId).toBe('jackets'))
    await act(async () => {
        release()
        await wait
    })
    expect(result.current.summary).toBe('Overview for jackets')
    expect(result.current.contextId).toBe('jackets')
    expect(result.current.followUps).toEqual([])
})
