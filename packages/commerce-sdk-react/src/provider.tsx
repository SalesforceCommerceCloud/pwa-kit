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

import {ApiClientConfigParams, ApiClients} from './hooks/types'
import {QueryClient, QueryClientConfig, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
    queryClientConfig?: QueryClientConfig
    correlationId: string
}

/**
 * @internal
 */
export const CommerceApiContext = React.createContext({} as ApiClients)

/**
 * Initialize a set of Commerce API clients and make it available to all of descendant components
 *
 * @param props
 * @returns Provider to wrap your app with
 */
const CommerceApiProvider = (props: CommerceApiProviderProps): ReactElement => {
    const {
        children,
        clientId,
        organizationId,
        shortCode,
        siteId,
        proxy,
        queryClientConfig,
        correlationId
    } = props

    // DEBUG: copy access token from browser
    const headers = {
        authorization: '',
        ['x-correlation-id']: correlationId
    }

    const config = {
        proxy,
        headers,
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

    const queryClient = new QueryClient(queryClientConfig)

    // TODO: wrap the children with:
    // - context for enabling useServerEffect hook
    // - context for sharing the auth object that would manage the tokens -> this will probably be for internal use only
    return (
        <QueryClientProvider client={queryClient}>
            <CommerceApiContext.Provider value={apiClients}>{children}</CommerceApiContext.Provider>
            <ReactQueryDevtools />
        </QueryClientProvider>
    )
}

export default CommerceApiProvider
