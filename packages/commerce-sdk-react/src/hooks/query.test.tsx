/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock'
import {renderHookWithProviders, DEFAULT_TEST_HOST} from '../test-utils'
import {
    useBasket,
    usePaymentMethodsForBasket,
    usePriceBooksForBasket,
    useShippingMethodsForShipment,
    useTaxesFromBasket
} from './ShopperBaskets/query'
import {useProductSearch, useSearchSuggestions} from './ShopperSearch/query'
import {useShopperContext} from './ShopperContexts/query'
import {
    useExternalProfile,
    useCustomer,
    useCustomerAddress,
    useCustomerBaskets,
    useCustomerOrders,
    useCustomerPaymentInstrument,
    useCustomerProductLists,
    useCustomerProductList,
    useCustomerProductListItem,
    usePublicProductListsBySearchTerm,
    usePublicProductList,
    useProductListItem
} from './ShopperCustomers/query'
import {useOrder, usePaymentMethodsForOrder, useTaxesFromOrder} from './ShopperOrders/query'
import {useProducts, useProduct, useCategories, useCategory} from './ShopperProducts/query'
import {usePromotions, usePromotionsForCampaign} from './ShopperPromotions/query'

jest.mock('../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

const QUERY_TESTS = [
    // ShopperBasket
    {
        name: 'useBasket',
        hook: () => useBasket({parameters: {basketId: 'test'}}),
        endpoint: /\/baskets\/test$/
    },
    {
        name: 'usePaymentMethodsForBasket',
        hook: () => usePaymentMethodsForBasket({parameters: {basketId: 'test'}}),
        endpoint: /\/baskets\/test\/payment-methods$/
    },
    {
        name: 'usePriceBooksForBasket',
        hook: () => usePriceBooksForBasket({parameters: {basketId: 'test'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'useTaxesFromBasket',
        hook: () => useTaxesFromBasket({parameters: {basketId: 'test'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'useShippingMethodsForShipment',
        hook: () =>
            useShippingMethodsForShipment({parameters: {basketId: 'test', shipmentId: '123'}}),
        endpoint: /\/baskets\/test\/shipments\/123\/shipping-methods$/
    },
    // ShopperContext
    {
        name: 'useShopperContext',
        hook: () => useShopperContext({parameters: {usid: 'test'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    // ShopperCustomers
    {
        name: 'useExternalProfile',
        hook: () =>
            useExternalProfile({
                parameters: {externalId: 'externalId', authenticationProviderId: 'authProvider'}
            }),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'useCustomer',
        hook: () => useCustomer({parameters: {customerId: '123'}}),
        endpoint: /\/customers\/123$/
    },
    {
        name: 'useCustomerAddress',
        hook: () => useCustomerAddress({parameters: {customerId: '123', addressName: '456'}}),
        endpoint: /\/customers\/123\/addresses\/456$/
    },
    {
        name: 'useCustomerBaskets',
        hook: () => useCustomerBaskets({parameters: {customerId: '123'}}),
        endpoint: /\/customers\/123\/baskets$/
    },
    {
        name: 'useCustomerOrders',
        hook: () => useCustomerOrders({parameters: {customerId: '123'}}),
        endpoint: /\/customers\/123\/orders$/
    },
    {
        name: 'useCustomerPaymentInstrument',
        hook: () =>
            useCustomerPaymentInstrument({
                parameters: {customerId: '123', paymentInstrumentId: '456'}
            }),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'useCustomerProductLists',
        hook: () => useCustomerProductLists({parameters: {customerId: '123'}}),
        endpoint: /\/customers\/123\/product-lists$/
    },
    {
        name: 'useCustomerProductList',
        hook: () => useCustomerProductList({parameters: {customerId: '123', listId: '456'}}),
        endpoint: /\/customers\/123\/product-lists\/456$/
    },
    {
        name: 'useCustomerProductListItem',
        hook: () =>
            useCustomerProductListItem({
                parameters: {customerId: '123', listId: '456', itemId: '789'}
            }),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'usePublicProductListsBySearchTerm',
        hook: () => usePublicProductListsBySearchTerm({parameters: {}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'usePublicProductList',
        hook: () => usePublicProductList({parameters: {listId: '123'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'useProductListItem',
        hook: () => useProductListItem({parameters: {listId: '123', itemId: '456'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    // ShopperOrders
    {
        name: 'useOrder',
        hook: () => useOrder({parameters: {orderNo: '123'}}),
        endpoint: /\/orders\/123$/
    },
    {
        name: 'usePaymentMethodsForOrder',
        hook: () => usePaymentMethodsForOrder({parameters: {orderNo: '123'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    {
        name: 'useTaxesFromOrder',
        hook: () => useTaxesFromOrder({parameters: {orderNo: '123'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    // ShopperProducts
    {
        name: 'useProducts',
        hook: () => useProducts({parameters: {ids: '123,456'}}),
        endpoint: /\/products$/
    },
    {
        name: 'useProduct',
        hook: () => useProduct({parameters: {id: '123'}}),
        endpoint: /\/products\/123$/
    },
    {
        name: 'useCategories',
        hook: () => useCategories({parameters: {ids: '123,456'}}),
        endpoint: /\/categories$/
    },
    {
        name: 'useCategory',
        hook: () => useCategory({parameters: {id: '123'}}),
        endpoint: /\/categories\/123$/
    },
    // ShopperPromotions
    {
        name: 'usePromotions',
        hook: () => usePromotions({parameters: {ids: '123,456'}}),
        endpoint: /\/promotions$/
    },
    {
        name: 'usePromotionsForCampaign',
        hook: () => usePromotionsForCampaign({parameters: {campaignId: '123'}}),
        endpoint: new RegExp(''),
        notImplemented: true
    },
    // ShopperSearch
    {
        name: 'useProductSearch',
        hook: () => useProductSearch({parameters: {q: 'test'}}),
        endpoint: /\/product-search$/
    },
    {
        name: 'useSearchSuggestions',
        hook: () => useSearchSuggestions({parameters: {q: 'test'}}),
        endpoint: /\/search-suggestions$/
    }
]

test.each(QUERY_TESTS)('%j - 200 returns data', async ({hook, endpoint, notImplemented}) => {
    if (notImplemented) {
        return
    }

    const data = {test: true}
    nock(DEFAULT_TEST_HOST)
        .get((uri) => endpoint.test(uri.split('?')[0]))
        .reply(200, data)
    const {result, waitForNextUpdate} = renderHookWithProviders(hook)
    expect(result.current.data).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitForNextUpdate()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(data)
})

test.each(QUERY_TESTS)('%j - 400 returns error', async ({hook, endpoint, notImplemented}) => {
    if (notImplemented) {
        return
    }
    nock(DEFAULT_TEST_HOST)
        .get((uri) => endpoint.test(uri.split('?')[0]))
        .reply(400)
    const {result, waitForNextUpdate} = renderHookWithProviders(hook)
    expect(result.current.data).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitForNextUpdate()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeTruthy()
})

test.each(QUERY_TESTS)('%j - throws error when not implemented', async ({hook, notImplemented}) => {
    if (notImplemented) {
        expect(() => hook()).toThrowError('This method is not implemented.')
    }
})
