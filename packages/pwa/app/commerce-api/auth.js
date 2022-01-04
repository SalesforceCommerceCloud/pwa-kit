/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

import {helpers} from 'commerce-sdk-isomorphic'

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

const usidStorageKey = 'usid'
const encUserIdStorageKey = 'enc-user-id'
const tokenStorageKey = 'token'
const refreshTokenStorageKey = 'refresh-token'
const oidStorageKey = 'oid'

/**
 * A  class that provides auth functionality for pwa.
 */
const slasCallbackEndpoint = '/callback'
class Auth {
    constructor(api) {
        this._api = api
        this._config = api._config
        this._onClient = typeof window !== 'undefined'
        this._pendingAuth = undefined
        this._customerId = undefined

        this._oid = this._onClient ? window.localStorage.getItem(oidStorageKey) : undefined

        const configOid = api._config.parameters.organizationId
        if (this._oid !== configOid) {
            this._clearAuth()
            this._saveOid(configOid)
        } else {
            this._authToken = this._onClient
                ? window.localStorage.getItem(tokenStorageKey)
                : undefined
            this._refreshToken = this._onClient
                ? window.localStorage.getItem(refreshTokenStorageKey)
                : undefined
            this._usid = this._onClient ? window.localStorage.getItem(usidStorageKey) : undefined
            this._encUserId = this._onClient
                ? window.localStorage.getItem(encUserIdStorageKey)
                : undefined
        }

        this.login = this.login.bind(this)
        this.logout = this.logout.bind(this)
    }

    /**
     * Returns the api client configuration
     * @returns {boolean}
     */
    get pendingLogin() {
        return this._pendingLogin
    }

    get authToken() {
        return this._authToken
    }

    get refreshToken() {
        return this._refreshToken
    }

    get usid() {
        return this._usid
    }

    get encUserId() {
        return this._encUserId
    }

    get oid() {
        return this._oid
    }

    /**
     * Authorizes the customer as a registered or guest user.
     * @param {CustomerCredentials} [credentials]
     * @returns {Promise}
     */
    async login(credentials) {
        // Calling login while its already pending will return a reference
        // to the existing promise.
        if (this._pendingLogin) {
            return this._pendingLogin
        }

        this._api.shopperLogin.clientConfig.throwOnBadResponse = true

        let retries = 0
        const startLoginFlow = () => {
            let authorizationMethod = '_loginAsGuest'
            if (credentials) {
                authorizationMethod = '_loginWithCredentials'
            } else if (this._authToken && this._refreshToken) {
                authorizationMethod = '_refreshAccessToken'
            }

            return this[authorizationMethod](credentials).catch((error) => {
                if (retries === 0 && error.message === 'EXPIRED_TOKEN') {
                    retries = 1 // we only retry once
                    this._clearAuth()
                    return startLoginFlow()
                }
                throw error
            })
        }

        this._pendingLogin = startLoginFlow().finally(() => {
            // When the promise is resolved, we need to remove the reference so
            // that subsequent calls to `login` can proceed.
            this._pendingLogin = undefined
        })

        return this._pendingLogin
    }

    /**
     * Clears the stored auth token and optionally logs back in as guest.
     * @param {boolean} [shouldLoginAsGuest=true] - Indicates if we should automatically log back in as a guest
     * @returns {(Promise<Customer>|undefined)}
     */
    async logout(shouldLoginAsGuest = true) {
        await helpers.logout(this._api.shopperLogin, {refreshToken: this._refreshToken})
        await this._clearAuth()
        if (shouldLoginAsGuest) {
            return this.login()
        }
    }

    /**
     * Handles Response from ShopperLogin GetAccessToken, calls the getCustomer method and removes the PCKE code verifier from session storage
     * @private
     * @param {object} tokenResponse - access_token,id_token,refresh_token, expires_in,token_type, usid, customer_id, enc_user_id, idp_access_token
     */
    _handleShopperLoginTokenResponse(tokenResponse) {
        const {access_token, refresh_token, customer_id, usid, enc_user_id} = tokenResponse
        this._customerId = customer_id
        this._saveAccessToken(`Bearer ${access_token}`)
        this._saveRefreshToken(refresh_token)
        this._saveUsid(usid)
        // Non registered users recieve an empty string for the encoded user id value
        if (enc_user_id?.length > 0) {
            this._saveEncUserId(enc_user_id)
        }
    }

    /**
     * Begins oAuth PCKE Flow
     * @param {{email, password}}} credentials - User Credentials.
     * @returns {object} - a skeleton registered customer object that can be used to retrieve a complete customer object
     */
    async _loginWithCredentials(credentials) {
        const response = await helpers.loginRegisteredUserB2C(this._api.shopperLogin, {
            redirectURI: `${getAppOrigin()}${slasCallbackEndpoint}`,
            shopperUserId: credentials.email,
            shopperPassword: credentials.password
        })
        this._handleShopperLoginTokenResponse(response)

        return {
            customerId: response.customer_id,
            authType: 'registered'
        }
    }

    /**
     * Begins oAuth PCKE Flow for guest
     * @returns {object} - a guest customer object
     */
    async _loginAsGuest() {
        const response = await helpers.loginGuestUser(this._api.shopperLogin, {
            redirectURI: `${getAppOrigin()}${slasCallbackEndpoint}`
        })
        this._handleShopperLoginTokenResponse(response)

        // A guest customerId will never return a customer from the customer endpoint
        return {
            authType: 'guest',
            customerId: response.customer_id
        }
    }

    /**
     * Refreshes Logged In Token
     * @private
     * @returns {<Promise>} - Handle Shopper Login Promise
     */
    async _refreshAccessToken() {
        const response = await helpers.refreshToken(this._api.shopperLogin, {
            refreshToken: this._refreshToken
        })
        this._handleShopperLoginTokenResponse(response)

        const {id_token, enc_user_id, customer_id} = response
        const authType = id_token.length > 0 && enc_user_id.length > 0 ? 'registered' : 'guest'

        return {
            authType,
            customerId: customer_id
        }
    }

    /**
     * Stores the given auth token.
     * @private
     * @param {string} token - A JWT auth token.
     */
    _saveAccessToken(token) {
        this._authToken = token
        if (this._onClient) {
            window.localStorage.setItem(tokenStorageKey, token)
        }
    }

    /**
     * Stores the given usid token.
     * @private
     * @param {string} usid - Unique shopper Id.
     */
    _saveUsid(usid) {
        this._usid = usid
        if (this._onClient) {
            window.localStorage.setItem(usidStorageKey, usid)
        }
    }

    /**
     * Stores the given enc_user_id token. enc = encoded
     * @private
     * @param {string} encUserId - Logged in Shopper reference for Einstein API.
     */
    _saveEncUserId(encUserId) {
        this._encUserId = encUserId
        if (this._onClient) {
            window.localStorage.setItem(encUserIdStorageKey, encUserId)
        }
    }

    /**
     * Stores the given oid token.
     * @private
     * @param {string} oid - Unique organization Id.
     */
    _saveOid(oid) {
        this._oid = oid
        if (this._onClient) {
            window.localStorage.setItem(oidStorageKey, oid)
        }
    }

    /**
     * Removes the stored auth token.
     * @private
     */
    _clearAuth() {
        this._customerId = undefined
        this._authToken = undefined
        this._refreshToken = undefined
        this._usid = undefined
        this._encUserId = undefined
        if (this._onClient) {
            window.localStorage.removeItem(tokenStorageKey)
            window.localStorage.removeItem(refreshTokenStorageKey)
            window.localStorage.removeItem(usidStorageKey)
            window.localStorage.removeItem(encUserIdStorageKey)
        }
    }

    /**
     * Stores the given refresh token.
     * @private
     * @param {string} refreshToken - A JWT refresh token.
     */
    _saveRefreshToken(refreshToken) {
        this._refreshToken = refreshToken
        if (this._onClient) {
            window.localStorage.setItem(refreshTokenStorageKey, refreshToken)
        }
    }
}

export default Auth
