/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement, useEffect, useMemo} from 'react'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients, SDKClientTransformer} from './hooks/types'
import {Logger} from './types'
import {DWSID_COOKIE_NAME, SERVER_AFFINITY_HEADER_KEY} from './constant'
import {
    ShopperBaskets,
    ShopperBasketsV2,
    ShopperConsents,
    ShopperContexts,
    ShopperConfigurations,
    ShopperCustomers,
    ShopperExperience,
    ShopperGiftCertificates,
    ShopperLogin,
    ShopperOrders,
    ShopperPayments,
    ShopperProducts,
    ShopperPromotions,
    ShopperSearch,
    ShopperSEO,
    ShopperStores,
    FetchOptions
} from 'commerce-sdk-isomorphic'
import {transformSDKClient} from './utils'

export interface PageDesignerParams {
    mode?: string
    pdToken?: string
    pageId?: string
}

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
    redirectURI: string
    fetchOptions?: FetchOptions
    headers?: Record<string, string>
    fetchedToken?: string
    enablePWAKitPrivateClient?: boolean
    privateClientProxyEndpoint?: string
    clientSecret?: string
    silenceWarnings?: boolean
    logger?: Logger
    defaultDnt?: boolean
    passwordlessLoginCallbackURI?: string
    refreshTokenRegisteredCookieTTL?: number
    refreshTokenGuestCookieTTL?: number
    apiClients?: ApiClients
    disableAuthInit?: boolean
    hybridAuthEnabled?: boolean
    pageDesignerParams?: PageDesignerParams
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
 * 
 * `hybridAuthEnabled` is an optional flag that indicates the current Site has Hybrid Auth enabled.
 * This drives the behavior of the `clearECOMSession` method. If `hybridAuthEnabled` is true,
 * the `clearECOMSession` method will not be called. This makes sure the session-bridged dwsid, received from `/oauth2/token` call
 * on shopper login is NOT cleared and can be used to maintain the server affinity.
 * 
 * `hybridAuthEnabled` flag can also be used to drive other Hybrid Auth specific behaviors in the future.
 * 
 * Note: `hybridAuthEnabled` should NOT be set to true for hybrid storefronts using Plugin SLAS as we need the dwsid to be deleted
 * to force session-bridging on SFRA as in this case, the `oauth2/token` call does not return a dwsid.
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
        privateClientProxyEndpoint,
        clientSecret,
        silenceWarnings,
        logger,
        defaultDnt,
        passwordlessLoginCallbackURI,
        refreshTokenRegisteredCookieTTL,
        refreshTokenGuestCookieTTL,
        apiClients,
        disableAuthInit = false,
        hybridAuthEnabled = false,
        pageDesignerParams = {}
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
            headers,
            fetchOptions,
            fetchedToken,
            enablePWAKitPrivateClient,
            privateClientProxyEndpoint,
            clientSecret,
            silenceWarnings,
            logger: configLogger,
            defaultDnt,
            passwordlessLoginCallbackURI,
            refreshTokenRegisteredCookieTTL,
            refreshTokenGuestCookieTTL,
            hybridAuthEnabled
        })
    }, [
        clientId,
        organizationId,
        shortCode,
        siteId,
        proxy,
        redirectURI,
        headers,
        fetchOptions,
        fetchedToken,
        enablePWAKitPrivateClient,
        privateClientProxyEndpoint,
        clientSecret,
        silenceWarnings,
        configLogger,
        defaultDnt,
        passwordlessLoginCallbackURI,
        refreshTokenRegisteredCookieTTL,
        refreshTokenGuestCookieTTL,
        apiClients,
        hybridAuthEnabled
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

        return {
            shopperBaskets: new ShopperBaskets(config),
            shopperBasketsV2: new ShopperBasketsV2(config),
            shopperConsents: new ShopperConsents(config),
            shopperContexts: new ShopperContexts(config),
            shopperConfigurations: new ShopperConfigurations(config),
            shopperCustomers: new ShopperCustomers(config),
            shopperExperience: new ShopperExperience(config),
            shopperGiftCertificates: new ShopperGiftCertificates(config),
            shopperLogin: new ShopperLogin({
                ...config,
                proxy: enablePWAKitPrivateClient ? privateClientProxyEndpoint : config.proxy
            }),
            shopperOrders: new ShopperOrders(config),
            shopperPayments: new ShopperPayments(config),
            shopperProducts: new ShopperProducts(config),
            shopperPromotions: new ShopperPromotions(config),
            shopperSearch: new ShopperSearch(config),
            shopperSeo: new ShopperSEO(config),
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
                refreshTokenGuestCookieTTL,
                pageDesignerParams
            }}
        >
            <CommerceApiContext.Provider value={updatedClients}>
                <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
            </CommerceApiContext.Provider>
        </ConfigContext.Provider>
    )
}

export default CommerceApiProvider
