/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import * as sdk from 'commerce-sdk-isomorphic'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {detectStorefrontPreview} from 'pwa-kit-react-sdk/ssr/universal/components/storefront-preview/utils'
import ShopperBaskets from './shopper-baskets'
import OcapiShopperOrders from './ocapi-shopper-orders'
import Auth from '@salesforce/commerce-sdk-react/auth'
import EinsteinAPI from './einstein'
import {DWSID_HEADER_KEY} from './constants'

import {transformSDKClient} from '@salesforce/commerce-sdk-react/utils'

/**
 * The configuration details for the connecting to the API.
 * @typedef {Object} ClientConfig
 * @property {string} [proxy] - URL to proxy fetch calls through.
 * @property {string} [headers] - Request headers to be added to requests.
 * @property {Object} [parameters] - API connection parameters for SDK.
 * @property {string} [parameters.clientId]
 * @property {string} [parameters.organizationId]
 * @property {string} [parameters.shortCode]
 * @property {string} [parameters.siteId]
 * @property {string} [parameters.version]
 */

/**
 * An object containing the customer's login credentials.
 * @typedef {Object} CustomerCredentials
 * @property {string} credentials.email
 * @property {string} credentials.password
 */

/**
 * Salesforce Customer object.
 * {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#customer}}
 * @typedef {Object} Customer
 */

/**
 * A wrapper class that proxies calls to the underlying commerce-sdk-isomorphic.
 * The sdk class instances are created automatically with the given config.
 */
class CommerceAPI {
    /**
     * Create an instance of the API with the given config.
     * @param {ClientConfig} config - The config used to instantiate SDK apis.
     */
    constructor(config = {}) {
        const {proxyPath, ...restConfig} = config

        // Client-side requests should be proxied via the configured path.
        const proxy = `${getAppOrigin()}${proxyPath}`

        this._config = {proxy, ...restConfig}

        this._authConfig = {
            redirectURI: `${getAppOrigin()}/callback`,
            proxy,
            locale: this._config.locale,
            currency: this._config.currency,
            ...this._config.parameters,
            ...this._config.headers
        }

        this.auth = new Auth(this._authConfig)

        // Ensure auth is ready for synchronous access in transformer
        this._authReady = this.auth.ready()

        if (this._config.einsteinConfig?.einsteinId) {
            this.einstein = new EinsteinAPI(this)
        }

        this.isStorefrontPreview = detectStorefrontPreview()

        // A mapping of property names to the SDK class constructors we'll be
        // providing instances for.
        //
        // NOTE: `sendLocale` and `sendCurrency` for sending locale and currency info to the API:
        // - boolean, if you want to affect _all_ methods for a given API
        // - OR an array (listing the API's methods), if you want to affect only certain methods of an API
        const apiConfigs = {
            shopperCustomers: {
                api: sdk.ShopperCustomers,
                sendLocale: false
            },
            shopperBaskets: {
                api: ShopperBaskets,
                sendLocale: false,
                sendCurrency: ['createBasket']
            },
            shopperExperience: {
                api: sdk.ShopperExperience
            },
            shopperGiftCertificates: {
                api: sdk.ShopperGiftCertificates
            },
            shopperOrders: {api: OcapiShopperOrders},
            shopperProducts: {
                api: sdk.ShopperProducts,
                sendCurrency: ['getProduct', 'getProducts']
            },
            shopperPromotions: {
                api: sdk.ShopperPromotions
            },
            shopperSearch: {
                api: sdk.ShopperSearch,
                sendCurrency: ['productSearch', 'getSearchSuggestions']
            }
        }

        // Instantiate the SDK class proxies and create getters from our api mapping.
        // The proxy handlers are called when accessing any of the mapped SDK class
        // proxies, executing various pre-defined hooks for tapping into or modifying
        // the outgoing method parameters and/or incoming SDK responses
        const self = this
        Object.keys(apiConfigs).forEach((key) => {
            const SdkClass = apiConfigs[key].api
            const sdkClient = new SdkClass(this._config)
            self._sdkInstances = {
                ...self._sdkInstances,
                [key]: transformSDKClient(sdkClient, {
                    props: this._config,
                    transformer: async (_, methodName, options) => {
                        const {fetchOptions = {}} = options
                        if (fetchOptions.ignoreHooks) {
                            return options
                        }

                        const {locale, currency} = this._config

                        // Inject the locale and currency to the API call via its parameters.
                        // NOTE: The commerce sdk isomorphic will complain if you pass parameters to
                        // it that it doesn't expect, this is why we only add the locale and currency
                        // to some of the API calls.
                        // By default we send the locale param and don't send the currency param.
                        const {sendLocale = true, sendCurrency = false} = apiConfigs[key]

                        const includeGlobalLocale = Array.isArray(sendLocale)
                            ? sendLocale.includes(methodName)
                            : !!sendLocale

                        const includeGlobalCurrency = Array.isArray(sendCurrency)
                            ? sendCurrency.includes(methodName)
                            : !!sendCurrency

                        fetchOptions['parameters'] = {
                            ...(includeGlobalLocale ? {locale} : {}),
                            ...(includeGlobalCurrency ? {currency} : {}),
                            ...fetchOptions?.parameters
                        }

                        await self.auth.ready()

                        // Handle auth logic (replacing willSendRequest functionality)
                        let dwsidHeader = {}
                        const dwsid = self.auth.get('dwsid')
                        if (dwsid) {
                            dwsidHeader = {
                                [DWSID_HEADER_KEY]: dwsid
                            }
                        }

                        // Special handling for auth methods
                        if (
                            methodName === 'authenticateCustomer' ||
                            methodName === 'authorizeCustomer' ||
                            methodName === 'getAccessToken'
                        ) {
                            return {
                                ...options.parameters,
                                headers: {
                                    ...options.headers,
                                    ...fetchOptions.headers
                                },
                                credentials: 'same-origin', // Required for SLAS calls to set dwsid cookie
                                ...fetchOptions
                            }
                        }

                        const token = self.auth.get('access_token')

                        return {
                            ...options,
                            headers: {
                                ...options.headers,
                                ...dwsidHeader,
                                Authorization: `Bearer ${token}`
                            },
                            // Add cache breaker for Storefront Preview
                            parameters: {
                                ...options.parameters,
                                ...(this.isStorefrontPreview ? {c_cache_breaker: Date.now()} : {})
                            }
                        }
                    }
                })
            }
            Object.defineProperty(self, key, {
                get() {
                    return self._sdkInstances[key]
                }
            })
        })
        this.getConfig = this.getConfig.bind(this)
    }

    /**
     * Returns the api client configuration
     * @returns {ClientConfig}
     */
    getConfig() {
        return this._config
    }
}

export default CommerceAPI
