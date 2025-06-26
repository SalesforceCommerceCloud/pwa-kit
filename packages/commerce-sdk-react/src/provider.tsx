/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement, useEffect, useMemo} from 'react'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients, SDKClientTransformer} from './hooks/types'
import {Logger} from './types'
import {
    DWSID_COOKIE_NAME,
    MOBIFY_PATH,
    SERVER_AFFINITY_HEADER_KEY,
    SLAS_PRIVATE_PROXY_PATH
} from './constant'
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
import {transformSDKClient} from './utils'

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
    apiClients?: ApiClients
    disableAuthInit?: boolean
}

/**
 * @internal
 */
export const CommerceApiContext = React.createContext({} as ApiClients)

/**
 * @internal
 */
export const ConfigContext = React.createContext(
    {} as Omit<CommerceApiProviderProps, 'children' | 'apiClients'>
)

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
        enablePWAKitPrivateClient,
        clientSecret,
        silenceWarnings,
        logger,
        defaultDnt,
        passwordlessLoginCallbackURI,
        refreshTokenRegisteredCookieTTL,
        refreshTokenGuestCookieTTL,
        apiClients,
        disableAuthInit = false
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
        refreshTokenGuestCookieTTL,
        apiClients
    ])

    const dwsid = auth.get(DWSID_COOKIE_NAME)
    const serverAffinityHeader: Record<string, string> = {}
    if (dwsid) {
        serverAffinityHeader[SERVER_AFFINITY_HEADER_KEY] = dwsid
    }

    const _defaultTransformer: SDKClientTransformer<Record<string, any>> = (_, _$, options) => {
        return {
            ...options,
            headers: {
                ...options.headers,
                ...serverAffinityHeader
            },
            throwOnBadResponse: true,
            fetchOptions: {
                ...options.fetchOptions,
                ...fetchOptions
            }
        }
    }

    const updatedClients: ApiClients = useMemo(() => {
        if (apiClients) {
            const clients: Record<string, any> = {}

            // transformSDKClient is simply a utility function that wraps the SDK Client instance
            // in a Proxy that allows us to transform the method arguments and modify headers, parameters, and other options.
            // We don't really need to pass in the children prop to the transformer function, so we'll just pass in the rest of the props.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {children, ...restProps} = props

            Object.entries(apiClients ?? {}).forEach(([key, apiClient]) => {
                clients[key] = transformSDKClient(apiClient, {
                    props: restProps,
                    transformer: _defaultTransformer
                })
            })

            return clients as ApiClients
        }

        const config = {
            proxy,
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
            throwOnBadResponse: true,
            fetchOptions
        }

        const baseUrl = config.proxy.split(MOBIFY_PATH)[0]
        const privateClientEndpoint = `${baseUrl}${SLAS_PRIVATE_PROXY_PATH}`

        return {
            shopperBaskets: new ShopperBaskets(config),
            shopperContexts: new ShopperContexts(config),
            shopperCustomers: new ShopperCustomers(config),
            shopperExperience: new ShopperExperience(config),
            shopperGiftCertificates: new ShopperGiftCertificates(config),
            shopperLogin: new ShopperLogin({
                ...config,
                proxy: enablePWAKitPrivateClient ? privateClientEndpoint : config.proxy
            }),
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
        headers?.['correlation-id'],
        apiClients
    ])

    // Initialize the session
    useEffect(() => {
        if (!disableAuthInit) {
            void auth.ready()
        }
    }, [auth, disableAuthInit])

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
            <CommerceApiContext.Provider value={updatedClients}>
                <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
            </CommerceApiContext.Provider>
        </ConfigContext.Provider>
    )
}

export default CommerceApiProvider
