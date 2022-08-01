import {helpers, ShopperLogin} from 'commerce-sdk-isomorphic'
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

    async init() {
        return helpers.loginGuestUser(this.client, {redirectURI: this.redirectURI})
    }
}

export default Auth
