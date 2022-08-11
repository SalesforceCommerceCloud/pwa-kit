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
    private onClient = typeof window !== 'undefined'
    private pending: Promise<ShopperLoginTypes.TokenResponse> | undefined
    private localStorage: LocalStorage
    private cookieStorage: CookieStorage
    private REFRESH_TOKEN_EXPIRATION_DAYS = 90

    constructor(config: AuthConfig) {
        this.client = new ShopperLogin({
            proxy: config.proxy,
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId,
            },
            throwOnBadResponse: true,
        })

        this.redirectURI = config.redirectURI
        this.localStorage = this.onClient ? new LocalStorage() : new Map()
        this.cookieStorage = this.onClient ? new CookieStorage() : new Map()
    }

    private get(name: AuthDataKeys) {
        const storage = this.DATA_MAP[name].storage
        const key = this.DATA_MAP[name].key
        return storage.get(key)
    }

    private set(name: AuthDataKeys, value: string, options?: any) {
        const key = this.DATA_MAP[name].key
        const storage = this.DATA_MAP[name].storage
        storage.set(key, value, options)
        this.DATA_MAP[name].callback?.()
    }

    /**
     * A map of the data that this auth module stores. This maps the name of the property to
     * the storage and the key when stored in that storage. You can also pass in a "callback"
     * function to do extra operation after a property is set.
     */
    private get DATA_MAP(): AuthDataMap {
        return {
            access_token: {
                storage: this.localStorage,
                key: 'access_token',
            },
            customer_id: {
                storage: this.localStorage,
                key: 'customer_id',
            },
            usid: {
                storage: this.localStorage,
                key: 'usid',
            },
            enc_user_id: {
                storage: this.localStorage,
                key: 'enc_user_id',
            },
            expires_in: {
                storage: this.localStorage,
                key: 'expires_in',
            },
            id_token: {
                storage: this.localStorage,
                key: 'id_token',
            },
            idp_access_token: {
                storage: this.localStorage,
                key: 'idp_access_token',
            },
            token_type: {
                storage: this.localStorage,
                key: 'token_type',
            },
            refresh_token_guest: {
                storage: this.cookieStorage,
                key: 'cc-nx-g',
                callback: () => {
                    this.cookieStorage.delete('cc-nx')
                },
            },
            refresh_token_registered: {
                storage: this.cookieStorage,
                key: 'cc-nx',
                callback: () => {
                    this.cookieStorage.delete('cc-nx-g')
                },
            },
        }
    }

    /**
     * Every promise method in this class returns the same data via this method.
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
            usid: this.get('usid'),
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
        if (validTimeSeconds > tokenAgeSeconds) {
            return false
        }

        return true
    }

    /**
     * This function follows the public client auth flow to get
     * access token for the user. Following the flow:
     * 1. If we have valid access token - use it
     * 2. If we have valid refresh token - refresh token flow
     * 3. PKCE flow
     *
     * Only call this from the "ready" function, so "ready" can manage the pending state.
     *
     */
    private async init() {
        if (!this.isTokenExpired(this.get('access_token'))) {
            return this.data
        }

        const refreshTokenRegistered = this.get('refresh_token_registered')
        const refreshTokenGuest = this.get('refresh_token_guest')
        const refreshToken = refreshTokenRegistered || refreshTokenGuest

        if (refreshToken) {
            try {
                const res = await helpers.refreshAccessToken(this.client, {refreshToken})
                this.handleTokenResponse(res, !!refreshTokenGuest)
                return this.data
            } catch {
                // If anything bad happens during refresh token flow
                // we continue with the PKCE guest user flow.
            }
        }

        const res = await helpers.loginGuestUser(this.client, {redirectURI: this.redirectURI})
        this.handleTokenResponse(res, true)

        return this.data
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
            expires: this.REFRESH_TOKEN_EXPIRATION_DAYS,
        })
    }

    /**
     * The ready function returns a promise indicating whether we have
     * a valid access token.
     *
     * We use this method to block those commerce api calls that
     * requires an access token.
     */
    async ready() {
        if (!this.pending) {
            this.pending = this.init()
        }
        return this.pending
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginGuestUser.
     *
     */
    async loginGuestUser() {
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const request = async () => {
            const res = await helpers.loginGuestUser(this.client, {
                redirectURI,
                ...(usid && {usid}),
            })
            this.handleTokenResponse(res, true)
            return this.data
        }
        this.pending = this.pending ? this.pending.then(request) : request()
        return this.pending
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
     *
     */
    async loginRegisteredUserB2C(credentials: Parameters<Helpers['loginRegisteredUserB2C']>[1]) {
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const request = async () => {
            const res = await helpers.loginRegisteredUserB2C(this.client, credentials, {
                redirectURI,
                ...(usid && {usid}),
            })
            this.handleTokenResponse(res, false)

            return this.data
        }
        this.pending = this.pending ? this.pending.then(request) : request()
        return this.pending
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: logout.
     *
     */
    async logout() {
        const request = async () => {
            const redirectURI = this.redirectURI
            await helpers.logout(this.client, {
                accessToken: this.get('access_token'),
                refreshToken: this.get('refresh_token_registered'),
            })
            const res = await helpers.loginGuestUser(this.client, {
                redirectURI,
            })
            this.handleTokenResponse(res, true)
            return this.data
        }
        this.pending = this.pending ? this.pending.then(request) : request()
        return this.pending
    }
}

export default Auth

type ArgWithHeaders =
    | {
          parameters?: any
          headers?: Record<string, string>
      }
    | undefined

/**
 * A ultility function to inject access token as Authorization header
 * into the commerce-sdk-isomorphic methods' first argument.
 *
 * @Internal
 */
export const injectAccessToken = <T extends ArgWithHeaders>(arg: T, accessToken: string) => {
    return {
        ...arg,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...arg?.headers,
        },
    }
}
