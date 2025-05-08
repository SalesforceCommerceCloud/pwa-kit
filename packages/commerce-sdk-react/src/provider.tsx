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
import {
    DWSID_COOKIE_NAME,
    MOBIFY_PATH,
    SERVER_AFFINITY_HEADER_KEY,
    SLAS_PRIVATE_PROXY_PATH
} from './constant'
export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
    redirectURI: string
    fetchOptions?: ShopperBasketsTypes.FetchOptions
    headers?: Record<string, string>
    fetchedToken?: string
    enablePWAKitPrivateClient?: boolean
    clientSecret?: string
    silenceWarnings?: boolean
    logger?: Logger
    defaultDnt?: boolean
    passwordlessLoginCallbackURI?: string
    refreshTokenRegisteredCookieTTL?: number
    refreshTokenGuestCookieTTL?: number
    OCAPISessionsURL?: string
}
export interface ApiClientConfig {
    proxy: string
    redirectURI: string
    parameters: ApiClientConfigParams
    headers?: Record<string, string>
    fetchOptions?: ShopperBasketsTypes.FetchOptions
    enablePWAKitPrivateClient?: boolean
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

export const initializeAuth = async (config: ApiClientConfig): Promise<string> => {
    const auth = new Auth({
        ...config.parameters,
        proxy: config.proxy,
        redirectURI: config.redirectURI,
        logger: console
    })
    const {access_token} = await auth.ready()
    return access_token
}

export const buildCommerceApiClients = (config: ApiClientConfig): ApiClients => {
    const clientConfig = {
        ...config,
        throwOnBadResponse: true
    }
    const baseUrl = config.proxy.split(MOBIFY_PATH)[0]
    const privateClientEndpoint = `${baseUrl}${SLAS_PRIVATE_PROXY_PATH}`
    return {
        shopperBaskets: new ShopperBaskets(clientConfig),
        shopperContexts: new ShopperContexts(clientConfig),
        shopperCustomers: new ShopperCustomers(clientConfig),
        shopperExperience: new ShopperExperience(clientConfig),
        shopperGiftCertificates: new ShopperGiftCertificates(clientConfig),
        shopperLogin: new ShopperLogin({
            ...clientConfig,
            proxy: clientConfig.enablePWAKitPrivateClient
                ? privateClientEndpoint
                : clientConfig.proxy
        }),
        shopperOrders: new ShopperOrders(clientConfig),
        shopperProducts: new ShopperProducts(clientConfig),
        shopperPromotions: new ShopperPromotions(clientConfig),
        shopperSearch: new ShopperSearch(clientConfig),
        shopperSeo: new ShopperSeo(clientConfig),
        shopperStores: new ShopperStores(clientConfig)
    }
}

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
        enablePWAKitPrivateClient,
        clientSecret,
        silenceWarnings,
        logger,
        defaultDnt,
        passwordlessLoginCallbackURI,
        refreshTokenRegisteredCookieTTL,
        refreshTokenGuestCookieTTL
    } = props

    // Set the logger based on provided configuration, or default to the console object if no logger is provided
    const configLogger = logger || console

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
            enablePWAKitPrivateClient,
            clientSecret,
            silenceWarnings,
            logger: configLogger,
            defaultDnt,
            passwordlessLoginCallbackURI,
            refreshTokenRegisteredCookieTTL,
            refreshTokenGuestCookieTTL
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
        enablePWAKitPrivateClient,
        clientSecret,
        silenceWarnings,
        configLogger,
        defaultDnt,
        passwordlessLoginCallbackURI,
        refreshTokenRegisteredCookieTTL,
        refreshTokenGuestCookieTTL
    ])

    const dwsid = auth.get(DWSID_COOKIE_NAME)
    const serverAffinityHeader: Record<string, string> = {}
    if (dwsid) {
        serverAffinityHeader[SERVER_AFFINITY_HEADER_KEY] = dwsid
    }

    const config = {
        proxy,
        redirectURI,
        headers: {
            ...headers,
            ...serverAffinityHeader
        },
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId,
            locale,
            currency
        },
        fetchOptions,
        enablePWAKitPrivateClient
    }

    const apiClients = useMemo(() => {
        return buildCommerceApiClients(config)
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
                logger: configLogger,
                defaultDnt,
                passwordlessLoginCallbackURI,
                refreshTokenRegisteredCookieTTL,
                refreshTokenGuestCookieTTL
            }}
        >
            <CommerceApiContext.Provider value={apiClients}>
                <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
            </CommerceApiContext.Provider>
        </ConfigContext.Provider>
    )
}

export default CommerceApiProvider
