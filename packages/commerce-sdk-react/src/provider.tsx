/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement, useEffect, useMemo} from 'react'
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
    ShopperBasketsTypes
} from 'commerce-sdk-isomorphic'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients} from './hooks/types'
import {QueryClient, QueryClientConfig, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
    redirectURI: string
    queryClientConfig?: QueryClientConfig
    fetchOptions?: ShopperBasketsTypes.FetchOptions
}

/**
 * @internal
 */
export const CommerceApiContext = React.createContext({} as ApiClients)

/**
 * @internal
 */
export const AuthContext = React.createContext({} as Auth)

const NUM_OF_RETRIES = 3
const QUERY_CLIENT_CONFIG: QueryClientConfig = {
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // See https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/blob/main/src/static/responseError.ts
                // @ts-ignore
                const isResponseError = Boolean(error.response)

                if (!isResponseError || failureCount === NUM_OF_RETRIES) {
                    // stop retries
                    return false
                }
                // continue retries
                return true
            }
        }
        // TODO: also for mutations
    }
}

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
        redirectURI,
        // TODO: stop retry when there is validation error
        // TODO: how to detect validation error? Maybe any non-ResponseError objects?
        // And make it future proof by having a separate function/module
        queryClientConfig,
        fetchOptions
    } = props

    const config = {
        proxy,
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId
        },
        throwOnBadResponse: true,
        fetchOptions
    }

    const apiClients = useMemo(() => {
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
            shopperSearch: new ShopperSearch(config)
        }
    }, [clientId, organizationId, shortCode, siteId, proxy, fetchOptions])

    const auth = useMemo(() => {
        return new Auth({
            clientId,
            organizationId,
            shortCode,
            siteId,
            proxy,
            redirectURI,
            fetchOptions
        })
    }, [clientId, organizationId, shortCode, siteId, proxy, redirectURI, fetchOptions])

    useEffect(() => {
        auth.ready()
    }, [auth])

    const queryClient = new QueryClient({
        ...QUERY_CLIENT_CONFIG,
        ...queryClientConfig
    })

    // TODO: wrap the children with:
    // - context for enabling useServerEffect hook
    // - context for sharing the auth object that would manage the tokens -> this will probably be for internal use only
    return (
        <QueryClientProvider client={queryClient}>
            <CommerceApiContext.Provider value={apiClients}>
                <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
            </CommerceApiContext.Provider>
            <ReactQueryDevtools />
        </QueryClientProvider>
    )
}

export default CommerceApiProvider
