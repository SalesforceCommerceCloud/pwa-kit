import {ShopperLogin, helpers} from 'commerce-sdk-isomorphic'
import config from './commerce-api-config'

const shopperLogin = new ShopperLogin(config)

const getAccessToken = async () => {
    const {access_token} = await helpers.loginGuestUser(
        shopperLogin,
        {redirectURI: `http://localhost:3000/callback`} // Callback URL must be configured in SLAS Admin
    )
    return access_token
}

export {getAccessToken}
