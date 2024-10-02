/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    helpers,
    ShopperLogin,
    ShopperCustomers,
    ShopperLoginTypes,
    ShopperCustomersTypes
} from 'commerce-sdk-isomorphic'
import {jwtDecode, JwtPayload} from 'jwt-decode'
import {ApiClientConfigParams, Prettify, RemoveStringIndex} from '../hooks/types'
import {BaseStorage, LocalStorage, CookieStorage, MemoryStorage, StorageType} from './storage'
import {CustomerType} from '../hooks/useCustomerType'
import {getParentOrigin, isOriginTrusted, onClient} from '../utils'
import {
    MOBIFY_PATH,
    SLAS_PRIVATE_PROXY_PATH,
    SLAS_SECRET_WARNING_MSG,
    SLAS_SECRET_PLACEHOLDER,
    SLAS_SECRET_OVERRIDE_MSG
} from '../constant'

import {Logger} from '../types'

type TokenResponse = ShopperLoginTypes.TokenResponse
type Helpers = typeof helpers
interface AuthConfig extends ApiClientConfigParams {
    redirectURI: string
    proxy: string
    fetchOptions?: ShopperLoginTypes.FetchOptions
    fetchedToken?: string
    enablePWAKitPrivateClient?: boolean
    clientSecret?: string
    silenceWarnings?: boolean
    logger: Logger
    defaultDnt?: boolean
}

interface JWTHeaders {
    exp: number
    iat: number
}

interface SlasJwtPayload extends JwtPayload {
    sub: string
    isb: string
}

/**
 * The extended field is not from api response, we manually store the auth type,
 * so we don't need to make another API call when we already have the data.
 * Plus, the getCustomer endpoint only works for registered user, it returns a 404 for a guest user,
 * and it's not easy to grab this info in user land, so we add it into the Auth object, and expose it via a hook
 */
export type AuthData = Prettify<
    RemoveStringIndex<TokenResponse> & {
        customer_type: CustomerType
        idp_access_token: string
    }
>

/** A shopper could be guest or registered, so we store the refresh tokens individually. */
type AuthDataKeys =
    | Exclude<keyof AuthData, 'refresh_token'>
    | 'refresh_token_guest'
    | 'refresh_token_registered'
    | 'access_token_sfra'
    | 'dwsid'

type AuthDataMap = Record<
    AuthDataKeys,
    {
        storageType: StorageType
        key: string
        callback?: (storage: BaseStorage) => void
    }
>

const isParentTrusted = isOriginTrusted(getParentOrigin())

/**
 * A map of the data that this auth module stores. This maps the name of the property to
 * the storage type and the key when stored in that storage. You can also pass in a "callback"
 * function to do extra operation after a property is set.
 */
const DATA_MAP: AuthDataMap = {
    access_token: {
        storageType: 'local',
        key: 'access_token'
    },
    customer_id: {
        storageType: 'local',
        key: 'customer_id'
    },
    usid: {
        storageType: 'cookie',
        key: 'usid'
    },
    enc_user_id: {
        storageType: 'local',
        key: 'enc_user_id'
    },
    expires_in: {
        storageType: 'local',
        key: 'expires_in'
    },
    id_token: {
        storageType: 'local',
        key: 'id_token'
    },
    idp_access_token: {
        storageType: 'local',
        key: 'idp_access_token'
    },
    token_type: {
        storageType: 'local',
        key: 'token_type'
    },
    refresh_token_guest: {
        storageType: 'cookie',
        key: isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-iframe' : 'cc-nx')
        }
    },
    refresh_token_registered: {
        storageType: 'cookie',
        key: isParentTrusted ? 'cc-nx-iframe' : 'cc-nx',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g')
        }
    },
    refresh_token_expires_in: {
        storageType: 'local',
        key: 'refresh_token_expires_in'
    },
    customer_type: {
        storageType: 'local',
        key: 'customer_type'
    },
    /*
     * For Hybrid setups, we need a mechanism to inform PWA Kit whenever customer login state changes on SFRA.
     * We do this by having SFRA store the access token in cookies. If these cookies are present, PWA
     * compares the access token from the cookie with the one in local store. If the tokens are different,
     * discard the access token in local store and replace it with the access token from the cookie.
     *
     * ECOM has a 1200 character limit on the values of cookies. The access token easily exceeds this amount
     * so it sends the access token in chunks across several cookies.
     *
     * The JWT tends to come in at around 2250 characters so there's usually
     * both a cc-at and cc-at_2.
     */
    access_token_sfra: {
        storageType: 'cookie',
        key: 'cc-at'
    },
    dwsid: {
        storageType: 'cookie',
        key: 'dwsid'
    }
}

/**
 * This class is used to handle shopper authentication.
 * It is responsible for initializing shopper session, manage access
 * and refresh tokens on server/browser environments. As well as providing
 * a mechanism to queue network calls before having a valid access token.
 *
 * @Internal
 */
class Auth {
    private client: ShopperLogin<ApiClientConfigParams>
    private shopperCustomersClient: ShopperCustomers<ApiClientConfigParams>
    private redirectURI: string
    private pendingToken: Promise<TokenResponse> | undefined
    private stores: Record<StorageType, BaseStorage>
    private fetchedToken: string
    private clientSecret: string
    private silenceWarnings: boolean
    private logger: Logger
    private defaultDnt: boolean | undefined

    constructor(config: AuthConfig) {
        // Special endpoint for injecting SLAS private client secret.
        const baseUrl = config.proxy.split(MOBIFY_PATH)[0]
        const privateClientEndpoint = `${baseUrl}${SLAS_PRIVATE_PROXY_PATH}`

        this.client = new ShopperLogin({
            proxy: config.enablePWAKitPrivateClient ? privateClientEndpoint : config.proxy,
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId
            },
            throwOnBadResponse: true,
            fetchOptions: config.fetchOptions
        })
        this.shopperCustomersClient = new ShopperCustomers({
            proxy: config.proxy,
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId
            },
            throwOnBadResponse: true,
            fetchOptions: config.fetchOptions
        })

        const options = {
            keySuffix: config.siteId,
            // Setting this to true on the server allows us to reuse guest auth tokens across lambda runs
            sharedContext: !onClient()
        }

        this.stores = {
            cookie: onClient() ? new CookieStorage(options) : new MemoryStorage(options),
            local: onClient() ? new LocalStorage(options) : new MemoryStorage(options),
            memory: new MemoryStorage(options)
        }

        this.redirectURI = config.redirectURI

        this.fetchedToken = config.fetchedToken || ''

        this.logger = config.logger

        this.defaultDnt = config.defaultDnt

        /*
         * There are 2 ways to enable SLAS private client mode.
         * If enablePWAKitPrivateClient=true, we route SLAS calls to /mobify/slas/private
         * and set an internal placeholder as the client secret. The proxy will override the placeholder
         * with the actual client secret so any truthy value as the placeholder works here.
         *
         * If enablePWAKitPrivateClient=false and clientSecret is provided as a non-empty string,
         * private client mode is enabled but we don't route calls to /mobify/slas/private
         * This is how non-PWA Kit consumers of commerce-sdk-react can enable private client and set a secret
         *
         * If both enablePWAKitPrivateClient and clientSecret are truthy, enablePWAKitPrivateClient takes
         * priority and we ignore whatever was set for clientSecret. This prints a warning about the clientSecret
         * being ignored.
         *
         * If both enablePWAKitPrivateClient and clientSecret are falsey, we are in SLAS public client mode.
         */
        if (config.enablePWAKitPrivateClient && config.clientSecret) {
            this.logWarning(SLAS_SECRET_OVERRIDE_MSG)
        }
        this.clientSecret = config.enablePWAKitPrivateClient
            ? // PWA proxy is enabled, assume project is PWA and that the proxy will handle setting the secret
              // We can pass any truthy value here to satisfy commerce-sdk-isomorphic requirements
              SLAS_SECRET_PLACEHOLDER
            : // We think there are users of Commerce SDK React and Commerce SDK isomorphic outside of PWA
              // For these users to use a private client, they must have some way to set a client secret
              // PWA users should not need to touch this.
              config.clientSecret || ''

        this.silenceWarnings = config.silenceWarnings || false
    }

    get(name: AuthDataKeys) {
        const {key, storageType} = DATA_MAP[name]
        const storage = this.stores[storageType]
        return storage.get(key)
    }

    private set(name: AuthDataKeys, value: string, options?: unknown) {
        const {key, storageType} = DATA_MAP[name]
        const storage = this.stores[storageType]
        storage.set(key, value, options)
        DATA_MAP[name].callback?.(storage)
    }

    private clearStorage() {
        // Type assertion because Object.keys is silly and limited :(
        const keys = Object.keys(DATA_MAP) as AuthDataKeys[]
        keys.forEach((keyName) => {
            const {key, storageType} = DATA_MAP[keyName]
            const store = this.stores[storageType]
            store.delete(key)
        })
    }

    /**
     * Every method in this class that returns a `TokenResponse` constructs it via this getter.
     */
    private get data(): AuthData {
        return {
            access_token: this.get('access_token'),
            customer_id: this.get('customer_id'),
            enc_user_id: this.get('enc_user_id'),
            expires_in: parseInt(this.get('expires_in')),
            id_token: this.get('id_token'),
            idp_access_token: this.get('idp_access_token'),
            refresh_token: this.get('refresh_token_registered') || this.get('refresh_token_guest'),
            token_type: this.get('token_type'),
            usid: this.get('usid'),
            customer_type: this.get('customer_type') as CustomerType,
            refresh_token_expires_in: this.get('refresh_token_expires_in')
        }
    }

    /**
     * Used to validate JWT token expiration.
     */
    private isTokenExpired(token: string) {
        const {exp, iat} = jwtDecode<JWTHeaders>(token.replace('Bearer ', ''))
        const validTimeSeconds = exp - iat - 60
        const tokenAgeSeconds = Date.now() / 1000 - iat
        return validTimeSeconds <= tokenAgeSeconds
    }

    /**
     * Returns the SLAS access token or an empty string if the access token
     * is not found in local store or if SFRA wants PWA to trigger refresh token login.
     *
     * On PWA-only sites, this returns the access token from local storage.
     * On Hybrid sites, this checks whether SFRA has sent an auth token via cookies.
     * Returns an access token from SFRA if it exist.
     * If not, the access token from local store is returned.
     *
     * This is only used within this Auth module since other modules consider the access
     * token from this.get('access_token') to be the source of truth.
     *
     * @returns {string} access token
     */
    private getAccessToken() {
        let accessToken = this.get('access_token')
        const sfraAuthToken = this.get('access_token_sfra')

        if (sfraAuthToken) {
            /*
             * If SFRA sends 'refresh', we return an empty token here so PWA can trigger a login refresh
             * This key is used when logout is triggered in SFRA but the redirect after logout
             * sends the user to PWA.
             */
            if (sfraAuthToken === 'refresh') {
                this.set('access_token', '')
                this.clearSFRAAuthToken()
                return ''
            }

            const {isGuest, customerId, usid} = this.parseSlasJWT(sfraAuthToken)
            this.set('access_token', sfraAuthToken)
            this.set('customer_id', customerId)
            this.set('usid', usid)
            this.set('customer_type', isGuest ? 'guest' : 'registered')

            accessToken = sfraAuthToken
            // SFRA -> PWA access token cookie handoff is succesful so we clear the SFRA made cookies.
            // We don't want these cookies to persist and continue overriding what is in local store.
            this.clearSFRAAuthToken()
        }

        return accessToken
    }

    private clearSFRAAuthToken() {
        const {key, storageType} = DATA_MAP['access_token_sfra']
        const store = this.stores[storageType]
        store.delete(key)
    }

    private clearECOMSession() {
        const {key, storageType} = DATA_MAP['dwsid']
        const store = this.stores[storageType]
        store.delete(key)
    }

    /**
     * Converts a duration in seconds to a Date object.
     * This function takes a number representing seconds and returns a Date object
     * for the current time plus the given duration.
     *
     * @param {number} seconds - The number of seconds to add to the current time.
     * @returns {Date} A Date object for the expiration time.
     */
    private convertSecondsToDate(seconds: number): Date {
        if (typeof seconds !== 'number') {
            throw new Error('The refresh_token_expires_in seconds parameter must be a number.')
        }
        return new Date(Date.now() + seconds * 1000)
    }

    /**
     * This method stores the TokenResponse object retrived from SLAS, and
     * store the data in storage.
     */
    private handleTokenResponse(res: TokenResponse, isGuest: boolean) {
        this.set('access_token', res.access_token)
        this.set('customer_id', res.customer_id)
        this.set('enc_user_id', res.enc_user_id)
        this.set('expires_in', `${res.expires_in}`)
        this.set('id_token', res.id_token)
        this.set('idp_access_token', res.idp_access_token)
        this.set('token_type', res.token_type)
        this.set('usid', res.usid)
        this.set('customer_type', isGuest ? 'guest' : 'registered')

        const refreshTokenKey = isGuest ? 'refresh_token_guest' : 'refresh_token_registered'
        const expiresDate = res.refresh_token_expires_in
            ? this.convertSecondsToDate(res.refresh_token_expires_in)
            : undefined

        this.set(refreshTokenKey, res.refresh_token, {
            expires: expiresDate
        })
    }

    /**
     * This method queues the requests and handles the SLAS token response.
     *
     * It returns the queue.
     *
     * @Internal
     */
    async queueRequest(fn: () => Promise<TokenResponse>, isGuest: boolean) {
        const queue = this.pendingToken ?? Promise.resolve()
        this.pendingToken = queue
            .then(async () => {
                const token = await fn()
                this.handleTokenResponse(token, isGuest)
                // Q: Why don't we just return token? Why re-construct the same object again?
                // A: because a user could open multiple tabs and the data in memory could be out-dated
                // We must always grab the data from the storage (cookie/localstorage) directly
                return this.data
            })
            .finally(() => {
                this.pendingToken = undefined
            })
        return await this.pendingToken
    }

    logWarning = (msg: string) => {
        if (!this.silenceWarnings) {
            this.logger.warn(msg)
        }
    }

    /**
     * This method extracts the status and message from a ResponseError that is returned
     * by commerce-sdk-isomorphic.
     *
     * commerce-sdk-isomorphic throws a `ResponseError`, but doesn't export the class.
     * We can't use `instanceof`, so instead we just check for the `response` property
     * and assume it is a `ResponseError` if a response is present
     *
     * Once commerce-sdk-isomorphic exports `ResponseError` we can revisit if this method is
     * still required.
     *
     * @returns {status_code, responseMessage} contained within the ResponseError
     * @throws error if the error is not a ResponseError
     * @Internal
     */
    extractResponseError = async (error: Error) => {
        // the regular error.message will return only the generic status code message
        // ie. 'Bad Request' for 400. We need to drill specifically into the ResponseError
        // to get a more descriptive error message from SLAS
        if ('response' in error) {
            const json = await (error['response'] as Response).json()
            const status_code: string = json.status_code
            const responseMessage: string = json.message

            return {
                status_code,
                responseMessage
            }
        }
        throw error
    }

    /**
     * The ready function returns a promise that resolves with valid ShopperLogin
     * token response.
     *
     * When this method is called for the very first time, it initializes the session
     * by following the public client auth flow to get access token for the user.
     * The flow:
     * 1. If we have valid access token - use it
     * 2. If we have valid refresh token - refresh token flow
     * 3. PKCE flow
     */
    async ready() {
        if (this.fetchedToken && this.fetchedToken !== '') {
            const {isGuest, customerId, usid} = this.parseSlasJWT(this.fetchedToken)
            this.set('access_token', this.fetchedToken)
            this.set('customer_id', customerId)
            this.set('usid', usid)
            this.set('customer_type', isGuest ? 'guest' : 'registered')
            return this.data
        }
        if (this.pendingToken) {
            return await this.pendingToken
        }
        const accessToken = this.getAccessToken()

        if (accessToken && !this.isTokenExpired(accessToken)) {
            return this.data
        }
        const refreshTokenRegistered = this.get('refresh_token_registered')
        const refreshTokenGuest = this.get('refresh_token_guest')
        const refreshToken = refreshTokenRegistered || refreshTokenGuest
        if (refreshToken) {
            try {
                return await this.queueRequest(
                    () =>
                        helpers.refreshAccessToken(
                            this.client,
                            {
                                refreshToken,
                                ...(this.defaultDnt !== undefined && {dnt: this.defaultDnt})
                            },
                            {
                                clientSecret: this.clientSecret
                            }
                        ),
                    !!refreshTokenGuest
                )
            } catch (error) {
                // If the refresh token login fails, we fall back to the new guest refresh login
                const {status_code, responseMessage} = await this.extractResponseError(
                    error as Error
                )
                this.logger.error(`${status_code} ${responseMessage}`)
                // clean up storage and restart the login flow
                this.clearStorage()
                this.logger.info(`Refresh login error. Attempting to log user in as new guest.`)
            }
        }
        return this.loginGuestUser()
    }

    /**
     * Creates a function that only executes after a session is initialized.
     * @param fn Function that needs to wait until the session is initialized.
     * @returns Wrapped function
     */
    whenReady<Args extends unknown[], Data>(
        fn: (...args: Args) => Promise<Data>
    ): (...args: Args) => Promise<Data> {
        return async (...args) => {
            await this.ready()
            return await fn(...args)
        }
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginGuestUser.
     *
     */
    async loginGuestUser() {
        if (this.clientSecret && onClient() && this.clientSecret !== SLAS_SECRET_PLACEHOLDER) {
            this.logWarning(SLAS_SECRET_WARNING_MSG)
        }
        const usid = this.get('usid')
        const isGuest = true
        const guestPrivateArgs = [
            this.client,
            {
                ...(this.defaultDnt !== undefined && {dnt: this.defaultDnt}),
                ...(usid && {usid})
            },
            {clientSecret: this.clientSecret}
        ] as const
        const guestPublicArgs = [
            this.client,
            {
                redirectURI: this.redirectURI,
                ...(this.defaultDnt !== undefined && {dnt: this.defaultDnt}),
                ...(usid && {usid})
            }
        ] as const
        const callback = this.clientSecret
            ? () => helpers.loginGuestUserPrivate(...guestPrivateArgs)
            : () => helpers.loginGuestUser(...guestPublicArgs)

        try {
            return await this.queueRequest(callback, isGuest)
        } catch (error) {
            // We catch the error here to do logging but we still need to
            // throw an error to stop the login flow from continuing.
            const {status_code, responseMessage} = await this.extractResponseError(error as Error)
            this.logger.error(`${status_code} ${responseMessage}`)
            throw new Error(
                `New guest user could not be logged in. ${status_code} ${responseMessage}`
            )
        }
    }

    /**
     * This is a wrapper method for ShopperCustomer API registerCustomer endpoint.
     *
     */
    async register(body: ShopperCustomersTypes.CustomerRegistration) {
        const {
            customer: {login},
            password
        } = body

        // login is optional field from isomorphic library
        // type CustomerRegistration
        // here we had to guard it to avoid ts error
        if (!login) {
            throw new Error('Customer registration is missing login field.')
        }

        const res = await this.shopperCustomersClient.registerCustomer({
            headers: {
                authorization: `Bearer ${this.get('access_token')}`
            },
            body
        })
        await this.loginRegisteredUserB2C({
            username: login,
            password
        })
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
     *
     */
    async loginRegisteredUserB2C(credentials: Parameters<Helpers['loginRegisteredUserB2C']>[1]) {
        if (this.clientSecret && onClient() && this.clientSecret !== SLAS_SECRET_PLACEHOLDER) {
            this.logWarning(SLAS_SECRET_WARNING_MSG)
        }
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const isGuest = false
        const token = await helpers.loginRegisteredUserB2C(
            this.client,
            {
                ...credentials,
                clientSecret: this.clientSecret
            },
            {
                redirectURI,
                ...(this.defaultDnt !== undefined && {dnt: this.defaultDnt}),
                ...(usid && {usid})
            }
        )
        this.handleTokenResponse(token, isGuest)
        if (onClient()) {
            void this.clearECOMSession()
        }
        return token
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: logout.
     *
     */
    async logout() {
        if (this.get('customer_type') === 'registered') {
            // Not awaiting on purpose because there isn't much we can do if this fails.
            void helpers.logout(this.client, {
                accessToken: this.get('access_token'),
                refreshToken: this.get('refresh_token_registered')
            })
        }
        this.clearStorage()
        return await this.loginGuestUser()
    }

    /**
     * Decode SLAS JWT and extract information such as customer id, usid, etc.
     *
     */
    parseSlasJWT(jwt: string) {
        const payload: SlasJwtPayload = jwtDecode(jwt)
        const {sub, isb} = payload

        if (!sub || !isb) {
            throw new Error('Unable to parse access token payload: missing sub and isb.')
        }

        // ISB format
        // 'uido:ecom::upn:Guest||xxxEmailxxx::uidn:FirstName LastName::gcid:xxxGuestCustomerIdxxx::rcid:xxxRegisteredCustomerIdxxx::chid:xxxSiteIdxxx',
        const isbParts = isb.split('::')
        const isGuest = isbParts[1] === 'upn:Guest'
        const customerId = isGuest
            ? isbParts[3].replace('gcid:', '')
            : isbParts[4].replace('rcid:', '')
        // SUB format
        // cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-xxxx-40f88962b836::usid:b4865233-de92-4039-xxxx-aa2dfc8c1ea5
        const usid = sub.split('::')[3].replace('usid:', '')
        return {
            isGuest,
            customerId,
            usid
        }
    }
}

export default Auth
