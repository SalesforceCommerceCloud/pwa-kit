/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'

const path = require('path')
const {getRuntime} = require('pwa-kit-runtime/ssr/server/express')
const {isRemote} = require('pwa-kit-runtime/utils/ssr-server')
const {getConfig} = require('pwa-kit-runtime/utils/ssr-config')
const helmet = require('helmet')
const jose = require('jose')
const bodyParser = require('body-parser')
const sdk = require('commerce-sdk-isomorphic')

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // This is the value of the 'mobify' object from package.json
    mobify: getConfig(),

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development.
    protocol: 'http'
}

const runtime = getRuntime()

// TODO: We can't store secrets in MRT yet, for now we should store it in plain text
const SLAS_PUBLIC_CLIENT_ID = process.env.SLAS_PUBLIC_CLIENT_ID
const SLAS_PRIVATE_CLIENT_ID = process.env.SLAS_PRIVATE_CLIENT_ID
const SLAS_PRIVATE_CLIENT_SECRET = process.env.SLAS_PRIVATE_CLIENT_SECRET

const agent = process.env.NODE_EXTRA_CA_CERTS
    ? new HTTPSProxyAgent("http://localhost:3000")
    : undefined


// https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getJwksUri
const JWKS_SLAS = jose.createRemoteJWKSet(
    // TODO: The endpoint has the current JWT and the future JWT that we can potentially rotate.
    //  jose already validates the proper JWT.
    //  TODO: It looks like we are using jwtDecode in commerce-api
    //   https://github.com/SalesforceCommerceCloud/pwa-kit/blob/1b27d3e7bbe62fb9e57a3d0777b633a481e29cc2/packages/template-retail-react-app/app/commerce-api/utils.js#L23
    //   --> https://www.npmjs.com/package/jwt-decode
    //   IMPORTANT: This library doesn't validate the token, any well formed JWT can be decoded. You should validate the token in your server-side logic by using something like express-jwt, koa-jwt, Owin Bearer JWT, etc.
    new URL(
        "https://kv7kzm78.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/f_ecom_zzrf_001/oauth2/jwks"
    )
)

function parseSLASSubClaim(sub) {
    return sub.split("::").reduce((acc, part) => {
        const [key, val] = part.split(":")
        acc[key] = val
        return acc
    }, {})
}


// TODO: The goal is to create a library with this validation that we got right and we trust to validate JWT
//  customers can import this library and use it in their projects.
//  JWT requires to validate a payload and the signature
//  IMPORTANT: Measure the bundle size cost of adding the NPM library 'jose'.
//  The library only is used server-side not client-side and we don't want to the increase in bundle size
//  to be a big burden for shoppers when they download the bundle.
async function validateSLASJWT(jwt, expectedClientID) {
    let ret
    try {
        console.log('validateSLASJWT jwt:', jwt)
        console.log('validateSLASJWT JWKS_SLAS:', JWKS_SLAS)
        // TODO: Internally jose.jwtVerify also validates the times of creation
        ret = await jose.jwtVerify(jwt, JWKS_SLAS, {
            algorithms: ["ES256"],
            //TODO: ISS We want to do zzrf_001 dynamic as a parameter to switch between production and development instance
            issuer: "slas/prod/zzrf_001",
            // TODO: AUD Same, make zzrf_001 dynamic as a parameter
            audience: "commercecloud/prod/zzrf_001",
        })
        console.log('AFTER validateSLASJWT try ret:', ret)
    } catch (error) {
        return { error }
    }
    // TODO: Validating the JWT payload
    const { scid } = parseSLASSubClaim(ret.payload.sub)

    console.log('validateSLASJWT scid:', scid)
    console.log('validateSLASJWT expectedClientID:', expectedClientID)
    if (scid !== expectedClientID) {
        return { error: new Error("Invalid client ID") }
    }
    return ret
}

function handlerCallbackSLAS(req, res) {
    res.json({ ok: true })
}

// Given a JWT, use TSOB to get a "powerful" JWT with Shopper Context scopes. Use that to set Shopper Context.
// TODO: This endpoint should probably be called something like /protected-shopper-context
// TSOB === Trusted System On Behalf
async function handlerStorefrontPreview(req, res) {
    // TODO: Verify AM JWT BEFORE processing SLAS JWT. SLAS JWT validation can likely be middleware/decorator.
    const auth = req.get("authorization")
    if (!auth) {
        return res.status(403).json({ error: "Missing Authorization header" })
    }
    const bits = auth.split(" ")
    if (bits.length !== 2 || bits[0] !== "Bearer") {
        return res.status(403).json({ error: "Invalid Authorization header" })
    }

    req.get("authorization")

    console.log('ssr req.body:', req.body.access_token)
    console.log('ssr SLAS_PUBLIC_CLIENT_ID:', SLAS_PUBLIC_CLIENT_ID)

    // [1] Validate the Shopper JWT, and pull the USID from it.
    const { payload, error: slasValdiationError } = await validateSLASJWT(
        req.body.access_token,
        SLAS_PUBLIC_CLIENT_ID
    )

    console.log('slasValdiationError:',slasValdiationError)

    // TODO: Fix this
    if (slasValdiationError ) {
        return res.status(400).json({ slasValdiationError })
    }
    const { usid } = parseSLASSubClaim(payload.sub)

    // TODO: replace with import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
    const config = {
        parameters: {
            clientId: SLAS_PRIVATE_CLIENT_ID,
            organizationId: "f_ecom_zzrf_001",
            shortCode: "kv7kzm78",
            siteId: "RefArch",
        },
        throwOnBadResponse: true,
        fetchOptions: {
            agent,
        },
    }

    // TODO: Add locale and currency to config like we do in the api declaration in _app-config/index.jsx


    // [2] Use TSOB to get a token for that USID.
    const shopperLogin = new sdk.ShopperLogin(config)
    let tsobToken
    try {
        tsobToken = await shopperLogin.getTrustedSystemAccessToken({
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        `${SLAS_PRIVATE_CLIENT_ID}:${SLAS_PRIVATE_CLIENT_SECRET}`
                    ).toString("base64"),
            },
            body: {
                hint: "ts_ext_on_behalf_of",
                grant_type: "client_credentials",
                // TODO: It can be a registered shopper not always a guest shopper
                //  We know if it's a register user if the JWT contains an email
                //  Script to get a JWT https://git.soma.salesforce.com/cc-mobify/test-scapi/blob/main/slas-login.sh
                login_id: "guest",
                idp_origin: "ecom",
                channel_id: "RefArch",
                usid,
            },
        })
    } catch (err) {
        // Remember that we're not just using fetch here, we need to look at what the client is doing.
        const errorText = await err.response.json()
        console.log({ errorText })
        return res.status(500).json({ errorText })
    }

    console.log('tsobToken:', tsobToken)

    // [3] Set Shopper Context.
    // const body = {
    //     // effectiveDateTime: new Date().toISOString(),
    //     // effectiveDateTime: "2020-12-20T00:00:00Z"
    // }

    const body = {}
    if (req.body.effectiveDateTime) {
        body.effectiveDateTime = req.body.effectiveDateTime
    }

    // if (req.body.customerQualifers) {
    //     body.customerQualifiers = req.body.customerQualifers
    // }
    body.customQualifiers = {
        testQualifer: "seasame"
    }

    // TODO: Verify the 'sourceCode' works as expected
    //  https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-context?meta=getShopperContext#:~:text=817c%2D73d6b86872d9-,Responses,-200
    body.sourceCode = "testsourcecode"

    console.log({ body })

    const shopperContexts = new sdk.ShopperContexts(config)
    try {
        await shopperContexts.createShopperContext({
            headers: {
                Authorization: `Bearer ${tsobToken.access_token}`,
            },
            parameters: {
                usid,
            },
            body,
            agent,
        })
    } catch (err) {
        const errorText = await err.response.json()
        console.log({ errorText })
        return res.status(500).json({ errorText })
    }

    res.json({
        usid,
        tsobUSID: tsobToken.usid,
        equal: usid == tsobToken.usid,
    })
}

const {handler} = runtime.createHandler(options, (app) => {
    // Set HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'img-src': ["'self'", '*.commercecloud.salesforce.com', 'data:'],
                    'script-src': ["'self'", "'unsafe-eval'", 'storage.googleapis.com'],
                    'connect-src': ["'self'", 'api.cquotient.com'],

                    // Do not upgrade insecure requests for local development
                    'upgrade-insecure-requests': isRemote() ? [] : null
                }
            },
            hsts: isRemote()
        })
    )

    // Parse request body as JSON
    // TODO: Using Express v4 we should be able to use the built-in middleware app.use(express.json()) instead of the
    //  body-parser package.
    //  https://stackoverflow.com/a/49943829
    app.use(bodyParser.json())

    // Handle the redirect from SLAS as to avoid error
    app.get('/callback?*', (req, res) => {
        res.send()
    })
    app.get('/robots.txt', runtime.serveStaticFile('static/robots.txt'))
    app.get('/favicon.ico', runtime.serveStaticFile('static/ico/favicon.ico'))

    app.get('/worker.js(.map)?', runtime.serveServiceWorker)

    // Shopper Context handler
    app.get("/slas-callback", handlerCallbackSLAS)
    app.post("/preview", handlerStorefrontPreview)

    app.get('*', runtime.render)
})
// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
exports.get = handler
