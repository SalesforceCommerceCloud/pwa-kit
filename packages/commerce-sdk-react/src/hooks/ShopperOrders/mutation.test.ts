/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQueryClient} from '@tanstack/react-query'
import {act} from '@testing-library/react'
import {ShopperCustomersTypes, ShopperOrdersTypes} from 'commerce-sdk-isomorphic'
import nock from 'nock'
import {
    assertInvalidateQuery,
    DEFAULT_TEST_CONFIG,
    mockMutationEndpoints,
    mockQueryEndpoint,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'
import {useCustomerOrders} from '../ShopperCustomers'
import {ApiClients, Argument} from '../types'
import {ShopperOrdersMutation, useShopperOrdersMutation} from './mutation'
import * as queries from './query'
import {CLIENT_KEYS} from '../../constant'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_ORDERS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>
const ordersEndpoint = '/checkout/shopper-orders/'
const OPTIONS: Argument<Client[ShopperOrdersMutation]> = {
    parameters: {orderNo: ''},
    body: {basketId: 'basketId'}
}
const customersEndpoint = '/customer/shopper-customers/'
const CUSTOMER_ID = 'customer_id'
const ORDER: ShopperOrdersTypes.Order = {orderNo: '123', productItems: []}
const ORDER_NO = '123'
const getCustomerOrdersOptions: Argument<
    NonNullable<ApiClients['shopperCustomers']>['getCustomerOrders']
> = {
    parameters: {customerId: CUSTOMER_ID}
}
const emptyCustomerOrders: ShopperCustomersTypes.CustomerOrderResult = {
    data: [] as ShopperCustomersTypes.CustomerOrderResult['data'],
    total: 0,
    limit: 0,
    offset: 0
}
const PAYMENT_INSTRUMENT_ID = '123'
const PAYMENT_INSTRUMENT_REQUEST = {
    amount: 10,
    bankRoutingNumber: '',
    giftCertificateCode: '',
    paymentCard: {
        cardType: 'visa',
        creditCardToken: '',
        expirationMonth: 9,
        expirationYear: 2099,
        holder: '',
        issueNumber: '',
        maskedNumber: '',
        validFromMonth: 9,
        validFromYear: 2000
    },
    paymentMethodId: ''
}

const createOptions = <Method extends Exclude<keyof Client, 'clientConfig'>>(
    body: Argument<Client[Method]> extends {body: infer B} ? B : undefined,
    parameters: Omit<Argument<Client[Method]>['parameters'], 'orderNo'>
): Argument<Client[Method]> => ({
    body,
    parameters: {orderNo: ORDER_NO, ...parameters}
})

const createPaymentOptions = createOptions<'createPaymentInstrumentForOrder'>(
    PAYMENT_INSTRUMENT_REQUEST,
    {}
)
const updatePaymentOptions = createOptions<'updatePaymentInstrumentForOrder'>(
    PAYMENT_INSTRUMENT_REQUEST,
    {paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
)
const removePaymentOptions = createOptions<'removePaymentInstrumentFromOrder'>(undefined, {
    paymentInstrumentId: PAYMENT_INSTRUMENT_ID
})
const cancelOmsOrderOptions = createOptions<'cancelOmsOrder'>({reason: 'Changed my mind'}, {})
const returnOmsOrderOptions = createOptions<'returnOmsOrder'>(
    {productItems: [{itemId: 'item-1', quantity: 1, reason: 'damaged'}]},
    {}
)

// --- TEST CASES --- //
/** Every mutation modifies an existing order, except `createOrder`, which creates one. */
type NonCreateMutation = Exclude<ShopperOrdersMutation, 'createOrder'>
// This is an object rather than an array to more easily ensure we cover all mutations
type TestMap = {[Mut in NonCreateMutation]?: Argument<Client[Mut]>}
const testMap: TestMap = {
    createPaymentInstrumentForOrder: createPaymentOptions,
    updatePaymentInstrumentForOrder: updatePaymentOptions,
    removePaymentInstrumentFromOrder: removePaymentOptions,
    cancelOmsOrder: cancelOmsOrderOptions,
    returnOmsOrder: returnOmsOrderOptions
}

// Type assertion because the built-in type definition for `Object.entries` is limited :\
const nonCreateTestCases = Object.entries(testMap) as ReadonlyArray<
    [NonCreateMutation, TestMap[NonCreateMutation]]
>
const createTestCase = ['createOrder', OPTIONS] as const
const allTestCases = [...nonCreateTestCases, createTestCase]

describe('ShopperOrders mutations', () => {
    const storedCustomerIdKey = `customer_id_${DEFAULT_TEST_CONFIG.siteId}`
    beforeAll(() => {
        if (window.localStorage.length > 0) throw new Error('Unexpected data in local storage.')
        window.localStorage.setItem(storedCustomerIdKey, CUSTOMER_ID)
    })
    afterAll(() => {
        window.localStorage.removeItem(storedCustomerIdKey)
    })

    beforeEach(() => nock.cleanAll())
    test.each(allTestCases)('`%s` returns data on success', async (mutationName, options) => {
        mockMutationEndpoints(ordersEndpoint, ORDER)
        const {result} = renderHookWithProviders(() => {
            return useShopperOrdersMutation(mutationName)
        })
        expect(result.current.data).toBeUndefined()
        act(() => {
            // I'm not sure why this type assertion is necessary... :\
            type Opts = Parameters<typeof result.current.mutate>[0]
            result.current.mutate(options as Opts)
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(ORDER)
    })
    test.each(allTestCases)('`%s` returns error on error', async (mutationName, options) => {
        mockMutationEndpoints(ordersEndpoint, {error: true}, 400)
        const {result} = renderHookWithProviders(() => {
            return useShopperOrdersMutation(mutationName)
        })
        expect(result.current.error).toBeNull()
        act(() => {
            type Opts = Parameters<typeof result.current.mutate>[0]
            result.current.mutate(options as Opts)
        })
        await waitAndExpectError(() => result.current)
        // Validate that we get a `ResponseError` from commerce-sdk-isomorphic. Ideally, we could do
        // `.toBeInstanceOf(ResponseError)`, but the class isn't exported. :\
        expect(result.current.error).toHaveProperty('response')
    })
    test('`createOrder` updates the cache on success', async () => {
        const [mutationName, options] = createTestCase
        mockMutationEndpoints(ordersEndpoint, ORDER) // createOrder
        mockQueryEndpoint(ordersEndpoint, ORDER) // getOrder
        const {result: mut} = renderHookWithProviders(() => ({
            queryClient: useQueryClient(),
            mutation: useShopperOrdersMutation(mutationName)
        }))
        const cached = mut.current.queryClient.getQueriesData({type: 'all'})
        // The query cache should be empty before we do anything
        expect(cached).toEqual([])
        act(() => mut.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => mut.current.mutation)
        const {result: query} = renderHookWithProviders(() =>
            // We know `ORDER` has an `orderNo` because we set it, but the `Order` type forgets that
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            queries.useOrder({parameters: {orderNo: ORDER.orderNo!}})
        )
        await waitAndExpectSuccess(() => query.current)
        expect(query.current.data).toEqual(ORDER)
    })
    test('`createOrder` invalidates `useCustomerOrders` for a registered customer on success', async () => {
        const [mutationName, options] = createTestCase
        mockQueryEndpoint(customersEndpoint, emptyCustomerOrders) // initial useCustomerOrders
        mockMutationEndpoints(ordersEndpoint, ORDER) // createOrder
        mockQueryEndpoint(customersEndpoint, emptyCustomerOrders) // refetch after invalidation
        const {result} = renderHookWithProviders(() => ({
            customerOrders: useCustomerOrders(getCustomerOrdersOptions),
            mutation: useShopperOrdersMutation(mutationName)
        }))
        await waitAndExpectSuccess(() => result.current.customerOrders)
        const oldData = result.current.customerOrders.data
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => result.current.mutation)
        assertInvalidateQuery(result.current.customerOrders, oldData)
    })
    test('`createOrder` does not invalidate `useCustomerOrders` for a guest checkout', async () => {
        // Simulate a guest session by clearing the customer id for this test only.
        window.localStorage.removeItem(storedCustomerIdKey)
        try {
            const [mutationName, options] = createTestCase
            mockQueryEndpoint(customersEndpoint, emptyCustomerOrders) // initial useCustomerOrders
            mockMutationEndpoints(ordersEndpoint, ORDER) // createOrder
            const {result} = renderHookWithProviders(() => ({
                customerOrders: useCustomerOrders(getCustomerOrdersOptions),
                mutation: useShopperOrdersMutation(mutationName)
            }))
            await waitAndExpectSuccess(() => result.current.customerOrders)
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(() => result.current.mutation)
            // Query should not be invalidated: still has original data and not refetching.
            expect(result.current.customerOrders.data).toEqual(emptyCustomerOrders)
            expect(result.current.customerOrders.isRefetching).toBe(false)
        } finally {
            window.localStorage.setItem(storedCustomerIdKey, CUSTOMER_ID)
        }
    })
    test('`createOrder` does not update the cache on error', async () => {
        const [mutationName, options] = createTestCase
        mockMutationEndpoints(ordersEndpoint, {error: true}, 400) // createOrder
        const {result} = renderHookWithProviders(() => ({
            queryClient: useQueryClient(),
            mutation: useShopperOrdersMutation(mutationName)
        }))
        const getQueries = () => result.current.queryClient.getQueriesData({type: 'all'})
        // The query cache should be empty before we do anything
        expect(getQueries()).toEqual([])
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectError(() => result.current.mutation)
        // The query cache should not have changed
        expect(getQueries()).toEqual([])
    })
    test('`cancelOmsOrder` invalidates the order cache on success', async () => {
        mockQueryEndpoint(ordersEndpoint, ORDER) // getOrder
        // First, populate the order cache
        const {result: query} = renderHookWithProviders(() =>
            queries.useOrder({parameters: {orderNo: ORDER_NO}})
        )
        await waitAndExpectSuccess(() => query.current)
        expect(query.current.data).toEqual(ORDER)

        // Now cancel the order
        mockMutationEndpoints(ordersEndpoint, {...ORDER, status: 'cancelled'})
        mockQueryEndpoint(ordersEndpoint, {...ORDER, status: 'cancelled'}) // refetch after invalidation
        const {result: mut} = renderHookWithProviders(() =>
            useShopperOrdersMutation('cancelOmsOrder')
        )
        act(() => mut.current.mutate(cancelOmsOrderOptions))
        await waitAndExpectSuccess(() => mut.current)
        expect(mut.current.data).toEqual({...ORDER, status: 'cancelled'})
    })
    test('`returnOmsOrder` invalidates the order query on success', async () => {
        mockQueryEndpoint(ordersEndpoint, ORDER) // initial useOrder
        mockMutationEndpoints(ordersEndpoint, ORDER) // returnOmsOrder
        mockQueryEndpoint(ordersEndpoint, ORDER) // refetch after invalidation
        const {result} = renderHookWithProviders(() => ({
            query: queries.useOrder({parameters: {orderNo: ORDER_NO}}),
            mutation: useShopperOrdersMutation('returnOmsOrder')
        }))
        await waitAndExpectSuccess(() => result.current.query)
        const oldData = result.current.query.data
        act(() => result.current.mutation.mutate(returnOmsOrderOptions))
        await waitAndExpectSuccess(() => result.current.mutation)
        assertInvalidateQuery(result.current.query, oldData)
    })
    test('`returnOmsOrder` invalidates `useOrder` even when called with extra params (e.g. expand=oms)', async () => {
        mockQueryEndpoint(ordersEndpoint, ORDER) // initial useOrder w/ expand
        mockMutationEndpoints(ordersEndpoint, ORDER) // returnOmsOrder
        mockQueryEndpoint(ordersEndpoint, ORDER) // refetch
        const {result} = renderHookWithProviders(() => ({
            query: queries.useOrder({
                parameters: {orderNo: ORDER_NO, expand: ['oms', 'oms_shipments']}
            }),
            mutation: useShopperOrdersMutation('returnOmsOrder')
        }))
        await waitAndExpectSuccess(() => result.current.query)
        const oldData = result.current.query.data
        act(() => result.current.mutation.mutate(returnOmsOrderOptions))
        await waitAndExpectSuccess(() => result.current.mutation)
        assertInvalidateQuery(result.current.query, oldData)
    })
})
