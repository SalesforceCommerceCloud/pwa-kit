import {helpers, ShopperLogin, ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import jwtDecode from 'jwt-decode'
import {ApiClientConfigParams} from '../hooks/types'
import {BaseStorage, LocalStorage, CookieStorage} from './storage'

type Helpers = typeof helpers
interface AuthConfig {
    shortCode: string
    organizationId: string
    clientId: string
    siteId: string
    redirectURI: string
    proxy: string
}

interface JWTHeaders {
    aud: string
    aut: string
    ctx: string
    exp: number
    iat: number
    isb: string
    iss: string
    ist: number
    jti: string
    nbf: number
    scp: string
    sty: string
    sub: string
}

export interface AuthData {
    accessToken: string
    usid: string
    // customer_id: string
    // enc_user_id: string
    // expires_in: number
    // id_token: string
    // idp_access_token: null | string
    // refresh_token: string
    // token_type: string
}

type AuthDataProperties = 'accessToken' | 'refreshTokenGuest' | 'refreshTokenRegistered' | 'usid'
type AuthDataMap = Record<
    AuthDataProperties,
    {
        storage: BaseStorage
        key: string
        callback?: () => void
    }
>

/**
 *
 * @Internal
 */
class Auth {
    private client: ShopperLogin<ApiClientConfigParams>
    private redirectURI: string
    private _onClient = typeof window !== 'undefined'
    private pending: Promise<AuthData> | undefined
    private localStorage: LocalStorage
    private cookieStorage: CookieStorage
    private REFRESH_TOKEN_EXPIRATION_DAYS = 90

    static COOKIE = 'COOKIE'
    static LOCAL_STORAGE = 'LOCAL_STORAGE'

    constructor(config: AuthConfig) {
        this.client = new ShopperLogin({
            proxy: config.proxy,
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId,
            },
        })

        this.redirectURI = config.redirectURI
        this.localStorage = this._onClient ? new LocalStorage() : new Map()
        this.cookieStorage = this._onClient ? new CookieStorage() : new Map()
    }

    private get(name: AuthDataProperties) {
        const storage = this.DATA_MAP[name].storage
        const key = this.DATA_MAP[name].key
        return storage.get(key)
    }

    private set(name: AuthDataProperties, value: string, options?: any) {
        const key = this.DATA_MAP[name].key as AuthDataProperties
        const storage = this.DATA_MAP[name].storage
        storage.set(key, value, options)

        if (this.DATA_MAP[name].callback) {
            this.DATA_MAP[name].callback?.()
        }
    }

    /**
     * A map of the data that this auth module stores. This maps the name of the property to
     * the storage and the key when stored in that storage. You can also pass in a "callback"
     * function to do extra operation after a property is set.
     *
     * @Internal
     */
    private get DATA_MAP(): AuthDataMap {
        return {
            accessToken: {
                storage: this.localStorage,
                key: 'cc-ax',
            },
            usid: {
                storage: this.localStorage,
                key: 'usid',
            },
            refreshTokenGuest: {
                storage: this.cookieStorage,
                key: 'cc-nx-g',
                callback: () => {
                    this.cookieStorage.delete('cc-nx')
                },
            },
            refreshTokenRegistered: {
                storage: this.cookieStorage,
                key: 'cc-nx',
                callback: () => {
                    this.cookieStorage.delete('cc-nx-g')
                },
            },
        }
    }

    private get data(): AuthData {
        return {
            accessToken: this.get('accessToken'),
            usid: this.get('usid'),
        }
    }

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
     * @internal
     */
    private async init() {
        console.log('init')

        if (!this.isTokenExpired(this.get('accessToken'))) {
            console.log('Re-using access token from previous session.')
            return this.data
        }

        const refreshToken = this.get('refreshTokenRegistered') || this.get('refreshTokenGuest')

        if (refreshToken) {
            console.log('Using refresh token to get new access token.')
            // TODO: error handling
            const res = await helpers.refreshAccessToken(this.client, {refreshToken})
            this.handleTokenResponse(res, true)
            return this.data
        }

        // TODO: error handling
        const res = await helpers.loginGuestUser(this.client, {redirectURI: this.redirectURI})
        this.handleTokenResponse(res, true)

        return this.data
    }

    private handleTokenResponse(res: ShopperLoginTypes.TokenResponse, isGuest: boolean) {
        const refreshTokenKey = isGuest ? 'refreshTokenGuest' : 'refreshTokenRegistered'
        this.set('accessToken', `Bearer ${res.access_token}`)
        this.set(refreshTokenKey, res.refresh_token, {
            expires: this.REFRESH_TOKEN_EXPIRATION_DAYS,
        })
    }

    /**
     * The ready function returns a promise, signaling whether or not
     * the access token is avaliable. If access token is not avaliable
     * this method will try to re-initialize.
     *
     * We use this method to block those commerce api calls that
     * requires an access token.
     */
    ready() {
        console.log('ready')
        if (!this.pending) {
            console.log('no ready promise, initializing')
            this.pending = this.init()
        }
        return this.pending
    }

    async loginRegisteredUserB2C(credentials: Parameters<Helpers['loginRegisteredUserB2C']>[1]) {
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const request = async () => {
            const res = await helpers.loginRegisteredUserB2C(this.client, credentials, {
                redirectURI,
                ...(usid && {usid}),
            })
            await this.handleTokenResponse(res, true)
            return this.data
        }
        this.pending = request()
        return this.pending
    }

    async logout() {
        const request = async () => {
            const res = await helpers.logout(this.client, {
                refreshToken: this.get('refreshTokenRegistered'),
            })
            await this.handleTokenResponse(res, true)
            return this.data
        }
        this.pending = request()
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
export const withAccessToken = <T extends ArgWithHeaders>(arg: T, accessToken: string) => {
    return {
        ...arg,
        headers: {
            Authorization: accessToken,
            ...arg?.headers,
        },
    }
}
