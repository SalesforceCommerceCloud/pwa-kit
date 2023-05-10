/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQueryClient} from '@tanstack/react-query'
import {act} from '@testing-library/react'
import {ShopperOrdersTypes} from 'commerce-sdk-isomorphic'
import nock from 'nock'
import {
    mockMutationEndpoints,
    mockQueryEndpoint,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'
import {ApiClients, Argument} from '../types'
import {ShopperOrdersMutation, useShopperOrdersMutation} from './mutation'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

type Client = ApiClients['shopperOrders']
const ordersEndpoint = '/checkout/shopper-orders/'
const OPTIONS: Argument<Client[ShopperOrdersMutation]> = {
    parameters: {orderNo: ''},
    body: {basketId: 'basketId'}
}
const ORDER: ShopperOrdersTypes.Order = {orderNo: '123', productItems: []}
const ORDER_NO = '123'
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

// --- TEST CASES --- //
/** Every mutation modifies an existing order, except `createOrder`, which creates one. */
type NonCreateMutation = Exclude<ShopperOrdersMutation, 'createOrder'>
// This is an object rather than an array to more easily ensure we cover all mutations
type TestMap = {[Mut in NonCreateMutation]?: Argument<Client[Mut]>}
const testMap: TestMap = {
    createPaymentInstrumentForOrder: createPaymentOptions,
    updatePaymentInstrumentForOrder: updatePaymentOptions,
    removePaymentInstrumentFromOrder: removePaymentOptions
}

// Type assertion because the built-in type definition for `Object.entries` is limited :\
const nonCreateTestCases = Object.entries(testMap) as ReadonlyArray<
    [NonCreateMutation, TestMap[NonCreateMutation]]
>
const createTestCase = ['createOrder', OPTIONS] as const
const allTestCases = [...nonCreateTestCases, createTestCase]

describe('ShopperOrders mutations', () => {
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
})
