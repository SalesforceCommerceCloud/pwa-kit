/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Reproduces W-24434346: Storefront Preview shows stale (old shopper context) data after
// the Runtime Admin "reload" message, because a query fetch that started before the
// shopper context changed survives the Refresh route and is reused on remount.
import React from 'react'
import {act, render, screen, waitFor} from '@testing-library/react'
import {QueryClient, QueryClientProvider, useQuery} from '@tanstack/react-query'
import {MemoryRouter, Route, Switch, useHistory} from 'react-router-dom'
import Refresh from './index'

jest.mock('../../utils', () => ({
    getRouterBasePath: jest.fn(() => '')
}))

// Simulates SCAPI: the response reflects the shopper context at *request* time, and is slow.
let serverContext
const SCAPI_LATENCY = 1500
const fetchProduct = jest.fn(() => {
    const contextAtRequestTime = serverContext
    return new Promise((resolve) => setTimeout(() => resolve(contextAtRequestTime), SCAPI_LATENCY))
})

const Product = () => {
    const {data} = useQuery(['product'], fetchProduct, {staleTime: 10 * 1000}) // retail app default
    return <div data-testid="promo">{data}</div>
}

let history
const CaptureHistory = () => {
    history = useHistory()
    return null
}

const renderApp = (queryClient) =>
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/product']}>
                <CaptureHistory />
                <Switch>
                    <Route path="/__pwa-kit/refresh" component={Refresh} />
                    <Route path="/product" component={Product} />
                </Switch>
            </MemoryRouter>
        </QueryClientProvider>
    )

const runPreviewFlow = async (queryClient, {onContextChange} = {}) => {
    // SSR/hydrated data, rendered with the old shopper context
    serverContext = 'no-promo'
    queryClient.setQueryData(['product'], 'no-promo')
    renderApp(queryClient)

    // A refetch starts while the old context is still active
    // (e.g. useUpdateShopperContext's post-hydration invalidateQueries, or a navigation)
    act(() => {
        queryClient.invalidateQueries()
    })
    expect(fetchProduct).toHaveBeenCalledTimes(1)

    // Runtime Admin POSTs create-shopper-context; the new context applies immediately
    serverContext = 'promo'

    // ...then sends the "contextChange" message (StorefrontPreview's onContextChange prop)
    if (onContextChange) {
        await act(() => onContextChange())
    }

    // ...then sends the "reload" message → preview client navigates to the Refresh route
    act(() => {
        history.replace('/__pwa-kit/refresh?referrer=/product')
    })

    await waitFor(() => expect(history.location.pathname).toBe('/product'), {timeout: 5000})
    await waitFor(() => expect(queryClient.isFetching()).toBe(0), {timeout: 5000})
    return screen.getByTestId('promo').textContent
}

beforeEach(() => {
    fetchProduct.mockClear()
})

test('shows new shopper context data after preview reload, even with an in-flight fetch', async () => {
    const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}})
    const text = await runPreviewFlow(queryClient)

    // Without cancelling, Refresh's invalidateQueries leaves the in-flight (old context) fetch
    // running since the page is unmounted, and the remounted useQuery dedupes onto it.
    expect(text).toBe('promo')
    expect(fetchProduct).toHaveBeenCalledTimes(2)
}, 10000)

test('app-level workaround: invalidating in onContextChange while the page is still mounted', async () => {
    const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}})
    const onContextChange = () => queryClient.invalidateQueries()
    const text = await runPreviewFlow(queryClient, {onContextChange})

    expect(text).toBe('promo')
}, 10000)

test('refetches once on return when no fetch is in flight', async () => {
    const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}})
    serverContext = 'promo'
    queryClient.setQueryData(['product'], 'no-promo')
    renderApp(queryClient)

    act(() => {
        history.replace('/__pwa-kit/refresh?referrer=/product')
    })
    await waitFor(() => expect(history.location.pathname).toBe('/product'))
    await waitFor(() => expect(screen.getByTestId('promo').textContent).toBe('promo'), {
        timeout: 5000
    })
    expect(fetchProduct).toHaveBeenCalledTimes(1)
}, 10000)
