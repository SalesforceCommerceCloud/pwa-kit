import {helpers, ShopperLogin, ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import jwtDecode from 'jwt-decode'
import {ApiClientConfigParams} from '../hooks/types'
import {BaseStorage, LocalStorage, CookieStorage} from './storage'

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
    // customer_id: string
    // enc_user_id: string
    // expires_in: number
    // id_token: string
    // idp_access_token: null | string
    // refresh_token: string
    // token_type: string
    // usid: string
}

class Auth {
    client: ShopperLogin<ApiClientConfigParams>
    redirectURI: string

    KEYS = {
        ACCESS_TOKEN: 'cc-ax',
        REFRESH_TOKEN_GUEST: 'cc-nx-g',
        REFRESH_TOKEN_REGISTERED: 'cc-nx',
    }

    private _onClient = typeof window !== 'undefined'
    private pending: Promise<AuthData> | undefined
    private storage: BaseStorage

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
        this.storage = this._onClient ? new LocalStorage() : new Map()
    }

    get accessToken(): string {
        return this.storage.get(this.KEYS.ACCESS_TOKEN)
    }

    set accessToken(value: string) {
        this.storage.set(this.KEYS.ACCESS_TOKEN, `Bearer ${value}`)
    }

    get data(): AuthData {
        return {
            accessToken: this.accessToken,
        }
    }

    isTokenExpired(token: string) {
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
     * 1. If has valid access token - use it
     * 2. If has valid refresh token - refresh token flow
     * 3. PKCE flow
     *
     * Only call this from the "ready" function, so "ready" can manage the pending state.
     *
     * @internal
     */
    async init() {
        console.log('init')

        if (!this.isTokenExpired(this.accessToken)) {
            console.log('Re-using access token from previous session.')
            return this.data
        }

        const res = await helpers.loginGuestUser(this.client, {redirectURI: this.redirectURI})
        this.handleTokenResponse(res)

        return this.data
    }

    handleTokenResponse(res: ShopperLoginTypes.TokenResponse) {
        this.accessToken = res.access_token
    }

    /**
     * The ready function returns a promise, signaling whether or not
     * the access token is avaliable. If access token is not avaliable
     * this method will try to re-initialize.
     *
     * We use this method to block those commerce api calls that
     * requires an access token.
     *
     * @internal
     */
    ready() {
        console.log('ready')
        if (!this.pending) {
            console.log('no ready promise, initializing')
            this.pending = this.init()
        }
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
