/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    ShopperBaskets,
    ShopperContexts,
    ShopperCustomers,
    ShopperLogin,
    ShopperOrders,
    ShopperProducts,
    ShopperPromotions,
    ShopperDiscoverySearch,
    ShopperGiftCertificates,
    ShopperSearch,
} from 'commerce-sdk-isomorphic'

// TODO: these types are not exported from the commerce-sdk-isomorphic
// can we use other types?
// if not, we need to make a change to commerce-sdk-isomorphic to expose these types

import {
    ShopperBasketsParameters,
    ShopperContextsParameters,
    ShopperCustomersParameters,
    ShopperDiscoverySearchParameters,
    ShopperGiftCertificatesParameters,
    ShopperLoginParameters,
    ShopperOrdersParameters,
    ShopperProductsParameters,
    ShopperPromotionsParameters,
    ShopperSearchParameters,
} from 'commerce-sdk-isomorphic'

interface ApiClients {
    shopperBaskets: ShopperBaskets<ShopperBasketsParameters>
    shopperContexts: ShopperContexts<ShopperContextsParameters>
    shopperCustomers: ShopperCustomers<ShopperCustomersParameters>
    shopperDiscoverySearch: ShopperDiscoverySearch<ShopperDiscoverySearchParameters>
    shopperGiftCertificates: ShopperGiftCertificates<ShopperGiftCertificatesParameters>
    shopperLogin: ShopperLogin<ShopperLoginParameters>
    shopperOrders: ShopperOrders<ShopperOrdersParameters>
    shopperProducts: ShopperProducts<ShopperProductsParameters>
    shopperPromotions: ShopperPromotions<ShopperPromotionsParameters>
    shopperSearch: ShopperSearch<ShopperSearchParameters>
}

const config = {
    proxy: 'https://localhost:3000',
    headers: {},
    parameters: {
        clientId: '<your-client-id>',
        organizationId: '<your-org-id>',
        shortCode: '<your-short-code>',
        siteId: '<your-site-id>',
    },
    throwOnBadResponse: true,
}

const useCommerceApi = (): ApiClients => {
    // placeholders for the correct return type
    // TODO: initialize/cache the api client somewhere else
    // to minimize memory usage
    return {
        shopperBaskets: new ShopperBaskets(config),
        shopperContexts: new ShopperContexts(config),
        shopperCustomers: new ShopperCustomers(config),
        shopperDiscoverySearch: new ShopperDiscoverySearch(config),
        shopperGiftCertificates: new ShopperGiftCertificates(config),
        shopperLogin: new ShopperLogin(config),
        shopperOrders: new ShopperOrders(config),
        shopperProducts: new ShopperProducts(config),
        shopperPromotions: new ShopperPromotions(config),
        shopperSearch: new ShopperSearch(config),
    }
}

export default useCommerceApi
