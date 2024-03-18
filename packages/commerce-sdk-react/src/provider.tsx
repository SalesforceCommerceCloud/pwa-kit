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
    ShopperExperience,
    ShopperLogin,
    ShopperOrders,
    ShopperProducts,
    ShopperPromotions,
    ShopperGiftCertificates,
    ShopperSearch,
    ShopperSeo,
    ShopperBasketsTypes
} from 'commerce-sdk-isomorphic'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients} from './hooks/types'
import {onClient} from './utils'

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
    redirectURI: string
    fetchOptions?: ShopperBasketsTypes.FetchOptions
    headers?: Record<string, string>
    fetchedToken?: string
    OCAPISessionsURL?: string
}

/**
 * @internal
 */
export const CommerceApiContext = React.createContext({} as ApiClients)

/**
 * @internal
 */
export const ConfigContext = React.createContext({} as Omit<CommerceApiProviderProps, 'children'>)

/**
 * @internal
 */
export const AuthContext = React.createContext({} as Auth)

/**
 * Initialize a set of Commerce API clients and make it available to all of descendant components
 *
 * @group Components
 * 
 * @example
 * ```js
    import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'


    const App = ({children}) => {
        return (
                <CommerceApiProvider
                    clientId="12345678-1234-1234-1234-123412341234"
                    organizationId="f_ecom_aaaa_001"
                    proxy="localhost:3000/mobify/proxy/api"
                    redirectURI="localhost:3000/callback"
                    siteId="RefArch"
                    shortCode="12345678"
                    locale="en-US"
                    currency="USD"
                >
                    {children}
                </CommerceApiProvider>
        )
    } 

    export default App
 * ```
 * 
 * @returns Provider to wrap your app with
 */
const CommerceApiProvider = (props: CommerceApiProviderProps): ReactElement => {
    const {
        children,
        clientId,
        headers = {},
        organizationId,
        proxy,
        redirectURI,
        fetchOptions,
        siteId,
        shortCode,
        locale,
        currency,
        fetchedToken,
        OCAPISessionsURL
    } = props

    const config = {
        proxy,
        headers,
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId,
            locale,
            currency
        },
        throwOnBadResponse: true,
        fetchOptions
    }
    const apiClients = useMemo(() => {
        const clients = {
            shopperBaskets: new ShopperBaskets(config),
            shopperContexts: new ShopperContexts(config),
            shopperCustomers: new ShopperCustomers(config),
            shopperExperience: new ShopperExperience(config),
            shopperGiftCertificates: new ShopperGiftCertificates(config),
            shopperLogin: new ShopperLogin(config),
            shopperOrders: new ShopperOrders(config),
            shopperProducts: new ShopperProducts(config),
            shopperPromotions: new ShopperPromotions(config),
            shopperSearch: new ShopperSearch(config),
            shopperSeo: new ShopperSeo(config)
        }
        const isInStorefrontPreview = onClient() && window.STOREFRONT_PREVIEW

        Object.values(clients).forEach((client) => {
            const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
            const getMethods = methods.filter((method) => method.startsWith('get'))
            console.log('--- getMethods', getMethods)

            getMethods.forEach((getMethod) => {
                // @ts-ignore
                client[getMethod] = new Proxy(client[getMethod], {
                    apply(target, thisArg, argumentsList) {
                        if (isInStorefrontPreview) {
                            argumentsList[0].parameters.c_cache_breaker = new Date().getTime()
                        }
                        return target.call(thisArg, ...argumentsList)
                    }
                })
            })
        })

        return clients
    }, [
        clientId,
        organizationId,
        shortCode,
        siteId,
        proxy,
        fetchOptions,
        locale,
        currency,
        headers?.['correlation-id']
    ])

    const auth = useMemo(() => {
        return new Auth({
            clientId,
            organizationId,
            shortCode,
            siteId,
            proxy,
            redirectURI,
            fetchOptions,
            fetchedToken,
            OCAPISessionsURL
        })
    }, [
        clientId,
        organizationId,
        shortCode,
        siteId,
        proxy,
        redirectURI,
        fetchOptions,
        fetchedToken,
        OCAPISessionsURL
    ])

    // Initialize the session
    useEffect(() => void auth.ready(), [auth])

    return (
        <ConfigContext.Provider
            value={{
                clientId,
                headers,
                organizationId,
                proxy,
                redirectURI,
                fetchOptions,
                siteId,
                shortCode,
                locale,
                currency
            }}
        >
            <CommerceApiContext.Provider value={apiClients}>
                <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
            </CommerceApiContext.Provider>
        </ConfigContext.Provider>
    )
}

export default CommerceApiProvider
