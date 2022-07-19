/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'

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
    ShopperSearch
} from 'commerce-sdk-isomorphic'

import {ApiClients} from './hooks/types'

export interface CommerceApiProviderProps {
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

const CommerceApiProvider = (props: CommerceApiProviderProps): ReactElement => {
    const {children, clientId, organizationId, shortCode, siteId, proxy} = props

    const config = {
        proxy,
        headers: {},
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId
        },
        throwOnBadResponse: true
    }

    // TODO: Initialize the api clients immediately, without waiting for an access token.
    // See template-retail-react-app/app/commerce-api/index.js for inspiration
    // especially how Proxy class can be used to wait for the access token and inject it to each request header.
    const apiClients: ApiClients = {
        shopperBaskets: new ShopperBaskets(config),
        shopperContexts: new ShopperContexts(config),
        shopperCustomers: new ShopperCustomers(config),
        shopperDiscoverySearch: new ShopperDiscoverySearch(config),
        shopperGiftCertificates: new ShopperGiftCertificates(config),
        shopperLogin: new ShopperLogin(config),
        shopperOrders: new ShopperOrders(config),
        shopperProducts: new ShopperProducts(config),
        shopperPromotions: new ShopperPromotions(config),
        shopperSearch: new ShopperSearch(config)
    }

    // TODO: wrap the children with:
    // - context for enabling useServerEffect hook
    // - context for sharing the auth object that would manage the tokens -> this will probably be for internal use only
    return <CommerceAPIContext.Provider value={apiClients}>{children}</CommerceAPIContext.Provider>
}

export default CommerceApiProvider
