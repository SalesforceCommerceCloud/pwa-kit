/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import { ApiClients } from './hooks/types'

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

import ApiClient from './api-client'

export interface CommerceAPIProviderProps {
    children: React.ReactNode
    clientId: string
    organizationId: string
    siteId: string
    shortCode: string
    proxy: string
    locale: string
    currency: string
}

export const CommerceAPIContext = React.createContext({} as ApiClients)

// TODO: how to test? test in typescript template for now
export const CommerceAPIProvider = (props: CommerceAPIProviderProps): ReactElement => {
    const {children, clientId, organizationId, shortCode, siteId, proxy} = props

    const config = {
        proxy,
        headers: {},
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId,
        },
        throwOnBadResponse: true,
    }

    // TODO: auth logic should use the helpers from commerce-sdk-isomorphic ?
    const apiClient = new ApiClient(config)

    console.log('--- api client', apiClient)

    // const apiClient = {
    //     shopperBaskets: new ShopperBaskets(config),
    //     shopperContexts: new ShopperContexts(config),
    //     shopperCustomers: new ShopperCustomers(config),
    //     shopperDiscoverySearch: new ShopperDiscoverySearch(config),
    //     shopperGiftCertificates: new ShopperGiftCertificates(config),
    //     shopperLogin: new ShopperLogin(config),
    //     shopperOrders: new ShopperOrders(config),
    //     shopperProducts: new ShopperProducts(config),
    //     shopperPromotions: new ShopperPromotions(config),
    //     shopperSearch: new ShopperSearch(config),
    // }

    // TODO: use Context from useServerEffect
    // See Kevin's PR: https://github.com/SalesforceCommerceCloud/pwa-kit/pull/654/files#r914097886
    // See Ben's PR: https://github.com/SalesforceCommerceCloud/pwa-kit/pull/642
    return <CommerceAPIContext.Provider value={apiClient}>{children}</CommerceAPIContext.Provider>
}


