/* eslint-disable no-unused-vars */
import {getAppOrigin} from 'pwa-kit-react-sdk/dist/utils/url'
import {HTTPError} from 'pwa-kit-react-sdk/dist/ssr/universal/errors'
import {createCodeVerifier, generateCodeChallenge} from './pkce'
import {createGetTokenBody} from './utils'

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
        this._usid = this._onClient ? window.localStorage.getItem(usidStorageKey) : undefined

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
        this._handleShopperLoginTokenResponse(response)
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
            let authorizationMethod = this._onClient
                ? '_loginAsGuestClientSide'
                : '_loginAsGuestServerSide'
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
        this._clearAuth()
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
        const {access_token, refresh_token, customer_id, usid} = tokenResponse
        this._customerId = customer_id
        this._saveAccessToken(`Bearer ${access_token}`)
        this._saveRefreshToken(refresh_token)
        this._saveUsid(usid)

        sessionStorage.removeItem('codeVerifier')
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
            parameters: {
                redirect_uri: `${getAppOrigin()}${slasCallbackEndpoint}`,
                client_id: this._config.parameters.clientId,
                code_challenge: codeChallenge,
                channel_id: this._config.parameters.siteId
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
            authType: 'registered'
        }

        return customer
    }

    /**
     * Fetches an auth token for server side requests
     * @private
     * @returns {{authToken: string, customer: Customer}}
     */
    async _loginAsGuestServerSide() {
        let rawResponse = await this._createGuestSession()

        const resJson = await rawResponse.json()
        const authToken = rawResponse.headers.get('authorization')

        if (rawResponse.status >= 400) {
            if (resJson.title === 'Expired Token') {
                throw new HTTPError(rawResponse.status, 'EXPIRED_TOKEN')
            }
            throw new HTTPError(rawResponse.status, resJson.detail)
        }
        this._customerId = resJson.customerId
        this._saveAccessToken(authToken)

        return {
            authToken,
            customer: resJson
        }
    }

    /**
     * Begins oAuth PCKE Flow for guest
     * @returns {object} - a guest customer object
     */
    async _loginAsGuestClientSide() {
        const codeVerifier = createCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        sessionStorage.setItem('codeVerifier', codeVerifier)
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
            const json = await response.json()
            throw new HTTPError(response.status, json.message)
        }

        const tokenBody = createGetTokenBody(
            response.url,
            `${getAppOrigin()}${slasCallbackEndpoint}`,
            window.sessionStorage.getItem('codeVerifier')
        )

        const {customer_id} = await this.getLoggedInToken(tokenBody)

        // A guest customerId will never return a customer from the customer endpoint
        const customer = {
            authType: 'guest',
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
        data.append('refresh_token', this._refreshToken)
        data.append('client_id', this._config.parameters.clientId)

        const options = {
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`
            },
            body: data
        }
        const response = await this._api.shopperLogin.getAccessToken(options)
        this._handleShopperLoginTokenResponse(response)

        const {id_token, enc_user_id, customer_id} = response
        let customer = {
            authType: 'guest',
            customerId: customer_id
        }
        // Determining if registered customer or guest
        if (id_token.length > 0 && enc_user_id.length > 0) {
            customer.authType = 'registered'
        }
        return customer
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
     * Stores the given auth token.
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
     * Removes the stored auth token.
     * @private
     */
    _clearAuth() {
        this._customerId = undefined
        this._authToken = undefined
        this._refreshToken = undefined
        this._usid = undefined
        if (this._onClient) {
            window.localStorage.removeItem(tokenStorageKey)
            window.localStorage.removeItem(refreshTokenStorageKey)
            window.localStorage.removeItem(usidStorageKey)
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
