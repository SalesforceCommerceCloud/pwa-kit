/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {act, renderHook, waitFor} from '@testing-library/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import useCommerceClientCart from '@salesforce/retail-react-app/app/hooks/use-commerce-client-cart'

const mockBasket = (quantity = 1) => ({
    basketId: 'basket',
    currency: 'USD',
    productSubTotal: 10 * quantity,
    orderTotal: 10 * quantity,
    productItems: [{itemId: 'line', productId: 'variant', quantity}]
})
let mockCustomerId = 'shopper-a'
let mockHttpOnly = false
const mockGetTokenWhenReady = jest.fn()
const mockCustomerKey = (customerId) => [
    '/commerce-sdk-react',
    '/organizations/',
    'org',
    '/customers/',
    customerId,
    '/baskets',
    {siteId: 'site'}
]
const mockApi = {
    shopperCustomers: {getCustomerBaskets: jest.fn()},
    shopperProducts: {getProducts: jest.fn()},
    shopperBasketsV2: {
        getBasket: jest.fn(),
        addItemToBasket: jest.fn(),
        updateItemInBasket: jest.fn(),
        removeItemFromBasket: jest.fn(),
        addCouponToBasket: jest.fn(),
        createBasket: jest.fn()
    }
}
const mockBuildUrl = (path) => '/en-US' + path
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCommerceApi: () => mockApi,
    useAccessToken: () => ({getTokenWhenReady: mockGetTokenWhenReady}),
    useConfig: () => ({enableHttpOnlySessionCookies: mockHttpOnly}),
    useCustomerId: () => mockCustomerId,
    useCustomerType: () => ({customerType: 'guest'}),
    useUsid: () => ({usid: mockCustomerId}),
    useCustomerBaskets: ({parameters: {customerId}}) =>
        jest.requireActual('@tanstack/react-query').useQuery({
            queryKey: mockCustomerKey(customerId),
            queryFn: jest.fn(),
            enabled: false,
            initialData: {baskets: [mockBasket()], total: 1}
        })
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-currency', () => ({
    useCurrency: () => ({currency: 'USD'})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({site: {id: 'site'}, locale: {id: 'en-US'}, buildUrl: mockBuildUrl})
}))
let queryClient
let update
const setup = () =>
    renderHook((props) => useCommerceClientCart(props), {
        initialProps: {enabled: true, ready: true},
        wrapper: ({children}) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        )
    })
const action = (request) =>
    new Promise((resolve) => {
        act(() =>
            window.dispatchEvent(
                new CustomEvent('cimulate:cart-action', {detail: {...request, respond: resolve}})
            )
        )
    })
beforeEach(() => {
    jest.clearAllMocks()
    mockHttpOnly = false
    mockGetTokenWhenReady.mockReset().mockResolvedValue('token')
    mockApi.shopperProducts.getProducts.mockResolvedValue({data: []})
    mockCustomerId = 'shopper-a'
    mockApi.shopperCustomers.getCustomerBaskets.mockResolvedValue({baskets: [mockBasket()]})
    mockApi.shopperBasketsV2.getBasket.mockResolvedValue(mockBasket())
    mockApi.shopperBasketsV2.addItemToBasket.mockResolvedValue(mockBasket(3))
    queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}})
    update = jest.fn()
    window.CimulateMessaging = {eventHandlers: {cart: {update}}}
})
afterEach(() => {
    queryClient.clear()
    delete window.CimulateMessaging
})

it('direct add updates the cache and returns the cart through the action response', async () => {
    setup()
    await waitFor(() =>
        expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 'basket'}))
    )
    update.mockClear()
    mockApi.shopperBasketsV2.getBasket.mockResolvedValue(mockBasket(3))
    let response
    await act(async () => {
        response = await action({action: 'add', productId: 'variant', quantity: 3})
    })
    expect(response).toMatchObject({ok: true, cart: {items: [{quantity: 3}]}})
    expect(mockApi.shopperBasketsV2.addItemToBasket).toHaveBeenCalledTimes(1)
    expect(mockApi.shopperBasketsV2.addItemToBasket).toHaveBeenCalledWith({
        parameters: {basketId: 'basket'},
        headers: {Authorization: 'Bearer token'},
        body: [{productId: 'variant', quantity: 3}]
    })
    expect(
        queryClient.getQueryData(mockCustomerKey(mockCustomerId)).baskets[0].productItems[0]
            .quantity
    ).toBe(3)
    expect(update).not.toHaveBeenCalled()
})

it('waits for auth and uses the session cookie for customer, basket, catalog and mutation requests', async () => {
    mockHttpOnly = true
    let ready
    mockGetTokenWhenReady.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                ready = resolve
            })
    )
    setup()
    await waitFor(() => expect(ready).toBeDefined())
    expect(mockApi.shopperCustomers.getCustomerBaskets).not.toHaveBeenCalled()
    ready('token')
    await waitFor(() =>
        expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 'basket'}))
    )
    await act(async () =>
        expect(await action({action: 'add', productId: 'variant', quantity: 1})).toMatchObject({
            ok: true
        })
    )
    for (const method of [
        mockApi.shopperCustomers.getCustomerBaskets,
        mockApi.shopperBasketsV2.getBasket,
        mockApi.shopperProducts.getProducts,
        mockApi.shopperBasketsV2.addItemToBasket
    ]) {
        expect(method).toHaveBeenCalledWith(expect.objectContaining({headers: {}}))
    }
})

it.each(['write authentication', 'basket creation'])(
    'does not add an item after %s outlasts the action',
    async (stage) => {
        setup()
        await waitFor(() =>
            expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 'basket'}))
        )
        let release
        const wait = () =>
            new Promise((resolve) => {
                release = resolve
            })
        if (stage === 'basket creation') {
            mockApi.shopperCustomers.getCustomerBaskets.mockResolvedValueOnce({baskets: []})
            mockApi.shopperBasketsV2.createBasket.mockImplementationOnce(wait)
        } else {
            mockGetTokenWhenReady.mockResolvedValueOnce('token').mockImplementationOnce(wait)
        }
        jest.useFakeTimers()
        try {
            const add = {action: 'add', productId: 'variant', quantity: 1}
            const pending = action(add)
            await jest.advanceTimersByTimeAsync(0)
            expect(release).toBeDefined()
            await jest.advanceTimersByTimeAsync(8001)
            const response = await pending
            expect(response.ok).toBe(false)
            release(stage === 'basket creation' ? {basketId: 'created'} : 'token')
            await jest.advanceTimersByTimeAsync(0)
            expect(mockApi.shopperBasketsV2.addItemToBasket).not.toHaveBeenCalled()
            await act(async () =>
                expect(await action(add)).toMatchObject({ok: stage === 'write authentication'})
            )
            await act(async () => expect(await action({action: 'get'})).toMatchObject({ok: true}))
            await act(async () => expect(await action(add)).toMatchObject({ok: true}))
            expect(mockApi.shopperBasketsV2.addItemToBasket).toHaveBeenCalledTimes(
                stage === 'write authentication' ? 2 : 1
            )
        } finally {
            jest.useRealTimers()
        }
    }
)

it('storefront cache updates, confirmed agent events and same-origin iframe signals trigger fresh reads', async () => {
    setup()
    await waitFor(() =>
        expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 'basket'}))
    )
    mockApi.shopperBasketsV2.getBasket.mockResolvedValue(mockBasket(4))
    act(() => queryClient.setQueryData(mockCustomerKey(mockCustomerId), {baskets: [mockBasket(2)]}))
    await waitFor(() =>
        expect(update).toHaveBeenLastCalledWith(
            expect.objectContaining({items: [expect.objectContaining({quantity: 4})]})
        )
    )
    for (const event of ['cimulate:cart-update', 'commerceclient:cart-changed']) {
        update.mockClear()
        act(() => window.dispatchEvent(new CustomEvent(event, {detail: {basket: mockBasket(99)}})))
        await waitFor(() =>
            expect(update).toHaveBeenCalledWith(
                expect.objectContaining({items: [expect.objectContaining({quantity: 4})]})
            )
        )
    }
})

it('responds to get, quantity, removal and coupon actions without a competing cart push', async () => {
    setup()
    await waitFor(() =>
        expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 'basket'}))
    )
    update.mockClear()
    await act(async () =>
        expect(await action({action: 'get'})).toMatchObject({ok: true, cart: {id: 'basket'}})
    )
    expect(update).not.toHaveBeenCalled()
    for (const [request, method, body] of [
        [
            {action: 'quantity', productId: 'variant', itemId: 'line', quantity: 2},
            'updateItemInBasket',
            {quantity: 2}
        ],
        [
            {action: 'remove', productId: 'variant', itemId: 'line'},
            'removeItemFromBasket',
            undefined
        ],
        [{action: 'coupon', code: ' SAVE '}, 'addCouponToBasket', {code: 'SAVE'}]
    ]) {
        await act(async () =>
            expect(await action(request)).toMatchObject({ok: true, cart: {id: 'basket'}})
        )
        expect(update).not.toHaveBeenCalled()
        expect(mockApi.shopperBasketsV2[method]).toHaveBeenCalledWith({
            parameters: {basketId: 'basket', ...(request.itemId ? {itemId: 'line'} : {})},
            headers: {Authorization: 'Bearer token'},
            ...(body ? {body} : {})
        })
    }
})

it('does not publish an old shopper response into the new cache', async () => {
    const {rerender} = setup()
    await waitFor(() =>
        expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 'basket'}))
    )
    let release
    mockApi.shopperBasketsV2.getBasket.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                release = resolve
            })
    )
    const pending = action({action: 'get'})
    await waitFor(() => expect(release).toBeDefined())
    mockCustomerId = 'shopper-b'
    mockApi.shopperBasketsV2.getBasket.mockResolvedValue(mockBasket(7))
    rerender({enabled: true, ready: true})
    await act(async () => {
        release(mockBasket(99))
        await pending
    })
    await waitFor(() =>
        expect(update).toHaveBeenLastCalledWith(
            expect.objectContaining({items: [expect.objectContaining({quantity: 7})]})
        )
    )
    expect(
        queryClient.getQueryData(mockCustomerKey('shopper-b')).baskets[0].productItems[0].quantity
    ).toBe(7)
    expect(update).not.toHaveBeenCalledWith(
        expect.objectContaining({items: [expect.objectContaining({quantity: 99})]})
    )
})

it('uncertain writes are not retried and only View Cart can recover editing', async () => {
    setup()
    await waitFor(() =>
        expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 'basket'}))
    )
    mockApi.shopperBasketsV2.addItemToBasket.mockRejectedValueOnce(new Error('lost response'))
    await act(async () =>
        expect(await action({action: 'add', productId: 'variant', quantity: 1})).toMatchObject({
            ok: false
        })
    )
    act(() => window.dispatchEvent(new CustomEvent('commerceclient:cart-changed')))
    await act(async () =>
        expect(await action({action: 'add', productId: 'variant', quantity: 1})).toMatchObject({
            ok: false
        })
    )
    expect(mockApi.shopperBasketsV2.addItemToBasket).toHaveBeenCalledTimes(1)
    await act(async () => expect(await action({action: 'get'})).toMatchObject({ok: true}))
    await act(async () =>
        expect(await action({action: 'add', productId: 'variant', quantity: 1})).toMatchObject({
            ok: true
        })
    )
    expect(mockApi.shopperBasketsV2.addItemToBasket).toHaveBeenCalledTimes(2)
})

it('agent mode installs no direct action listener or basket reads', async () => {
    const {unmount} = setup()
    unmount()
    mockApi.shopperCustomers.getCustomerBaskets.mockClear()
    renderHook(() => useCommerceClientCart({enabled: false, ready: true}), {
        wrapper: ({children}) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        )
    })
    act(() =>
        window.dispatchEvent(
            new CustomEvent('cimulate:cart-action', {
                detail: {action: 'add', productId: 'variant', quantity: 1, respond: jest.fn()}
            })
        )
    )
    expect(mockApi.shopperBasketsV2.addItemToBasket).not.toHaveBeenCalled()
    expect(mockApi.shopperCustomers.getCustomerBaskets).not.toHaveBeenCalled()
})

it('creates a basket in the active currency only when adding to an empty cart', async () => {
    mockApi.shopperCustomers.getCustomerBaskets
        .mockResolvedValueOnce({baskets: []})
        .mockResolvedValueOnce({baskets: []})
        .mockResolvedValueOnce({baskets: [mockBasket()]})
    mockApi.shopperBasketsV2.createBasket.mockResolvedValue({basketId: 'new-basket'})
    setup()
    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({items: []})))
    mockApi.shopperCustomers.getCustomerBaskets
        .mockResolvedValueOnce({baskets: []})
        .mockResolvedValue({baskets: [mockBasket()]})
    await act(async () =>
        expect(await action({action: 'add', productId: 'variant', quantity: 1})).toMatchObject({
            ok: true
        })
    )
    expect(mockApi.shopperBasketsV2.createBasket).toHaveBeenCalledWith({
        body: {currency: 'USD'},
        headers: {Authorization: 'Bearer token'}
    })
    expect(mockApi.shopperBasketsV2.addItemToBasket).toHaveBeenCalledWith(
        expect.objectContaining({parameters: {basketId: 'new-basket'}})
    )
})
