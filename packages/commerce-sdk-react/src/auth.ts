import {helpers, ShopperLogin, ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {ApiClientConfigParams} from './hooks/types'

interface AuthConfig {
    shortCode: string
    organizationId: string
    clientId: string
    siteId: string
    redirectURI: string
    proxy: string
}

class Auth {
    client: ShopperLogin<ApiClientConfigParams>
    redirectURI: string

    accessToken: string = ''
    pending: Promise<ShopperLoginTypes.TokenResponse> | undefined

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
        const res = await helpers.loginGuestUser(this.client, {redirectURI: this.redirectURI})
        this.accessToken = res.access_token
        return res
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
            Authorization: `Bearer ${accessToken}`,
            ...arg?.headers,
        },
    }
}
