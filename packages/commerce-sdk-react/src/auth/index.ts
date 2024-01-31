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
import {slasSecretWarningMsg} from '../constant'

type TokenResponse = ShopperLoginTypes.TokenResponse
type Helpers = typeof helpers
interface AuthConfig extends ApiClientConfigParams {
    redirectURI: string
    proxy: string
    fetchOptions?: ShopperLoginTypes.FetchOptions
    fetchedToken?: string
    OCAPISessionsURL?: string
    clientSecret?: string
    silenceWarnings?: boolean
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
    | 'refresh_token_guest_copy'
    | 'refresh_token_registered_copy'

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
    // For Hybrid setups, we need a mechanism to inform PWA Kit whenever customer login state changes on SFRA.
    // So we maintain a copy of the refersh_tokens in the local storage which is compared to the actual refresh_token stored in cookie storage.
    // If the key or value of the refresh_token in local storage is different from the one in cookie storage, this indicates a change in customer auth state and we invalidate the access_token in PWA Kit.
    // This triggers a new fetch for access_token using the current refresh_token from cookie storage and makes sure customer auth state is always in sync between SFRA and PWA sites in a hybrid setup.
    refresh_token_guest_copy: {
        storageType: 'local',
        key: isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-iframe' : 'cc-nx')
        }
    },
    refresh_token_registered_copy: {
        storageType: 'local',
        key: isParentTrusted ? 'cc-nx-iframe' : 'cc-nx',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g')
        }
    },
    customer_type: {
        storageType: 'local',
        key: 'customer_type'
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
    private REFRESH_TOKEN_EXPIRATION_DAYS_REGISTERED = 90
    private REFRESH_TOKEN_EXPIRATION_DAYS_GUEST = 30
    private stores: Record<StorageType, BaseStorage>
    private fetchedToken: string
    private OCAPISessionsURL: string
    private clientSecret: string
    private silenceWarnings: boolean

    constructor(config: AuthConfig) {
        this.client = new ShopperLogin({
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

        this.OCAPISessionsURL = config.OCAPISessionsURL || ''

        this.clientSecret = config.clientSecret || ''
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
     * WARNING: This function is relevant to be used in Hybrid deployments only.
     * Compares the refresh_token keys for guest('cc-nx-g') and registered('cc-nx') login from the cookie received from SFRA with the copy stored in localstorage on PWA Kit
     * to determine if the login state of the shopper on SFRA site has changed. If the keys are different we return true considering the login state did change. If the keys are same,
     * we compare the values of the refresh_token to cover an edge case where the login state might have changed multiple times on SFRA and the eventual refresh_token key might be same
     * as that on PWA Kit which would incorrectly show both keys to be the same even though the sessions are different.
     * @returns {boolean} true if the keys do not match (login state changed), false otherwise.
     */
    private hasSFRAAuthStateChanged() {
        const refreshTokenKey =
            (this.get('refresh_token_registered') && 'refresh_token_registered') ||
            'refresh_token_guest'

        const refreshTokenCopyKey =
            (this.get('refresh_token_registered_copy') && 'refresh_token_registered_copy') ||
            'refresh_token_guest_copy'

        if (DATA_MAP[refreshTokenKey].key !== DATA_MAP[refreshTokenCopyKey].key) {
            return true
        }

        return this.get(refreshTokenKey) !== this.get(refreshTokenCopyKey)
    }

    /**
     * Used to validate JWT expiry and ensure auth state consistency with SFRA in a hybrid setup
     * @param token access_token received on SLAS authentication
     * @returns {boolean} true if JWT is valid; false otherwise
     */
    private isTokenValidForHybrid(token: string) {
        return !this.isTokenExpired(token) && !this.hasSFRAAuthStateChanged()
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
        const refreshTokenCopyKey = isGuest
            ? 'refresh_token_guest_copy'
            : 'refresh_token_registered_copy'

        const refreshTokenExpiry = isGuest
            ? this.REFRESH_TOKEN_EXPIRATION_DAYS_GUEST
            : this.REFRESH_TOKEN_EXPIRATION_DAYS_REGISTERED

        this.set(refreshTokenKey, res.refresh_token, {
            expires: refreshTokenExpiry
        })
        this.set(refreshTokenCopyKey, res.refresh_token, {
            expires: refreshTokenExpiry
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
                if (onClient() && this.OCAPISessionsURL) {
                    void this.createOCAPISession()
                }
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
            console.warn(msg)
        }
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
        const accessToken = this.get('access_token')

        if (accessToken && this.isTokenValidForHybrid(accessToken)) {
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
                            {refreshToken},
                            {
                                clientSecret: this.clientSecret ? this.clientSecret : undefined
                            }
                        ),
                    !!refreshTokenGuest
                )
            } catch (error) {
                // If the refresh token is invalid, we need to re-login the user
                if (error instanceof Error && 'response' in error) {
                    // commerce-sdk-isomorphic throws a `ResponseError`, but doesn't export the class.
                    // We can't use `instanceof`, so instead we just check for the `response` property
                    // and assume it is a fetch Response.
                    const json = await (error['response'] as Response).json()
                    if (json.message === 'invalid refresh_token') {
                        // clean up storage and restart the login flow
                        this.clearStorage()
                    }
                }
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
        if (this.clientSecret && onClient()) {
            this.logWarning(slasSecretWarningMsg)
        }
        const usid = this.get('usid')
        const isGuest = true
        const guestPrivateArgs = [this.client, {}, {clientSecret: this.clientSecret}] as const
        const guestPublicArgs = [
            this.client,
            {redirectURI: this.redirectURI, ...(usid && {usid})}
        ] as const
        const callback = this.clientSecret
            ? () => helpers.loginGuestUserPrivate(...guestPrivateArgs)
            : () => helpers.loginGuestUser(...guestPublicArgs)

        return await this.queueRequest(callback, isGuest)
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
            password,
            clientSecret: this.clientSecret ? this.clientSecret : undefined
        })
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
     *
     */
    async loginRegisteredUserB2C(credentials: Parameters<Helpers['loginRegisteredUserB2C']>[1]) {
        if (this.clientSecret && onClient()) {
            this.logWarning(slasSecretWarningMsg)
        }
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const isGuest = false
        const token = await helpers.loginRegisteredUserB2C(this.client, credentials, {
            redirectURI,
            ...(usid && {usid})
        })
        this.handleTokenResponse(token, isGuest)
        if (onClient() && this.OCAPISessionsURL) {
            void this.createOCAPISession()
        }
        return token
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: logout.
     *
     */
    async logout() {
        // Not awaiting on purpose because there isn't much we can do if this fails.
        void helpers.logout(this.client, {
            accessToken: this.get('access_token'),
            refreshToken: this.get('refresh_token_registered')
        })
        this.clearStorage()
        return await this.loginGuestUser()
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
        return fetch(this.OCAPISessionsURL, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + this.get('access_token')
            }
        })
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
