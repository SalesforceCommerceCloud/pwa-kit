/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

import {helpers} from 'commerce-sdk-isomorphic'
import fetch from 'cross-fetch'
import Cookies from 'js-cookie'

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
const refreshTokenStorageKey = 'cc-nx'
const refreshTokenGuestStorageKey = 'cc-nx-g'
const oidStorageKey = 'oid'
const dwSessionIdKey = 'dwsid'
const REFRESH_TOKEN_COOKIE_AGE = 90 // 90 days. This value matches SLAS cartridge.

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

        // To store tokens as cookies
        // change the next line to
        // this._storage = new CookieStorage()
        this._storage = new LocalStorage()
        const configOid = api._config.parameters.organizationId
        this._oid = this._storage.get(oidStorageKey) || configOid

        if (this._oid !== configOid) {
            this._clearAuth()
            this._saveOid(configOid)
        } else {
            this._authToken = this._storage.get(tokenStorageKey)
            this._refreshToken =
                this._storage.get(refreshTokenStorageKey) ||
                this._storage.get(refreshTokenGuestStorageKey)
            this._usid = this._storage.get(usidStorageKey)
            this._encUserId = this._storage.get(encUserIdStorageKey)
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
     * Make a post request to the OCAPI /session endpoint to bridge the session.
     *
     * The HTTP response contains a set-cookie header which sets the dwsid session cookie.
     * This cookie is used on SFRA site and it shoppers to navigate between SFRA site and
     * this PWA site seamlessly, this is often used to enable hybrid deployment.
     *
     * (Note: this method is client side only, b/c MRT doesn't support set-cookie header right now)
     *
     * @returns {Promise}
     */
    createOCAPISession() {
        return fetch(
            `${getAppOrigin()}/mobify/proxy/ocapi/s/${
                this._config.parameters.siteId
            }/dw/shop/v21_3/sessions`,
            {
                method: 'POST',
                headers: {
                    Authorization: this._authToken
                }
            }
        )
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
            } else if (this._refreshToken) {
                authorizationMethod = '_refreshAccessToken'
            }
            return this[authorizationMethod](credentials)
                .catch((error) => {
                    if (retries === 0 && error.message === 'EXPIRED_TOKEN') {
                        retries = 1 // we only retry once
                        this._clearAuth()
                        return startLoginFlow()
                    }

                    throw error
                })
                .then((result) => {
                    this._onClient && this.createOCAPISession()
                    return result
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
        const {
            access_token,
            refresh_token,
            customer_id,
            usid,
            enc_user_id,
            id_token
        } = tokenResponse
        this._customerId = customer_id
        this._saveAccessToken(`Bearer ${access_token}`)
        this._saveUsid(usid)
        // we use id_token to distinguish guest and registered users
        if (id_token.length > 0) {
            this._saveEncUserId(enc_user_id)
            this._saveRefreshToken(refresh_token, 'registered')
        } else {
            this._saveRefreshToken(refresh_token, 'guest')
        }
    }

    /**
     * Begins oAuth PCKE Flow
     * @param {{email, password}}} credentials - User Credentials.
     * @returns {object} - a skeleton registered customer object that can be used to retrieve a complete customer object
     */
    async _loginWithCredentials(credentials) {
        const response = await helpers.loginRegisteredUserB2C(
            this._api.shopperLogin,
            {
                username: credentials.email,
                password: credentials.password
            },
            {
                redirectURI: `${getAppOrigin()}${slasCallbackEndpoint}`
            }
        )

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
        const response = await helpers.refreshAccessToken(this._api.shopperLogin, {
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
            this._storage.set(tokenStorageKey, token)
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
            this._storage.set(usidStorageKey, usid)
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
            this._storage.set(encUserIdStorageKey, encUserId)
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
            this._storage.set(oidStorageKey, oid)
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
            this._storage.remove(tokenStorageKey)
            this._storage.remove(refreshTokenStorageKey)
            this._storage.remove(refreshTokenGuestStorageKey)
            this._storage.remove(usidStorageKey)
            this._storage.remove(encUserIdStorageKey)
            this._storage.remove(dwSessionIdKey)
        }
    }

    /**
     * Stores the given refresh token.
     * @private
     * @param {string} refreshToken - A JWT refresh token.
     */
    _saveRefreshToken(refreshToken, type) {
        this._refreshToken = refreshToken
        const storeageKey =
            type === 'registered' ? refreshTokenStorageKey : refreshTokenGuestStorageKey
        if (this._onClient) {
            this._storage.set(storeageKey, refreshToken, {expires: REFRESH_TOKEN_COOKIE_AGE})
        }
    }
}

export default Auth

class Storage {
    set(key, value, options) {}
    get(key) {}
    remove(key) {}
}

class CookieStorage extends Storage {
    constructor(...args) {
        super(args)
        this._avaliable = false
        if (typeof document === 'undefined') {
            console.warn('CookieStorage is not avaliable on the current environment.')
            return
        }
        this._avaliable = true
    }
    set(key, value, options) {
        this._avaliable && Cookies.set(key, value, {secure: true, ...options})
    }
    get(key) {
        return this._avaliable ? Cookies.get(key) : undefined
    }
    remove(key) {
        this._avaliable && Cookies.remove(key)
    }
}

class LocalStorage extends Storage {
    constructor(...args) {
        super(args)
        this._avaliable = false
        if (typeof window === 'undefined') {
            console.warn('LocalStorage is not avaliable on the current environment.')
            return
        }
        this._avaliable = true
    }
    set(key, value) {
        this._avaliable && window.localStorage.setItem(key, value)
    }
    get(key) {
        return this._avaliable ? window.localStorage.getItem(key) : undefined
    }
    remove(key) {
        this._avaliable && window.localStorage.removeItem(key)
    }
}
