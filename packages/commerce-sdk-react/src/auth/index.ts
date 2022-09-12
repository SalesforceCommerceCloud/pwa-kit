/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {helpers, ShopperLogin, ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import jwtDecode from 'jwt-decode'
import {ApiClientConfigParams} from '../hooks/types'
import {BaseStorage, LocalStorage, CookieStorage} from './storage'

type Helpers = typeof helpers
interface AuthConfig extends ApiClientConfigParams {
    redirectURI: string
    proxy: string
}

interface JWTHeaders {
    exp: number
    iat: number
}

// this type is slightly different from ShopperLoginTypes.TokenResponse, reasons:
// 1. TokenResponse is too generic (with & {[key:string]: any}), we need a more
//    restrictive type to make sure type safe
// 2. The refresh tokens are stored separately for guest and registered user. Instead
//    of refresh_token, we have refresh_token_guest and refresh_token_registered
type AuthDataKeys =
    | 'access_token'
    | 'customer_id'
    | 'enc_user_id'
    | 'expires_in'
    | 'id_token'
    | 'idp_access_token'
    | 'refresh_token_guest'
    | 'refresh_token_registered'
    | 'token_type'
    | 'usid'
type AuthDataMap = Record<
    AuthDataKeys,
    {
        storage: BaseStorage
        key: string
        callback?: () => void
    }
>

const onClient = typeof window !== 'undefined'
const localStorage = onClient ? new LocalStorage() : new Map()
const cookieStorage = onClient ? new CookieStorage() : new Map()

/**
 * A map of the data that this auth module stores. This maps the name of the property to
 * the storage and the key when stored in that storage. You can also pass in a "callback"
 * function to do extra operation after a property is set.
 */
const DATA_MAP: AuthDataMap = {
    access_token: {
        storage: localStorage,
        key: 'access_token'
    },
    customer_id: {
        storage: localStorage,
        key: 'customer_id'
    },
    usid: {
        storage: localStorage,
        key: 'usid'
    },
    enc_user_id: {
        storage: localStorage,
        key: 'enc_user_id'
    },
    expires_in: {
        storage: localStorage,
        key: 'expires_in'
    },
    id_token: {
        storage: localStorage,
        key: 'id_token'
    },
    idp_access_token: {
        storage: localStorage,
        key: 'idp_access_token'
    },
    token_type: {
        storage: localStorage,
        key: 'token_type'
    },
    refresh_token_guest: {
        storage: cookieStorage,
        key: 'cc-nx-g',
        callback: () => {
            cookieStorage.delete('cc-nx')
        }
    },
    refresh_token_registered: {
        storage: cookieStorage,
        key: 'cc-nx',
        callback: () => {
            cookieStorage.delete('cc-nx-g')
        }
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
    private redirectURI: string
    private pending: Promise<ShopperLoginTypes.TokenResponse> | undefined
    private REFRESH_TOKEN_EXPIRATION_DAYS = 90

    constructor(config: AuthConfig) {
        this.client = new ShopperLogin({
            proxy: config.proxy,
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId
            },
            throwOnBadResponse: true
        })

        this.redirectURI = config.redirectURI
    }

    private get(name: AuthDataKeys) {
        const storage = DATA_MAP[name].storage
        const key = DATA_MAP[name].key
        return storage.get(key)
    }

    private set(name: AuthDataKeys, value: string, options?: unknown) {
        const {key, storage} = DATA_MAP[name]
        storage.set(key, value, options)
        DATA_MAP[name].callback?.()
    }

    /**
     * Every method in this class that returns a `TokenResponse` constructs it via this getter.
     */
    private get data(): ShopperLoginTypes.TokenResponse {
        return {
            access_token: this.get('access_token'),
            customer_id: this.get('customer_id'),
            enc_user_id: this.get('enc_user_id'),
            expires_in: parseInt(this.get('expires_in')),
            id_token: this.get('id_token'),
            idp_access_token: this.get('idp_access_token'),
            refresh_token: this.get('refresh_token_registered') || this.get('refresh_token_guest'),
            token_type: this.get('token_type'),
            usid: this.get('usid')
        }
    }

    /**
     * Used to validate JWT token expiration.
     */
    private isTokenExpired(token: string) {
        if (!token) {
            return true
        }
        const {exp, iat} = jwtDecode<JWTHeaders>(token.replace('Bearer ', ''))
        const validTimeSeconds = exp - iat - 60
        const tokenAgeSeconds = Date.now() / 1000 - iat
        return validTimeSeconds <= tokenAgeSeconds
    }

    /**
     * This method stores the TokenResponse object retrived from SLAS, and
     * store the data in storage.
     */
    private handleTokenResponse(res: ShopperLoginTypes.TokenResponse, isGuest: boolean) {
        this.set('access_token', res.access_token)
        this.set('customer_id', res.customer_id)
        this.set('enc_user_id', res.enc_user_id)
        this.set('expires_in', `${res.expires_in}`)
        this.set('id_token', res.id_token)
        this.set('idp_access_token', res.idp_access_token)
        this.set('token_type', res.token_type)
        this.set('usid', res.usid)

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
    async queueRequest(fn: () => Promise<ShopperLoginTypes.TokenResponse>, isGuest: boolean) {
        const queue = this.pending ?? Promise.resolve()
        this.pending = queue.then(async () => {
            const token = await fn()
            this.handleTokenResponse(token, isGuest)

            // Q: Why don't we just return token? Why re-construct the same object again?
            // A: because a user could open multiple tabs and the data in memory could be out-dated
            // We must always grab the data from the storage (cookie/localstorage) directly
            return this.data
        })
        return this.pending
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
        if (this.pending) {
            return this.pending
        }

        if (!this.isTokenExpired(this.get('access_token'))) {
            this.pending = Promise.resolve(this.data)
            return this.pending
        }

        const refreshTokenRegistered = this.get('refresh_token_registered')
        const refreshTokenGuest = this.get('refresh_token_guest')
        const refreshToken = refreshTokenRegistered || refreshTokenGuest

        if (refreshToken) {
            try {
                return this.queueRequest(
                    () => helpers.refreshAccessToken(this.client, {refreshToken}),
                    !!refreshTokenGuest
                )
            } catch {
                // If anything bad happens during refresh token flow
                // we continue with the PKCE guest user flow.
            }
        }
        return this.queueRequest(
            () => helpers.loginGuestUser(this.client, {redirectURI: this.redirectURI}),
            true
        )
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
     * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
     *
     */
    async loginRegisteredUserB2C(credentials: Parameters<Helpers['loginRegisteredUserB2C']>[1]) {
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const isGuest = false
        return this.queueRequest(
            () =>
                helpers.loginRegisteredUserB2C(this.client, credentials, {
                    redirectURI,
                    ...(usid && {usid})
                }),
            isGuest
        )
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: logout.
     *
     */
    async logout() {
        const isGuest = true
        return this.queueRequest(
            () =>
                helpers.loginGuestUser(this.client, {
                    redirectURI: this.redirectURI
                }),
            isGuest
        )
    }
}

export default Auth

/**
 * A ultility function to inject access token into a headers object.
 *
 * @Internal
 */
export const injectAccessToken = (
    headers:
        | {
              [key: string]: string
          }
        | undefined,
    accessToken: string
) => {
    const _headers = headers
        ? {
              ...headers,
              Authorization: `Bearer ${accessToken}`
          }
        : {Authorization: `Bearer ${accessToken}`}
    return _headers
}
