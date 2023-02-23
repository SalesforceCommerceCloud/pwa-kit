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
import {NotImplementedError} from '../utils'
import {ShopperBasketsMutation, useShopperBasketsMutation} from './mutation'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: 'access_token'})
    }))
})

type Client = ApiClients['shopperBaskets']
type Basket = ShopperBasketsTypes.Basket
type BasketsResult = ShopperCustomersTypes.BasketsResult

/** Create an options object for Shopper Baskets endpoints, with `basketId` pre-filled. */
const makeOptions = <Method extends Exclude<keyof Client, 'clientConfig'>>(
    body: Argument<Client[Method]> extends {body: infer B} ? B : undefined,
    parameters: Omit<Argument<Client[Method]>['parameters'], 'basketId'>
): Argument<Client[Method]> => ({
    body,
    parameters: {basketId: BASKET_ID, ...parameters}
})

// --- getBasket constants --- //
const basketsEndpoint = '/checkout/shopper-baskets/'
const BASKET_ID = 'basket_id'
const getBasketOptions = makeOptions<'getBasket'>(undefined, {})
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
/** All Shopper Baskets mutations except `deleteBasket` have the same cache update logic. */
type NonDeleteMutation = Exclude<ShopperBasketsMutation, 'deleteBasket'>
// This is an object rather than an array to more easily ensure we cover all mutations
// TODO: Remove optional flag when all mutations are implemented
type TestMap = {[Mut in NonDeleteMutation]?: Argument<Client[Mut]>}
const testMap: TestMap = {
    addCouponToBasket: makeOptions<'addCouponToBasket'>({code: 'coupon'}, {}),
    addItemToBasket: makeOptions<'addItemToBasket'>([], {}),
    addPaymentInstrumentToBasket: makeOptions<'addPaymentInstrumentToBasket'>({}, {}),
    createBasket: makeOptions<'createBasket'>({}, {}),
    mergeBasket: makeOptions<'mergeBasket'>(undefined, {}),
    removeCouponFromBasket: makeOptions<'removeCouponFromBasket'>(undefined, {
        couponItemId: 'couponIemId'
    }),
    removeItemFromBasket: makeOptions<'removeItemFromBasket'>(undefined, {itemId: 'itemId'}),
    removePaymentInstrumentFromBasket: makeOptions<'removePaymentInstrumentFromBasket'>(undefined, {
        paymentInstrumentId: 'paymentInstrumentId'
    }),
    updateBasket: makeOptions<'updateBasket'>({}, {}),
    updateBillingAddressForBasket: makeOptions<'updateBillingAddressForBasket'>({}, {}),
    updateCustomerForBasket: makeOptions<'updateCustomerForBasket'>({email: 'customer@email'}, {}),
    updateItemInBasket: makeOptions<'updateItemInBasket'>({}, {itemId: 'itemId'}),
    updatePaymentInstrumentInBasket: makeOptions<'updatePaymentInstrumentInBasket'>(
        {},
        {paymentInstrumentId: 'paymentInstrumentId'}
    ),
    updateShippingAddressForShipment: makeOptions<'updateShippingAddressForShipment'>(
        {},
        {shipmentId: 'shipmentId'}
    ),
    updateShippingMethodForShipment: makeOptions<'updateShippingMethodForShipment'>(
        {id: 'ship'},
        {shipmentId: 'shipmentId'}
    )
}
const deleteTestCase = ['deleteBasket', makeOptions<'deleteBasket'>(undefined, {})] as const

// Type assertion because the built-in type definition for `Object.entries` is limited :\
const nonDeleteTestCases = Object.entries(testMap) as Array<
    [ShopperBasketsMutation, Argument<Client[ShopperBasketsMutation]>]
>
// Most test cases only apply to non-delete test cases, some (error handling) can include deleteBasket
const allTestCases = [...nonDeleteTestCases, deleteTestCase]

// Not implemented checks are temporary to make sure we don't forget to add tests when adding
// implentations. When all mutations are added, the "not implemented" tests can be removed,
// and the `TestMap` type can be changed from optional keys to required keys. Doing so will
// leverage TypeScript to enforce having tests for all mutations.
const notImplTestCases: NonDeleteMutation[] = [
    'addGiftCertificateItemToBasket',
    'addPriceBooksToBasket',
    'addTaxesForBasket',
    'addTaxesForBasketItem',
    'createShipmentForBasket',
    'removeGiftCertificateItemFromBasket',
    'removeShipmentFromBasket',
    'transferBasket',
    'updateGiftCertificateItemInBasket',
    'updateShipmentForBasket'
]

describe('ShopperBaskets mutations', () => {
    const storedCustomerIdKey = `${DEFAULT_TEST_CONFIG.siteId}_customer_id`
    beforeAll(() => {
        // Make sure we don't accidentally overwrite something before setting up our test state
        if (window.localStorage.length > 0) throw new Error('Unexpected data in local storage.')
        window.localStorage.setItem(storedCustomerIdKey, CUSTOMER_ID)
    })
    afterAll(() => {
        window.localStorage.removeItem(storedCustomerIdKey)
    })

    beforeEach(() => nock.cleanAll())
    test.each(nonDeleteTestCases)('`%s` returns data on success', async (mutationName, options) => {
        mockMutationEndpoints(basketsEndpoint, oldBasket)
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return useShopperBasketsMutation(mutationName)
        })
        expect(result.current.data).toBeUndefined()
        act(() => result.current.mutate(options))
        await waitAndExpectSuccess(wait, () => result.current)
        expect(result.current.data).toEqual(oldBasket)
    })
    test.each(allTestCases)('`%s` returns error on error', async (mutationName, options) => {
        mockMutationEndpoints(basketsEndpoint, {}, 400)
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return useShopperBasketsMutation(mutationName)
        })
        expect(result.current.error).toBeNull()
        act(() => result.current.mutate(options))
        await waitAndExpectError(wait, () => result.current)
    })
    test.each(nonDeleteTestCases)(
        '`%s` updates the cache on success',
        async (mutationName, options) => {
            mockQueryEndpoint(basketsEndpoint, oldBasket) // getBasket
            mockQueryEndpoint(customersEndpoint, oldCustomerBaskets) // getCustomerBaskets
            mockMutationEndpoints(basketsEndpoint, newBasket) // this mutation
            const {result, waitForValueToChange: wait} = renderHookWithProviders(() => ({
                basket: queries.useBasket(getBasketOptions),
                customerBaskets: useCustomerBaskets(getCustomerBasketsOptions),
                mutation: useShopperBasketsMutation(mutationName)
            }))
            await waitAndExpectSuccess(wait, () => result.current.basket)
            expect(result.current.basket.data).toEqual(oldBasket)
            expect(result.current.customerBaskets.data).toEqual(oldCustomerBaskets)
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(wait, () => result.current.mutation)
            assertUpdateQuery(result.current.basket, newBasket)
            assertUpdateQuery(result.current.customerBaskets, newCustomerBaskets)
        }
    )
    test.each(allTestCases)(
        '`%s` does not change cache on error',
        async (mutationName, options) => {
            mockQueryEndpoint(basketsEndpoint, oldBasket) // getBasket
            mockQueryEndpoint(customersEndpoint, oldCustomerBaskets) // getCustomerBaskets
            mockMutationEndpoints(basketsEndpoint, {}, 400) // this mutation
            const {result, waitForValueToChange: wait} = renderHookWithProviders(() => ({
                basket: queries.useBasket(getBasketOptions),
                customerBaskets: useCustomerBaskets(getCustomerBasketsOptions),
                mutation: useShopperBasketsMutation(mutationName)
            }))
            await waitAndExpectSuccess(wait, () => result.current.basket)
            expect(result.current.basket.data).toEqual(oldBasket)
            expect(result.current.customerBaskets.data).toEqual(oldCustomerBaskets)
            expect(result.current.mutation.error).toBeNull()
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectError(wait, () => result.current.mutation)
            assertUpdateQuery(result.current.basket, oldBasket)
            assertUpdateQuery(result.current.customerBaskets, oldCustomerBaskets)
        }
    )
    test('`deleteBasket` returns void on success', async () => {
        // Almost the standard 'returns data' test, just a different return type
        const [mutationName, options] = deleteTestCase
        mockMutationEndpoints(basketsEndpoint, oldBasket)
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return useShopperBasketsMutation(mutationName)
        })
        expect(result.current.data).toBeUndefined()
        act(() => result.current.mutate(options))
        await waitAndExpectSuccess(wait, () => result.current)
        expect(result.current.data).toBeUndefined()
    })
    test('`deleteBasket` removes the basket from the cache on success', async () => {
        // Almost the standard 'updates cache' test, but the cache changes are different
        const [mutationName, options] = deleteTestCase
        mockQueryEndpoint(basketsEndpoint, oldBasket) // getBasket
        mockQueryEndpoint(customersEndpoint, oldCustomerBaskets) // getCustomerBaskets
        mockMutationEndpoints(basketsEndpoint, newBasket) // this mutation
        mockQueryEndpoint(customersEndpoint, deletedCustomerBaskets) // getCustomerBaskets refetch
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => ({
            basket: queries.useBasket(getBasketOptions),
            customerBaskets: useCustomerBaskets(getCustomerBasketsOptions),
            mutation: useShopperBasketsMutation(mutationName)
        }))
        await waitAndExpectSuccess(wait, () => result.current.basket)
        expect(result.current.basket.data).toEqual(oldBasket)
        expect(result.current.customerBaskets.data).toEqual(oldCustomerBaskets)
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(wait, () => result.current.mutation)
        assertRemoveQuery(result.current.basket)
        assertInvalidateQuery(result.current.customerBaskets, oldCustomerBaskets)
    })
    test.only.each(notImplTestCases)('`%s` is not yet implemented', (mutationName) => {
        expect(() => useShopperBasketsMutation(mutationName)).toThrow(NotImplementedError)
    })
})
