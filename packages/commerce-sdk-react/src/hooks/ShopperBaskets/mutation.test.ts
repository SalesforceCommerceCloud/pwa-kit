/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act} from '@testing-library/react'
import {ShopperBasketsTypes, ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import nock from 'nock'
import {
    assertInvalidateQuery,
    assertRemoveQuery,
    assertUpdateQuery,
    DEFAULT_TEST_CONFIG,
    mockMutationEndpoints,
    mockQueryEndpoint,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'
import {useCustomerBaskets} from '../ShopperCustomers'
import {ApiClients, Argument} from '../types'
import {ShopperBasketsMutation, useShopperBasketsMutation} from './mutation'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

type Client = ApiClients['shopperBaskets']
type Basket = ShopperBasketsTypes.Basket
type BasketsResult = ShopperCustomersTypes.BasketsResult

/** Create an options object for Shopper Baskets endpoints, with `basketId` pre-filled. */
const createOptions = <Method extends Exclude<keyof Client, 'clientConfig'>>(
    body: Argument<Client[Method]> extends {body: infer B} ? B : undefined,
    parameters: Omit<Argument<Client[Method]>['parameters'], 'basketId'>
): Argument<Client[Method]> => ({
    body,
    parameters: {basketId: BASKET_ID, ...parameters}
})

// --- getBasket constants --- //
const basketsEndpoint = '/checkout/shopper-baskets/'
const BASKET_ID = 'basket_id'
const getBasketOptions = createOptions<'getBasket'>(undefined, {})
const EMPTY_BASKET: Basket = {}
const oldBasket: Basket = {basketId: BASKET_ID, mockData: 'old basket'}
const newBasket: Basket = {basketId: BASKET_ID, mockData: 'new basket'}
// --- getCustomerBaskets constants --- //
const customersEndpoint = '/customer/shopper-customers/'
const CUSTOMER_ID = 'customer_id'
// Can't use `makeOptions()` here because it's Shopper Customers, not Shopper Baskets
const getCustomerBasketsOptions: Argument<ApiClients['shopperCustomers']['getCustomerBaskets']> = {
    parameters: {
        customerId: CUSTOMER_ID
    }
}
const emptyCustomerBaskets: BasketsResult = {
    baskets: [] as BasketsResult['baskets'],
    total: 0
}
const oneCustomerBasket: BasketsResult = {
    baskets: [newBasket] as BasketsResult['baskets'],
    total: 1
}
const oldCustomerBaskets: BasketsResult = {
    // We aren't implementing the full basket, so we assert to pretend we are
    baskets: [{basketId: 'other_basket'}, oldBasket] as BasketsResult['baskets'],
    total: 2
}
const newCustomerBaskets: BasketsResult = {
    // We aren't implementing the full basket, so we assert to pretend we are
    baskets: [{basketId: 'other_basket'}, newBasket] as BasketsResult['baskets'],
    total: 2
}
const deletedCustomerBaskets: BasketsResult = {
    // We aren't implementing the full basket, so we assert to pretend we are
    baskets: [{basketId: 'other_basket'}] as BasketsResult['baskets'],
    total: 1
}

// --- TEST CASES --- //
/** All Shopper Baskets mutations except these have the same cache update logic. */
type NonEmptyResponseMutations = Exclude<
    ShopperBasketsMutation,
    'deleteBasket' | 'addPriceBooksToBasket' | 'addTaxesForBasket' | 'addTaxesForBasketItem'
>
// This is an object rather than an array to more easily ensure we cover all mutations
type TestMap = {[Mut in NonEmptyResponseMutations]: Argument<Client[Mut]>}
const testMap: TestMap = {
    addGiftCertificateItemToBasket: createOptions<'addGiftCertificateItemToBasket'>(
        {recipientEmail: 'customer@email', amount: 100},
        {}
    ),
    createShipmentForBasket: createOptions<'createShipmentForBasket'>({}, {}),
    removeGiftCertificateItemFromBasket: createOptions<'removeGiftCertificateItemFromBasket'>(
        undefined,
        {giftCertificateItemId: 'giftCertificateItemId'}
    ),
    removeShipmentFromBasket: createOptions<'removeShipmentFromBasket'>(undefined, {
        shipmentId: 'shipmentId'
    }),
    transferBasket: createOptions<'transferBasket'>(undefined, {}),
    updateGiftCertificateItemInBasket: createOptions<'updateGiftCertificateItemInBasket'>(
        {
            amount: 100,
            recipientEmail: 'customer@email'
        },
        {giftCertificateItemId: 'giftCertificateItemId'}
    ),
    updateShipmentForBasket: createOptions<'updateShipmentForBasket'>(
        {},
        {shipmentId: 'shipmentId'}
    ),
    addCouponToBasket: createOptions<'addCouponToBasket'>({code: 'coupon'}, {}),
    addItemToBasket: createOptions<'addItemToBasket'>([], {}),
    addPaymentInstrumentToBasket: createOptions<'addPaymentInstrumentToBasket'>({}, {}),
    createBasket: createOptions<'createBasket'>({}, {}),
    mergeBasket: createOptions<'mergeBasket'>(undefined, {}),
    removeCouponFromBasket: createOptions<'removeCouponFromBasket'>(undefined, {
        couponItemId: 'couponIemId'
    }),
    removeItemFromBasket: createOptions<'removeItemFromBasket'>(undefined, {itemId: 'itemId'}),
    removePaymentInstrumentFromBasket: createOptions<'removePaymentInstrumentFromBasket'>(
        undefined,
        {
            paymentInstrumentId: 'paymentInstrumentId'
        }
    ),
    updateBasket: createOptions<'updateBasket'>({}, {}),
    updateBillingAddressForBasket: createOptions<'updateBillingAddressForBasket'>({}, {}),
    updateCustomerForBasket: createOptions<'updateCustomerForBasket'>(
        {email: 'customer@email'},
        {}
    ),
    updateItemInBasket: createOptions<'updateItemInBasket'>({}, {itemId: 'itemId'}),
    updateItemsInBasket: createOptions<'updateItemsInBasket'>([], {}),
    updatePaymentInstrumentInBasket: createOptions<'updatePaymentInstrumentInBasket'>(
        {},
        {paymentInstrumentId: 'paymentInstrumentId'}
    ),
    updateShippingAddressForShipment: createOptions<'updateShippingAddressForShipment'>(
        {},
        {shipmentId: 'shipmentId'}
    ),
    updateShippingMethodForShipment: createOptions<'updateShippingMethodForShipment'>(
        {id: 'ship'},
        {shipmentId: 'shipmentId'}
    )
}
const createTestCase = ['createBasket', createOptions<'createBasket'>({}, {})] as const
const deleteTestCase = ['deleteBasket', createOptions<'deleteBasket'>(undefined, {})] as const
const addPriceBooksToBasketTestCase = [
    'addPriceBooksToBasket',
    createOptions<'addPriceBooksToBasket'>([], {})
] as const
const addTaxesForBasketTestCase = [
    'addTaxesForBasket',
    createOptions<'addTaxesForBasket'>(
        {
            taxes: {}
        },
        {}
    )
] as const
const addTaxesForBasketItemTestCase = [
    'addTaxesForBasketItem',
    createOptions<'addTaxesForBasketItem'>({}, {itemId: 'itemId'})
] as const

// Type assertion because the built-in type definition for `Object.entries` is limited :\
const nonEmptyResponseTestCases = Object.entries(testMap) as Array<
    [NonEmptyResponseMutations, Argument<Client[NonEmptyResponseMutations]>]
>

// Endpoints returning void response on success
const emptyResponseTestCases = [
    addPriceBooksToBasketTestCase,
    addTaxesForBasketTestCase,
    addTaxesForBasketItemTestCase,
    // FIXME: This test only passed if run last.
    deleteTestCase
]

// Most test cases only apply to non-empty response test cases, some (error handling) can include deleteBasket
const allTestCases = [...nonEmptyResponseTestCases, ...emptyResponseTestCases]

describe('ShopperBaskets mutations', () => {
    const storedCustomerIdKey = `customer_id_${DEFAULT_TEST_CONFIG.siteId}`
    beforeAll(() => {
        // Make sure we don't accidentally overwrite something before setting up our test state
        if (window.localStorage.length > 0) throw new Error('Unexpected data in local storage.')
        window.localStorage.setItem(storedCustomerIdKey, CUSTOMER_ID)
    })
    afterAll(() => {
        window.localStorage.removeItem(storedCustomerIdKey)
    })

    beforeEach(() => nock.cleanAll())
    test.each(nonEmptyResponseTestCases)(
        '`%s` returns data on success',
        async (mutationName, options) => {
            mockMutationEndpoints(basketsEndpoint, oldBasket)
            const {result} = renderHookWithProviders(() => {
                return useShopperBasketsMutation(mutationName)
            })
            expect(result.current.data).toBeUndefined()
            act(() => result.current.mutate(options))
            await waitAndExpectSuccess(() => result.current)
            expect(result.current.data).toEqual(oldBasket)
        }
    )
    test.each(allTestCases)('`%s` returns error on error', async (mutationName, options) => {
        mockMutationEndpoints(basketsEndpoint, {error: true}, 400)
        const {result} = renderHookWithProviders(() => {
            return useShopperBasketsMutation(mutationName)
        })
        expect(result.current.error).toBeNull()
        act(() => result.current.mutate(options))
        await waitAndExpectError(() => result.current)
        // Validate that we get a `ResponseError` from commerce-sdk-isomorphic. Ideally, we could do
        // `.toBeInstanceOf(ResponseError)`, but the class isn't exported. :\
        expect(result.current.error).toHaveProperty('response')
    })
    test.each(nonEmptyResponseTestCases)(
        '`%s` updates the cache on success',
        async (mutationName, options) => {
            mockQueryEndpoint(basketsEndpoint, oldBasket) // getBasket
            mockQueryEndpoint(customersEndpoint, oldCustomerBaskets) // getCustomerBaskets
            mockMutationEndpoints(basketsEndpoint, newBasket) // this mutation
            const {result} = renderHookWithProviders(() => ({
                basket: queries.useBasket(getBasketOptions),
                customerBaskets: useCustomerBaskets(getCustomerBasketsOptions),
                mutation: useShopperBasketsMutation(mutationName)
            }))
            await waitAndExpectSuccess(() => result.current.basket)
            expect(result.current.basket.data).toEqual(oldBasket)
            expect(result.current.customerBaskets.data).toEqual(oldCustomerBaskets)
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(() => result.current.mutation)
            assertUpdateQuery(result.current.basket, newBasket)
            // Because 'transferBasket` returns basket information applicable to a different (registered) customer
            // the `result.current.customerBaskets` isn't effected here as the customer id is static.
            // https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1887
            if (mutationName !== 'transferBasket') {
                assertUpdateQuery(result.current.customerBaskets, newCustomerBaskets)
            }
        }
    )
    test.each(allTestCases)(
        '`%s` does not change cache on error',
        async (mutationName, options) => {
            mockQueryEndpoint(basketsEndpoint, oldBasket) // getBasket
            mockQueryEndpoint(customersEndpoint, oldCustomerBaskets) // getCustomerBaskets
            mockMutationEndpoints(basketsEndpoint, {error: true}, 400) // this mutation
            const {result} = renderHookWithProviders(() => ({
                basket: queries.useBasket(getBasketOptions),
                customerBaskets: useCustomerBaskets(getCustomerBasketsOptions),
                mutation: useShopperBasketsMutation(mutationName)
            }))
            await waitAndExpectSuccess(() => result.current.basket)
            expect(result.current.basket.data).toEqual(oldBasket)
            expect(result.current.customerBaskets.data).toEqual(oldCustomerBaskets)
            expect(result.current.mutation.error).toBeNull()
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectError(() => result.current.mutation)
            // Validate that we get a `ResponseError` from commerce-sdk-isomorphic. Ideally, we could do
            // `.toBeInstanceOf(ResponseError)`, but the class isn't exported. :\
            expect(result.current.mutation.error).toHaveProperty('response')
            assertUpdateQuery(result.current.basket, oldBasket)
            assertUpdateQuery(result.current.customerBaskets, oldCustomerBaskets)
        }
    )
    test.each(emptyResponseTestCases)(
        '`%s` returns void on success',
        async (mutationName, options) => {
            // Almost the standard 'returns data' test, just a different return type
            mockMutationEndpoints(basketsEndpoint, oldBasket)
            const {result} = renderHookWithProviders(() => {
                return useShopperBasketsMutation(mutationName)
            })
            expect(result.current.data).toBeUndefined()
            act(() => result.current.mutate(options))
            await waitAndExpectSuccess(() => result.current)
            expect(result.current.data).toBeUndefined()
        }
    )
    test('`createBasket` adds the basket to the cache on success if customer has no basket', async () => {
        const [mutationName, options] = createTestCase
        mockQueryEndpoint(basketsEndpoint, EMPTY_BASKET) // getBasket
        mockQueryEndpoint(customersEndpoint, emptyCustomerBaskets) // getCustomerBaskets
        mockMutationEndpoints(basketsEndpoint, newBasket) // this mutation
        const {result} = renderHookWithProviders(() => ({
            basket: queries.useBasket(getBasketOptions),
            customerBaskets: useCustomerBaskets(getCustomerBasketsOptions),
            mutation: useShopperBasketsMutation(mutationName)
        }))
        await waitAndExpectSuccess(() => result.current.basket)
        expect(result.current.basket.data).toEqual(EMPTY_BASKET)
        expect(result.current.customerBaskets.data).toEqual(emptyCustomerBaskets)
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => result.current.mutation)
        assertUpdateQuery(result.current.basket, newBasket)
        assertUpdateQuery(result.current.customerBaskets, oneCustomerBasket)
    })
    test('`deleteBasket` removes the basket from the cache on success', async () => {
        // Almost the standard 'updates cache' test, but the cache changes are different
        const [mutationName, options] = deleteTestCase
        mockQueryEndpoint(basketsEndpoint, oldBasket) // getBasket
        mockQueryEndpoint(customersEndpoint, oldCustomerBaskets) // getCustomerBaskets
        mockMutationEndpoints(basketsEndpoint, newBasket) // this mutation
        mockQueryEndpoint(customersEndpoint, deletedCustomerBaskets) // getCustomerBaskets refetch
        const {result} = renderHookWithProviders(() => ({
            basket: queries.useBasket(getBasketOptions),
            customerBaskets: useCustomerBaskets(getCustomerBasketsOptions),
            mutation: useShopperBasketsMutation(mutationName)
        }))
        await waitAndExpectSuccess(() => result.current.basket)
        expect(result.current.basket.data).toEqual(oldBasket)
        expect(result.current.customerBaskets.data).toEqual(oldCustomerBaskets)
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => result.current.mutation)
        assertRemoveQuery(result.current.basket)
        assertInvalidateQuery(result.current.customerBaskets, oldCustomerBaskets)
    })
})
