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
import jwtDecode, {JwtPayload} from 'jwt-decode'
import {ApiClientConfigParams, Prettify, RemoveStringIndex} from '../hooks/types'
import {BaseStorage, LocalStorage, CookieStorage, MemoryStorage, StorageType} from './storage'
import {CustomerType} from '../hooks/useCustomerType'
import {onClient} from '../utils'

type TokenResponse = ShopperLoginTypes.TokenResponse
type Helpers = typeof helpers
interface AuthConfig extends ApiClientConfigParams {
    redirectURI: string
    proxy: string
    fetchOptions?: ShopperLoginTypes.FetchOptions
    fetchedToken?: string
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

type AuthDataMap = Record<
    AuthDataKeys,
    {
        storageType: StorageType
        key: string
        callback?: (storage: BaseStorage) => void
    }
>

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
        key: 'cc-nx-g',
        callback: (store) => {
            store.delete('cc-nx')
        }
    },
    refresh_token_registered: {
        storageType: 'cookie',
        key: 'cc-nx',
        callback: (store) => {
            store.delete('cc-nx-g')
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
    private REFRESH_TOKEN_EXPIRATION_DAYS = 90
    private stores: Record<StorageType, BaseStorage>
    private fetchedToken: string

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

        const storageOptions = {keyPrefix: config.siteId}
        const serverStorageOptions = {
            keyPrefix: config.siteId,
            sharedContext: true // This allows use to reused guest authentication tokens accross lambda runs.
        }

        this.stores = onClient()
            ? {
                  cookie: new CookieStorage(storageOptions),
                  local: new LocalStorage(storageOptions),
                  memory: new MemoryStorage(storageOptions)
              }
            : {
                  // Always use MemoryStorage on the server.
                  cookie: new MemoryStorage(serverStorageOptions),
                  local: new MemoryStorage(serverStorageOptions),
                  memory: new MemoryStorage(serverStorageOptions)
              }

        this.redirectURI = config.redirectURI

        this.fetchedToken = config.fetchedToken || ''
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
            customer_type: this.get('customer_type') as CustomerType
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
        this.set(refreshTokenKey, res.refresh_token, {
            expires: this.REFRESH_TOKEN_EXPIRATION_DAYS
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
        return this.pendingToken
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
            return this.pendingToken
        }
        const accessToken = this.get('access_token')

        if (accessToken && !this.isTokenExpired(accessToken)) {
            return this.data
        }
        const refreshTokenRegistered = this.get('refresh_token_registered')
        const refreshTokenGuest = this.get('refresh_token_guest')
        const refreshToken = refreshTokenRegistered || refreshTokenGuest
        if (refreshToken) {
            try {
                return await this.queueRequest(
                    () => helpers.refreshAccessToken(this.client, {refreshToken}),
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
        return this.queueRequest(
            () => helpers.loginGuestUser(this.client, {redirectURI: this.redirectURI}),
            true
        )
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
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const isGuest = true
        return this.queueRequest(
            () =>
                helpers.loginGuestUser(this.client, {
                    redirectURI,
                    ...(usid && {usid})
                }),
            isGuest
        )
    }

    /**
     * This is a wrapper method for ShopperCustomer API registerCustomer endpoint.
     *
     */
    async register(body: ShopperCustomersTypes.CustomerRegistration) {
        const {
            customer: {email},
            password
        } = body

        // email is optional field from isomorphic library
        // type CustomerRegistration
        // here we had to guard it to avoid ts error
        if (!email) {
            throw new Error('Customer registration is missing email address.')
        }

        const res = await this.shopperCustomersClient.registerCustomer({
            headers: {
                authorization: `Bearer ${this.get('access_token')}`
            },
            body
        })
        await this.loginRegisteredUserB2C({username: email, password})
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
     *
     */
    async loginRegisteredUserB2C(credentials: Parameters<Helpers['loginRegisteredUserB2C']>[1]) {
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const isGuest = false
        const token = await helpers.loginRegisteredUserB2C(this.client, credentials, {
            redirectURI,
            ...(usid && {usid})
        })
        this.handleTokenResponse(token, isGuest)
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
        return this.loginGuestUser()
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
