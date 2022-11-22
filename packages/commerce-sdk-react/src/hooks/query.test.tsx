/*
 * Copyright (c) 2022, salesforce.com, inc.
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
    {
        name: 'useBasket',
        hook: () => useBasket({basketId: 'test'}),
        endpoint: '/baskets/test'
    },
    {
        name: 'usePaymentMethodsForBasket',
        hook: () => usePaymentMethodsForBasket({basketId: 'test'}),
        endpoint: '/baskets/test/payment-methods'
    },
    {
        name: 'usePriceBooksForBasket',
        hook: () => usePriceBooksForBasket({basketId: 'test'}),
        endpoint: '/baskets/test/price-books'
    },
    {
        name: 'useShippingMethodsForShipment',
        hook: () => useShippingMethodsForShipment({basketId: 'test', shipmentId: '123'}),
        endpoint: '/baskets/test/shipments/123/shipping-methods'
    },

    // TODO: not implemented
    // {
    //     name: 'useExternalProfile',
    //     hook: () => useExternalProfile({externalId: '123', authenticationProviderId: '456'}),
    //     endpoint: '/customers/external-profile',
    // },
    {
        name: 'useCustomer',
        hook: () => useCustomer({customerId: '123'}),
        endpoint: '/customers/123'
    },
    {
        name: 'useCustomerAddress',
        hook: () => useCustomerAddress({customerId: '123', addressName: '456'}),
        endpoint: '/customers/123/addresses/456'
    },
    {
        name: 'useCustomerBaskets',
        hook: () => useCustomerBaskets({customerId: '123'}),
        endpoint: '/customers/123/baskets'
    },
    {
        name: 'useCustomerOrders',
        hook: () => useCustomerOrders({customerId: '123'}),
        endpoint: '/customers/123/orders'
    },
    // TODO: not implemented
    // {
    //     name: 'useCustomerPaymentInstrument',
    //     hook: () => useCustomerPaymentInstrument({customerId: '123', paymentInstrumentId: '456'}),
    //     endpoint: '/customers/123/payment-instruments/456',
    // },
    // {
    //     name: 'useCustomerProductLists',
    //     hook: () => useCustomerProductLists({customerId: '123'}),
    //     endpoint: '/customers/123/product-lists',
    // },
    // {
    //     name: 'useCustomerProductList',
    //     hook: () => useCustomerProductList({customerId: '123'}),
    //     endpoint: '/customers/123/product-lists/456',
    // },
    // {
    //     name: 'useCustomerProductListItem',
    //     hook: () => useCustomerProductListItem({customerId: '123'}),
    //     endpoint: '/customers/123/product-lists/456/items/789',
    // },
    // {
    //     name: 'usePublicProductListsBySearchTerm',
    //     hook: () => usePublicProductListsBySearchTerm(),
    //     endpoint: '',
    // },
    // {
    //     name: 'usePublicProductList',
    //     hook: () => usePublicProductList(),
    //     endpoint: '',
    // },
    // {
    //     name: 'useProductListItem',
    //     hook: () => useProductListItem(),
    //     endpoint: '',
    // },

    {
        name: 'useOrder',
        hook: () => useOrder({orderNo: '123'}),
        endpoint: '/orders/123'
    },
    {
        name: 'usePaymentMethodsForOrder',
        hook: () => usePaymentMethodsForOrder({orderNo: '123'}),
        endpoint: '/orders/123/payment-methods'
    },
    {
        name: 'useTaxesFromOrder',
        hook: () => useTaxesFromOrder({orderNo: '123'}),
        endpoint: '/orders/123/taxes'
    },

    {
        name: 'useProducts',
        hook: () => useProducts({ids: '123,456'}),
        endpoint: '/products'
    },
    {
        name: 'useProduct',
        hook: () => useProduct({id: '123'}),
        endpoint: '/products/123'
    },
    {
        name: 'useCategories',
        hook: () => useCategories({ids: '123,456'}),
        endpoint: '/categories'
    },
    {
        name: 'useCategory',
        hook: () => useCategory({id: '123'}),
        endpoint: '/categories/123'
    },
    {
        name: 'usePromotions',
        hook: () => usePromotions({ids: '123,456'}),
        endpoint: '/promotions'
    },
    {
        name: 'usePromotionsForCampaign',
        hook: () => usePromotionsForCampaign({campaignId: '123'}),
        endpoint: '/promotions/campaigns/123'
    },

    {
        name: 'useProductSearch',
        hook: () => useProductSearch({q: 'test'}),
        endpoint: '/product-search'
    },
    {
        name: 'useSearchSuggestions',
        hook: () => useSearchSuggestions({q: 'test'}),
        endpoint: '/search-suggestions'
    }
]

test.each(QUERY_TESTS)('%j - 200 returns data', async ({hook, endpoint}) => {
    const data = {test: true}
    nock(DEFAULT_TEST_HOST)
        .get((uri) => uri.includes(endpoint))
        .reply(200, data)
    // @ts-ignore
    const {result, waitForNextUpdate} = renderHookWithProviders(hook)
    expect(result.current.data).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitForNextUpdate()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(data)
})

test.each(QUERY_TESTS)('%j - 400 returns error', async ({hook, endpoint}) => {
    nock(DEFAULT_TEST_HOST)
        .get((uri) => uri.includes(endpoint))
        .reply(400)
    // @ts-ignore
    const {result, waitForNextUpdate} = renderHookWithProviders(hook)
    expect(result.current.data).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitForNextUpdate()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeTruthy()
})
