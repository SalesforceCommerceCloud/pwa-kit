import awsServerlessExpress from 'aws-serverless-express'
import express from 'express'

// Works locally ...
import capi from 'commerce-sdk-isomorphic'
const {ShopperLogin, ShopperProducts} = capi

// Works with Webpack ...
// import {ShopperLogin, ShopperProducts} from 'commerce-sdk-isomorphic'

import {createHash} from 'crypto'
import http from 'http'
import https from 'https'

const PORT = process.env.PORT || 3000
const IS_LOCAL = process.env['AWS_LAMBDA_FUNCTION_NAME'] === undefined

const SHORT_CODE = 'kv7kzm78'
const ORG_ID = 'f_ecom_zzrf_001'
const SITE_ID = 'RefArchGlobal'
const CLIENT_ID = 'c9c45bfd-0ed3-4aa2-9971-40f88962b836'

function generateRandomString(length) {
    let randomString = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        randomString += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return randomString
}

function generateCodeChallenge(codeVerifier) {
    return createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

const createCodeVerifier = () => generateRandomString(128)

const HTTP_AGENT = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000 * 60
})
const HTTPS_AGENT = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000 * 60
})

function getAgent(url) {
    if (url.protocol == 'http:') {
        return HTTP_AGENT
    }
    return HTTPS_AGENT
}

async function getCategories() {
    let clientConfig = {
        parameters: {
            shortCode: SHORT_CODE,
            organizationId: ORG_ID,
            siteId: SITE_ID
        },
        fetchOptions: {
            redirect: 'manual'
            // agent: getAgent
        }
    }

    const code_verifier = createCodeVerifier()
    const code_challenge = generateCodeChallenge(code_verifier)
    const redirect_uri = `https://example.mobify-storefront.com/callback`
    const client_id = CLIENT_ID

    // 1) Get a SLAS `code`
    const authorizeCustomerOptions = {
        headers: {
            'Content-Type': `application/x-www-form-urlencoded`
        },
        parameters: {
            client_id: CLIENT_ID,
            code_challenge,
            hint: 'guest',
            redirect_uri,
            response_type: 'code'
        }
    }
    const shopperLoginClient = new ShopperLogin(clientConfig)
    const authorizeCustomerResponse = await shopperLoginClient.authorizeCustomer(
        authorizeCustomerOptions,
        true
    )

    // 2) Exchange the code for `access_token`
    const {usid, code} = Object.fromEntries(
        new URL(authorizeCustomerResponse.headers.get('location')).searchParams
    )
    const getAccessTokenOptions = {
        headers: {
            'Content-Type': `application/x-www-form-urlencoded`
        },
        body: new URLSearchParams({
            client_id,
            code_verifier,
            code,
            grant_type: 'authorization_code_pkce',
            redirect_uri,
            usid
        })
    }
    const getAccessTokenResponse = await shopperLoginClient.getAccessToken(getAccessTokenOptions)
    const {access_token} = getAccessTokenResponse

    clientConfig.headers = {
        Authorization: `Bearer ${access_token}`
    }

    // 3) Request the categories
    const shopperProductsClient = new ShopperProducts(clientConfig)
    const getCategoriesResponse = await shopperProductsClient.getCategories({
        parameters: {
            ids: ['root']
        }
    })

    return getCategoriesResponse.data[0].categories
}

const app = express()
app.all('*', async (_, res) => {
    res.json(await getCategories())
})
app.set('json spaces', 4)

if (IS_LOCAL) {
    app.listen(PORT, () => console.log(`Running Express server @ http://127.0.0.1:${PORT}`))
}

const server = awsServerlessExpress.createServer(app)
export const get = (event, context) => {
    awsServerlessExpress.proxy(server, event, context)
}
