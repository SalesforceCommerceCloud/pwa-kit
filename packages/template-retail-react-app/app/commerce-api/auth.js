/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {HTTPError} from 'pwa-kit-react-sdk/ssr/universal/errors'
import {createCodeVerifier, generateCodeChallenge} from './pkce'
import {isTokenExpired, createGetTokenBody, hasSFRAAuthStateChanged} from './utils'
import {
    usidStorageKey,
    cidStorageKey,
    encUserIdStorageKey,
    tokenStorageKey,
    refreshTokenRegisteredStorageKey,
    refreshTokenGuestStorageKey,
    oidStorageKey,
    dwSessionIdKey,
    REFRESH_TOKEN_COOKIE_AGE,
    EXPIRED_TOKEN,
    INVALID_TOKEN
} from './constants'
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

/**
 * A  class that provides auth functionality for the retail react app.
 */
const slasCallbackEndpoint = '/callback'
class Auth {
    constructor(api) {
        this._api = api
        this._config = api._config
        this._onClient = typeof window !== 'undefined'
        this._storageCopy = this._onClient ? new LocalStorage() : new Map()

        // To store tokens as cookies
        // change the next line to
        // this._storage = this._onClient ? new CookieStorage() : new Map()
        this._storage = this._onClient ? new LocalStorage() : new Map()

        const configOid = api._config.parameters.organizationId
        if (!this.oid) {
            this.oid = configOid
        }

        if (this.oid !== configOid) {
            this._clearAuth()
            this.oid = configOid
        }

        this.login = this.login.bind(this)
        this.logout = this.logout.bind(this)
    }

    /**
     * Enum for user types
     * @enum {string}
     */
    static USER_TYPE = {
        REGISTERED: 'registered',
        GUEST: 'guest'
    }

    /**
     * Returns the api client configuration
     * @returns {boolean}
     */
    get pendingLogin() {
        return this._pendingLogin
    }

    get authToken() {
        return this._storage.get(tokenStorageKey)
    }

    set authToken(token) {
        this._storage.set(tokenStorageKey, token)
    }

    get userType() {
        return this._storage.get(refreshTokenRegisteredStorageKey)
            ? Auth.USER_TYPE.REGISTERED
            : Auth.USER_TYPE.GUEST
    }

    get refreshToken() {
        const storageKey =
            this.userType === Auth.USER_TYPE.REGISTERED
                ? refreshTokenRegisteredStorageKey
                : refreshTokenGuestStorageKey
        return this._storage.get(storageKey)
    }

    get usid() {
        return this._storage.get(usidStorageKey)
    }

    set usid(usid) {
        this._storage.set(usidStorageKey, usid)
    }

    get cid() {
        return this._storage.get(cidStorageKey)
    }

    set cid(cid) {
        this._storage.set(cidStorageKey, cid)
    }

    get encUserId() {
        return this._storage.get(encUserIdStorageKey)
    }

    set encUserId(encUserId) {
        this._storage.set(encUserIdStorageKey, encUserId)
    }

    get oid() {
        return this._storage.get(oidStorageKey)
    }

    set oid(oid) {
        this._storage.set(oidStorageKey, oid)
    }

    get isTokenValid() {
        return (
            !isTokenExpired(this.authToken) &&
            !hasSFRAAuthStateChanged(this._storage, this._storageCopy)
        )
    }

    /**
     * Save refresh token in designated storage.
     *
     * @param {string} token The refresh token.
     * @param {USER_TYPE} type Type of the user.
     */
    _saveRefreshToken(token, type) {
        /**
         * For hybrid deployments, We store a copy of the refresh_token
         * to update access_token whenever customer auth state changes on SFRA.
         */
        if (type === Auth.USER_TYPE.REGISTERED) {
            this._storage.set(refreshTokenRegisteredStorageKey, token, {
                expires: REFRESH_TOKEN_COOKIE_AGE
            })
            this._storage.delete(refreshTokenGuestStorageKey)

            this._storageCopy.set(refreshTokenRegisteredStorageKey, token)
            this._storageCopy.delete(refreshTokenGuestStorageKey)
            return
        }

        this._storage.set(refreshTokenGuestStorageKey, token, {expires: REFRESH_TOKEN_COOKIE_AGE})
        this._storage.delete(refreshTokenRegisteredStorageKey)

        this._storageCopy.set(refreshTokenGuestStorageKey, token)
        this._storageCopy.delete(refreshTokenRegisteredStorageKey)
    }

    /**
     * Called with the details from the redirect page that _loginWithCredentials returns
     * I think it's best we leave it to developers on how and where to call from
     * @param {{grantType, code, usid, codeVerifier, redirectUri}} requestDetails - The cutomerId of customer to get.
     */
    async getLoggedInToken(requestDetails) {
        const data = new URLSearchParams()
        const {grantType, code, usid, codeVerifier, redirectUri} = requestDetails
        data.append('code', code)
        data.append('grant_type', grantType)
        data.append('usid', usid)
        data.append('code_verifier', codeVerifier)
        data.append('client_id', this._config.parameters.clientId)
        data.append('redirect_uri', redirectUri)

        const options = {
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`
            },
            body: data
        }

        const response = await this._api.shopperLogin.getAccessToken(options)
        // Check for error response before handling the token
        if (response.status_code) {
            throw new HTTPError(response.status_code, response.message)
        }
        this._handleShopperLoginTokenResponse(response)
        return response
    }

    /**
     * Make a post request to the OCAPI /session endpoint to bridge the session.
     *
     * The HTTP response contains a set-cookie header which sets the dwsid session cookie.
     * This cookie is used on SFRA, and it allows shoppers to navigate between SFRA and
     * this PWA site seamlessly; this is often used to enable hybrid deployment.
     *
     * (Note: this method is client side only, b/c MRT doesn't support set-cookie header right now)
     *
     * @returns {Promise}
     */
    createOCAPISession() {
        return fetch(
            `${getAppOrigin()}/mobify/proxy/ocapi/s/${
                this._config.parameters.siteId
            }/dw/shop/v22_8/sessions`,
            {
                method: 'POST',
                headers: {
                    Authorization: this.authToken
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
        let retries = 0
        const startLoginFlow = () => {
            let authorizationMethod = '_loginAsGuest'
            if (credentials) {
                authorizationMethod = '_loginWithCredentials'
            } else if (this.isTokenValid) {
                authorizationMethod = '_reuseCurrentLogin'
            } else if (this.refreshToken) {
                authorizationMethod = '_refreshAccessToken'
            }
            return this[authorizationMethod](credentials)
                .then((result) => {
                    // Uncomment the following line for phased launch
                    // this._onClient && this.createOCAPISession()
                    return result
                })
                .catch((error) => {
                    const retryErrors = [INVALID_TOKEN, EXPIRED_TOKEN]
                    if (retries === 0 && retryErrors.includes(error.message)) {
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
        const options = {
            parameters: {
                refresh_token: this.refreshToken,
                client_id: this._config.parameters.clientId,
                channel_id: this._config.parameters.siteId
            }
        }
        await this._api.shopperLogin.logoutCustomer(options, true)
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
        const {access_token, refresh_token, customer_id, usid, enc_user_id, id_token} =
            tokenResponse
        this.authToken = `Bearer ${access_token}`
        this.usid = usid
        this.cid = customer_id

        // we use id_token to distinguish guest and registered users
        if (id_token.length > 0) {
            this.encUserId = enc_user_id
            this._saveRefreshToken(refresh_token, Auth.USER_TYPE.REGISTERED)
        } else {
            this._saveRefreshToken(refresh_token, Auth.USER_TYPE.GUEST)
        }

        if (this._onClient) {
            sessionStorage.removeItem('codeVerifier')
        }
    }

    async _reuseCurrentLogin() {
        // we're reusing the same token so we just need to return the customer object already associated with the token
        const customer = {
            authType: this.userType,
            customerId: this.cid
        }

        return customer
    }

    /**
     * Begins oAuth PCKE Flow
     * @param {{email, password}}} credentials - User Credentials.
     * @returns {object} - a skeleton registered customer object that can be used to retrieve a complete customer object
     */
    async _loginWithCredentials(credentials) {
        const codeVerifier = createCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        sessionStorage.setItem('codeVerifier', codeVerifier)

        const authorization = `Basic ${btoa(`${credentials.email}:${credentials.password}`)}`
        const options = {
            headers: {
                Authorization: authorization,
                'Content-Type': `application/x-www-form-urlencoded`
            },
            body: {
                redirect_uri: `${getAppOrigin()}${slasCallbackEndpoint}`,
                client_id: this._config.parameters.clientId,
                code_challenge: codeChallenge,
                channel_id: this._config.parameters.siteId,
                usid: this.usid // mergeBasket API requires guest usid to be sent in the authToken
            }
        }

        const response = await this._api.shopperLogin.authenticateCustomer(options, true)
        if (response.status >= 400) {
            const json = await response.json()
            throw new HTTPError(response.status, json.message)
        }

        const tokenBody = createGetTokenBody(
            response.url,
            `${getAppOrigin()}${slasCallbackEndpoint}`,
            window.sessionStorage.getItem('codeVerifier')
        )

        const {customer_id} = await this.getLoggedInToken(tokenBody)
        const customer = {
            customerId: customer_id,
            authType: Auth.USER_TYPE.REGISTERED
        }

        return customer
    }

    /**
     * Begins oAuth PCKE Flow for guest
     * @returns {object} - a guest customer object
     */
    async _loginAsGuest() {
        const codeVerifier = createCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        if (this._onClient) {
            sessionStorage.setItem('codeVerifier', codeVerifier)
        }

        const options = {
            headers: {
                Authorization: '',
                'Content-Type': `application/x-www-form-urlencoded`
            },
            parameters: {
                redirect_uri: `${getAppOrigin()}${slasCallbackEndpoint}`,
                client_id: this._config.parameters.clientId,
                code_challenge: codeChallenge,
                response_type: 'code',
                hint: 'guest'
            }
        }

        const response = await this._api.shopperLogin.authorizeCustomer(options, true)
        if (response.status >= 400) {
            let text = await response.text()
            let errorMessage = text
            try {
                const data = JSON.parse(text)
                if (data.message) {
                    errorMessage = data.message
                }
            } catch {} // eslint-disable-line no-empty
            throw new HTTPError(response.status, errorMessage)
        }

        const tokenBody = createGetTokenBody(
            response.url,
            `${getAppOrigin()}${slasCallbackEndpoint}`,
            this._onClient ? window.sessionStorage.getItem('codeVerifier') : codeVerifier
        )

        const {customer_id} = await this.getLoggedInToken(tokenBody)

        // A guest customerId will never return a customer from the customer endpoint
        const customer = {
            authType: Auth.USER_TYPE.GUEST,
            customerId: customer_id
        }

        return customer
    }

    /**
     * Creates a guest session
     * @private
     * @returns {*} - The response to be passed back to original caller.
     */
    async _createGuestSession() {
        const loginType = 'guest'
        const options = {
            body: {
                type: loginType
            }
        }

        const rawResponse = await this._api.shopperCustomers.authorizeCustomer(options, true)
        return rawResponse
    }

    /**
     * Refreshes Logged In Token
     * @private
     * @returns {<Promise>} - Handle Shopper Login Promise
     */
    async _refreshAccessToken() {
        const data = new URLSearchParams()
        data.append('grant_type', 'refresh_token')
        data.append('refresh_token', this.refreshToken)
        data.append('client_id', this._config.parameters.clientId)

        const options = {
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`
            },
            body: data
        }
        const response = await this._api.shopperLogin.getAccessToken(options)
        // Check for error response before handling the token
        if (response.status_code) {
            throw new HTTPError(response.status_code, response.message)
        }
        this._handleShopperLoginTokenResponse(response)

        const {id_token, enc_user_id, customer_id} = response
        let customer = {
            authType: Auth.USER_TYPE.GUEST,
            customerId: customer_id
        }
        // Determining if registered customer or guest
        if (id_token.length > 0 && enc_user_id.length > 0) {
            customer.authType = Auth.USER_TYPE.REGISTERED
        }
        return customer
    }

    /**
     * Removes the stored auth token.
     * @private
     */
    _clearAuth() {
        this._storage.delete(tokenStorageKey)
        this._storage.delete(refreshTokenRegisteredStorageKey)
        this._storage.delete(refreshTokenGuestStorageKey)
        this._storage.delete(usidStorageKey)
        this._storage.delete(cidStorageKey)
        this._storage.delete(encUserIdStorageKey)
        this._storage.delete(dwSessionIdKey)
    }
}

export default Auth

class Storage {
    set(key, value, options) {}
    get(key) {}
    delete(key) {}
}

class CookieStorage extends Storage {
    constructor(...args) {
        super(args)
        if (typeof document === 'undefined') {
            throw new Error('CookieStorage is not avaliable on the current environment.')
        }
    }
    set(key, value, options) {
        Cookies.set(key, value, {secure: true, ...options})
    }
    get(key) {
        return Cookies.get(key)
    }
    delete(key) {
        Cookies.remove(key)
    }
}

class LocalStorage extends Storage {
    constructor(...args) {
        super(args)
        if (typeof window === 'undefined') {
            throw new Error('LocalStorage is not avaliable on the current environment.')
        }
    }
    set(key, value) {
        window.localStorage.setItem(key, value)
    }
    get(key) {
        return window.localStorage.getItem(key)
    }
    delete(key) {
        window.localStorage.removeItem(key)
    }
}
