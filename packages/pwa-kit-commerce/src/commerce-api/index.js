/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import * as sdk from 'commerce-sdk-isomorphic'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import ShopperBaskets from './shopper-baskets'
import OcapiShopperOrders from './ocapi-shopper-orders'
import {getTenantId, isError, isTokenValid} from './utils'
import Auth from './auth'
import EinsteinAPI from './einstein'

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

        this.auth = new Auth(this)

        if (this._config.einsteinConfig?.einsteinId) {
            this.einstein = new EinsteinAPI(this)
        }

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
            shopperGiftCertificates: {
                api: sdk.ShopperGiftCertificates
            },
            shopperLogin: {api: sdk.ShopperLogin, sendLocale: false},
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
            self._sdkInstances = {
                ...self._sdkInstances,
                [key]: new Proxy(new SdkClass(this._config), {
                    get: function(obj, prop) {
                        if (typeof obj[prop] === 'function') {
                            return (...args) => {
                                const fetchOptions = args[0]
                                const {locale, currency} = self._config

                                if (fetchOptions.ignoreHooks) {
                                    return obj[prop](...args)
                                }

                                // Inject the locale and currency to the API call via its parameters.
                                //
                                // NOTE: The commerce sdk isomorphic will complain if you pass parameters to
                                // it that it doesn't expect, this is why we only add the locale and currency
                                // to some of the API calls.

                                // By default we send the locale param and don't send the currency param.
                                const {sendLocale = true, sendCurrency = false} = apiConfigs[key]

                                const includeGlobalLocale = Array.isArray(sendLocale)
                                    ? sendLocale.includes(prop)
                                    : !!sendLocale

                                const includeGlobalCurrency = Array.isArray(sendCurrency)
                                    ? sendCurrency.includes(prop)
                                    : !!sendCurrency

                                fetchOptions.parameters = {
                                    ...(includeGlobalLocale ? {locale} : {}),
                                    ...(includeGlobalCurrency ? {currency} : {}),
                                    // Allowing individual API calls to override the global locale/currency
                                    ...fetchOptions.parameters
                                }

                                return self.willSendRequest(prop, ...args).then((newArgs) => {
                                    return obj[prop](...newArgs).then((res) =>
                                        self.didReceiveResponse(res, newArgs)
                                    )
                                })
                            }
                        }
                        return obj[prop]
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

    /**
     * Executed before every proxied method call to the SDK. Provides the method
     * name and arguments. This can be overidden in a subclass to perform any
     * logging or modifications to arguments before the request is sent.
     * @param {string} methodName - The name of the sdk method that will be called.
     * @param {...*} args - Original arguments for the SDK method.
     * @returns {Promise<Array>} - Updated arguments that will be passed to the SDK method
     */
    async willSendRequest(methodName, ...params) {
        // We never need to modify auth request headers for these methods
        if (
            methodName === 'authenticateCustomer' ||
            methodName === 'authorizeCustomer' ||
            methodName === 'getAccessToken'
        ) {
            return params
        }

        // If a login promise exists, we don't proceed unless it is resolved.
        const pendingLogin = this.auth.pendingLogin
        if (pendingLogin) {
            await pendingLogin
        }

        // If the token is invalid (missing, past/nearing expiration), we issue
        //  a login call, which will attempt to refresh the token or get a new
        //  guest token. Once login is complete, we can proceed.
        if (!isTokenValid(this.auth.authToken)) {
            // NOTE: Login will update `this.auth.authToken` with a fresh token
            await this.auth.login()
        }

        // Apply the appropriate auth headers and return new options
        const [fetchOptions, ...restParams] = params
        const newFetchOptions = {
            ...fetchOptions,
            headers: {...fetchOptions.headers, Authorization: this.auth.authToken}
        }
        return [newFetchOptions, ...restParams]
    }

    /**
     * Executed when receiving a response from an SDK request. The response data
     * can be mutated or inspected before being passed back to the caller. Should
     * be overidden in a subclass.
     * @param {*} response - The response from the SDK method call.
     * @param {Array} args - Original arguments for the SDK method.
     * @returns {*} - The response to be passed back to original caller.
     */
    didReceiveResponse(response, args) {
        if (isError(response)) {
            return {...response, isError: true, message: response.detail}
        }

        return response
    }
}

export default CommerceAPI
