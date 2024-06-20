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
    ShopperBasketsTypes,
    ShopperStores
} from 'commerce-sdk-isomorphic'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients} from './hooks/types'
import {Logger} from './types'

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
    enablePWAKitPrivateClient?: boolean
    clientSecret?: string
    silenceWarnings?: boolean
    logger?: Logger
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
                    enablePWAKitPrivateClient={true}
                    currency="USD"
                    logger={logger}
                >
                    {children}
                </CommerceApiProvider>
        )
    }

    export default App
 * ```
 * Note: The provider can enable SLAS Private Client mode in 2 ways.
 * `enablePWAKitPrivateClient` sets commerce-sdk-react to work with the PWA proxy
 * `/mobify/slas/private` to set the private client secret. PWA users should use
 * this option.
 *
 * Non-PWA Kit users can enable private client mode by passing in a client secret
 * directly to the provider. However, be careful when doing this as you will have
 * to make sure the secret is not unexpectedly exposed to the client.
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
        enablePWAKitPrivateClient,
        clientSecret,
        silenceWarnings,
        logger
    } = props

    // Set the logger based on provided configuration, or default to the console object if no logger is provided
    const configLogger = logger || console

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
            shopperSearch: new ShopperSearch(config),
            shopperSeo: new ShopperSeo(config),
            shopperStores: new ShopperStores(config)
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
            OCAPISessionsURL,
            enablePWAKitPrivateClient,
            clientSecret,
            silenceWarnings,
            logger: configLogger
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
        enablePWAKitPrivateClient,
        clientSecret,
        silenceWarnings,
        configLogger
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
                silenceWarnings,
                logger: configLogger
            }}
        >
            <CommerceApiContext.Provider value={apiClients}>
                <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
            </CommerceApiContext.Provider>
        </ConfigContext.Provider>
    )
}

export default CommerceApiProvider
