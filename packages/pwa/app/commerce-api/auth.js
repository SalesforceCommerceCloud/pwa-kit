/* eslint-disable no-unused-vars */
import {getAppOrigin} from 'pwa-kit-react-sdk/dist/utils/url'
import {createCodeVerifier, generateCodeChallenge} from './pkce'

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

const tokenStorageKey = 'token'
const refreshTokenStorageKey = 'refresh-token'

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
        this._authToken = this._onClient ? window.localStorage.getItem(tokenStorageKey) : undefined
        this._refreshToken = this._onClient
            ? window.localStorage.getItem(refreshTokenStorageKey)
            : undefined

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

        await this._handleShopperLoginTokenResponse(response)
        return response
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
            } else if (this._authToken && this._refreshToken) {
                authorizationMethod = '_refreshLoggedInToken'
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
        this._clearAuth()
        if (shouldLoginAsGuest) {
            return this.login()
        }
    }

    /**
     * Fetches an auth token and customer data.
     * @private
     * @returns {{authToken: string, customer: Customer}}
     */
    async _loginAsGuest() {
        let rawResponse
        if (this._authToken) {
            rawResponse = await this._refreshGuestSession()
        } else {
            rawResponse = await this._createGuestSession()
        }
        const resJson = await rawResponse.json()
        const authToken = rawResponse.headers.get('authorization')

        if (rawResponse.status >= 400) {
            if (resJson.title === 'Expired Token') {
                throw new Error('EXPIRED_TOKEN')
            }
            throw new Error(resJson.detail)
        }
        this._customerId = resJson.customerId
        this._saveAccessToken(authToken)

        return {
            authToken,
            customer: resJson
        }
    }

    /**
     * Handles Response from ShopperLogin GetAccessToken, calls the getCustomer method and removes the PCKE code verifier from session storage
     * @private
     * @param {*} tokenResponse - The cutomerId of customer to get.
     */
    async _handleShopperLoginTokenResponse(tokenResponse) {
        const {access_token, refresh_token, customer_id} = tokenResponse
        this._customerId = customer_id
        this._saveAccessToken(`Bearer ${access_token}`)
        this._saveRefreshToken(refresh_token)
        sessionStorage.removeItem('codeVerifier')
    }

    /**
     * Begins oAuth PCKE Flow
     * @param {{email, password}}} credentials - User Credentials.
     * @returns {string} - Redirect Url with parameters to retrieve the access token.
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
            parameters: {
                redirect_uri: `${getAppOrigin()}${slasCallbackEndpoint}`,
                client_id: this._config.parameters.clientId,
                code_challenge: codeChallenge,
                channel_id: this._config.parameters.siteId
            }
        }

        const response = await this._api.shopperLogin.authenticateCustomer(options, true)
        if (response.status > 400) {
            const json = await response.json()
            throw new Error(json.message)
        }

        return response.url
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
    async _refreshLoggedInToken() {
        const data = new URLSearchParams()
        data.append('grant_type', 'refresh_token')
        data.append('refresh_token', this._refreshToken)
        data.append('client_id', this._config.parameters.clientId)

        const options = {
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`
            },
            body: data
        }
        const response = await this._api.shopperLogin.getAccessToken(options)
        await this._handleShopperLoginTokenResponse(response)
        return response
    }

    /**
     * Refreshes a guest session
     * @private
     * @returns {*} - The response to be passed back to original caller.
     */
    async _refreshGuestSession() {
        const loginType = 'refresh'
        const options = {
            headers: {
                Authorization: this._authToken
                // 'Content-Type': `application/x-www-form-urlencoded`
            },
            body: {
                type: loginType
            }
        }
        const rawResponse = await this._api.shopperCustomers.authorizeCustomer(options, true)
        return rawResponse
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
     * Removes the stored auth token.
     * @private
     */
    _clearAuth() {
        this._customerId = undefined
        this._authToken = undefined
        this._refreshToken = undefined
        if (this._onClient) {
            window.localStorage.removeItem(tokenStorageKey)
            window.localStorage.removeItem(refreshTokenStorageKey)
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
