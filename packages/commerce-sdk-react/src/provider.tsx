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
    ShopperBasketsTypes
} from 'commerce-sdk-isomorphic'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients} from './hooks/types'

const Shopper_APIs = [
    'shopperBaskets',
    'shopperContexts',
    'shopperCustomers',
    'shopperExperience',
    'shopperLogin',
    'shopperOrders',
    'shopperProducts',
    'shopperPromotions',
    'shopperGiftCertificates',
    'shopperSearch',
] as const

interface CommerceApiProxyPaths {
    shopperBaskets?: string
    shopperContexts?: string
    shopperCustomers?: string
    shopperExperience?: string
    shopperLogin?: string
    shopperOrders?: string
    shopperProducts?: string
    shopperPromotions?: string
    shopperGiftCertificates?: string
    shopperSearch?: string
    defaultPath: string
    host: string
}

type CommerceApiProxyConfigEntry = [string, ApiClientConfigParams]

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string | CommerceApiProxyPaths
    locale: string
    currency: string
    redirectURI: string
    fetchOptions?: ShopperBasketsTypes.FetchOptions
    headers?: Record<string, string>
    fetchedToken?: string
    OCAPISessionsURL?: string
    clientSecret?: string
    silenceWarnings?: boolean
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
        OCAPISessionsURL,
        clientSecret,
        silenceWarnings
    } = props

    let defaultProxy = '';
    if (typeof proxy === 'string') {
        defaultProxy = proxy
    } else {
        defaultProxy = `${proxy.host}${proxy.defaultPath}`
    }
    let configs = {'default': {
            proxy: defaultProxy,
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
    }

    Shopper_APIs.map( (api) => {
        let endpoint = defaultProxy;

        if (typeof proxy != 'string') {
            endpoint = `${proxy.host}${proxy[api]}`
        }

        let config = {
            proxy: endpoint,
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

        configs = Object.assign(configs, {
            [api]: config
        })
    })

    const config = {
        proxy: defaultProxy,
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
        return {
            shopperBaskets: new ShopperBaskets(config),
            shopperContexts: new ShopperContexts(config),
            shopperCustomers: new ShopperCustomers(config),
            shopperExperience: new ShopperExperience(config),
            shopperGiftCertificates: new ShopperGiftCertificates(config),
            shopperLogin: new ShopperLogin(config),
            shopperOrders: new ShopperOrders(config),
            shopperProducts: new ShopperProducts(config),
            shopperPromotions: new ShopperPromotions(config),
            shopperSearch: new ShopperSearch(config)
        }
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

    let authProxy = '';
    if (typeof proxy === 'string') {
        authProxy = proxy
    } else {
        if (proxy.shopperLogin) {
            authProxy = `${proxy.host}${proxy.shopperLogin}`
        } else {
            authProxy = `${proxy.host}${proxy.defaultPath}`
        }
    }

    const auth = useMemo(() => {
        return new Auth({
            clientId,
            organizationId,
            shortCode,
            siteId,
            proxy: authProxy,
            redirectURI,
            fetchOptions,
            fetchedToken,
            OCAPISessionsURL,
            clientSecret,
            silenceWarnings
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
        OCAPISessionsURL,
        clientSecret,
        silenceWarnings
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
                currency,
                silenceWarnings
            }}
        >
            <CommerceApiContext.Provider value={apiClients}>
                <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
            </CommerceApiContext.Provider>
        </ConfigContext.Provider>
    )
}

export default CommerceApiProvider
