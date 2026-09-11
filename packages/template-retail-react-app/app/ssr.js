/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * Developer note! When updating this file, make sure to also update the
 * ssr.js template files in pwa-kit-create-app.
 *
 * In the pwa-kit-create-app, the templates are found under:
 * - assets/bootstrap/js/overrides/app/ssr.js.hbs
 * - assets/templates/@salesforce/retail-react-app/app/ssr.js.hbs
 */

'use strict'

import express from 'express'
import helmet from 'helmet'
import {
    createLocalJWKSet,
    createRemoteJWKSet as joseCreateRemoteJWKSet,
    jwtVerify,
    decodeJwt
} from 'jose'
import path from 'path'
import {getRuntime} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {defaultPwaKitSecurityHeaders} from '@salesforce/pwa-kit-runtime/utils/middleware'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import logger from '@salesforce/pwa-kit-runtime/utils/logger-instance'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {registerTokenBridgeRoute} from './components/shopper-agent/token-bridge.js'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {getCommerceClientOverridesCspSources} from './utils/commerce-client-overrides.js'
import {ShopperLogin, ShopperOrders, helpers} from 'commerce-sdk-isomorphic'

const config = getConfig()

// Guest order access helpers
function getSiteIdFromRequest(req) {
    return req.headers['x-site-id'] || null
}

// Route server-side SCAPI calls through the MRT proxy so they work in Lambda.
// MRT Lambdas have no direct outbound internet; all external API traffic must
// go via /mobify/proxy/api (same path the client SDK uses).
function makeShopperOrders(apiParams, authorization) {
    const {clientId, organizationId, shortCode, siteId} = apiParams
    const proxy = `${getAppOrigin()}${
        getConfig()?.app?.commerceAPI?.proxyPath || '/mobify/proxy/api'
    }`
    return new ShopperOrders({
        parameters: {clientId, organizationId, shortCode, siteId},
        headers: {authorization},
        proxy,
        throwOnBadResponse: true
    })
}

export function parseGuestOrderCookie(req, cookieName) {
    try {
        const raw = req.headers?.cookie
            ?.split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith(cookieName + '='))
        if (!raw) return {}
        return JSON.parse(decodeURIComponent(raw.slice(cookieName.length + 1)))
    } catch {
        return {}
    }
}

export function evictIfNeeded(cookieMap) {
    // FIFO eviction if raw JSON would exceed ~2500 bytes (leaves headroom for URL-encoding expansion)
    let entries = Object.entries(cookieMap)
    while (JSON.stringify(Object.fromEntries(entries)).length > 2500 && entries.length > 1) {
        entries.shift()
    }
    return Object.fromEntries(entries)
}

const GUEST_ORDER_SUPPRESSED_FIELDS = new Set([
    'paymentCard',
    'expirationMonth',
    'expirationYear',
    'phone',
    'globalPartyId',
    'orderToken',
    'orderViewCode'
])

export function filterGuestOrderFields(order) {
    if (!order || typeof order !== 'object') return order
    const filtered = {}
    for (const [key, val] of Object.entries(order)) {
        if (key.startsWith('c_')) continue // suppress all custom attributes
        if (GUEST_ORDER_SUPPRESSED_FIELDS.has(key)) continue
        if (key === 'customerInfo') {
            // Keep only email echo; suppress phone, globalPartyId
            const {email, customerEmail} = val || {}
            filtered.customerInfo = {email: email || customerEmail}
            continue
        }
        if (key === 'paymentInstruments') {
            // Keep card type, last digits, masked number, method id — matches sf-next allowedFields
            filtered.paymentInstruments = (val || []).map((pi) => ({
                paymentInstrumentId: pi.paymentInstrumentId,
                paymentMethodId: pi.paymentMethodId,
                cardType: pi.cardType,
                numberLastDigits: pi.numberLastDigits,
                maskedNumber: pi.maskedNumber
            }))
            continue
        }
        if (key === 'shipments') {
            // Full shippingAddress matches sf-next allowedFields; tracking fields are additive
            filtered.shipments = (val || []).map((s) => ({
                shipmentId: s.shipmentId,
                shippingStatus: s.shippingStatus,
                trackingNumber: s.trackingNumber,
                trackingUrl: s.trackingUrl,
                expectedDeliveryDate: s.expectedDeliveryDate,
                shippingMethod: s.shippingMethod,
                shippingAddress: s.shippingAddress
                    ? {
                          firstName: s.shippingAddress.firstName,
                          lastName: s.shippingAddress.lastName,
                          address1: s.shippingAddress.address1,
                          address2: s.shippingAddress.address2,
                          city: s.shippingAddress.city,
                          stateCode: s.shippingAddress.stateCode,
                          countryCode: s.shippingAddress.countryCode,
                          postalCode: s.shippingAddress.postalCode
                      }
                    : undefined
            }))
            continue
        }
        filtered[key] = val
    }
    // Strip c_* custom attributes from individual productItems (server-side security)
    if (filtered.productItems) {
        filtered.productItems = filtered.productItems.map((item) => {
            const filteredItem = {...item}
            Object.keys(filteredItem).forEach((key) => {
                if (key.startsWith('c_')) delete filteredItem[key]
            })
            return filteredItem
        })
    }
    return filtered
}

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The contents of the config file for the current environment
    mobify: config,

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Set DEV_SERVER_PROTOCOL to 'https' for HTTPS; defaults to 'http' when unset.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: process.env.DEV_SERVER_PROTOCOL || 'http',

    // Optional. Path to SSL certificate (.pem) for HTTPS development. Typically a
    // self-signed cert for localhost; set DEV_SERVER_SSL_FILE_PATH when using https.
    sslFilePath: process.env.DEV_SERVER_SSL_FILE_PATH,

    // Option for whether to set up a special endpoint for handling
    // private SLAS clients
    // Set this to false if using a SLAS public client
    // When setting this to true, make sure to also set the PWA_KIT_SLAS_CLIENT_SECRET
    // environment variable as this endpoint will return HTTP 501 if it is not set
    useSLASPrivateClient: true,

    // To extend the SLAS private-client proxy allow-list, supply
    // `slasPrivateClientAllowList`. See the built-in list in pwa-kit-runtime
    // for the entry shape. A startup warning is logged whenever a custom list
    // is in use.

    // If this is enabled, any HTTP header that has a non ASCII value will be URI encoded
    // If there any HTTP headers that have been encoded, an additional header will be
    // passed, `x-encoded-headers`, containing a comma separated list
    // of the keys of headers that have been encoded
    // There may be a slight performance loss with requests/responses with large number
    // of headers as we loop through all the headers to verify ASCII vs non ASCII
    encodeNonAsciiHttpHeaders: true,

    // Cookie handling configuration for security and session management.
    //
    // SECURITY CONSIDERATIONS:
    // - Set to 'false' in production for enhanced security (prevents XSS attacks via client-side cookie access)
    // - Set to 'true' only in development when testing SFCC session integration or Hybrid Proxy functionality
    // - When false: cookies are stripped from requests and cannot be set in responses (server-only cookies)
    // - When true: allows client-side JavaScript access to cookies (development/testing only)
    //
    // HYBRID PROXY REQUIREMENT:
    // - Hybrid Proxy requires this to be 'true' for SFCC session management to work properly
    // - Only enable Hybrid Proxy in development environments, never in production
    localAllowCookies: true,

    // Hybrid Proxy configuration for local development and MRT to ODS connection testing.
    //
    // IMPORTANT SECURITY NOTES:
    // - This should ONLY be used for local development and testing
    // - NEVER enable in production - use eCDN rules instead for production routing
    // - When enabled, localAllowCookies must be set to 'true' for SFCC sessions to work
    // - Production deployments should use eCDN to direct requests to SFCC instances
    //
    // REFERENCE: https://developer.salesforce.com/docs/commerce/commerce-api/guide/hybrid-authentication.html
    hybridProxy: {
        // If this is enabled, the Hybrid Proxy will be enabled to proxy requests to the SFCC instance.
        // IMPORTANT: This should only be used for local development. For production, this should be disabled and use eCDN to direct requests to the SFCC instance.
        // Refer to https://developer.salesforce.com/docs/commerce/commerce-api/guide/hybrid-authentication.html for more details.
        enabled: false,

        // The origin of the SFCC instance (i.e. the instance that is being proxied to which hosts the storefront).
        sfccOrigin: 'https://zzrf-001.dx.commercecloud.salesforce.com',

        // The MRT rules to apply to the hybrid proxy.
        // These rules determine which requests are handled by PWA Kit (MRT) vs proxied to SFCC. The same rules should be used in the eCDN rules for the same requests.
        // Paths excluded from the rules will be re-directed to SFCC instance. In the following example, the Cart and checkout pages are excluded from the rules.
        // Refer to the following links for more details:
        // * https://developer.salesforce.com/docs/commerce/commerce-api/references/cdn-api-process-apis?meta=MrtRules
        // * https://developer.salesforce.com/docs/commerce/commerce-api/guide/ecdn-rules-for-phased-headless-rollout.html
        routingRules: [
            'http.request.uri.path eq "/" or http.request.uri.path matches "^/callback" or http.request.uri.path matches "^/mobify" or http.request.uri.path matches "^/worker.js" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/$" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/login" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/reset-password" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/registration" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/account" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/account/orders" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/account/orders/(\\\\w+)" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/account/wishlist" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/product/(\\\\w+)" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/search" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/category/(\\\\w+)" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/order-status" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/page/(\\\\w+)" or http.request.uri.path matches "^/(\\\\w+)/([-\\\\w]+)/page-viewer/(\\\\w+)"'
        ]
    }
}

const runtime = getRuntime()

// Module-level guest token cache for pwakit-notify SCAPI calls.
// Warm Lambda reuse avoids a SLAS round-trip on every callback invocation.
let _notifyToken = null
let _notifyTokenExpiry = 0

async function getNotifyToken(apiParams) {
    if (_notifyToken && Date.now() < _notifyTokenExpiry) {
        return _notifyToken
    }
    const {clientId, organizationId, shortCode, siteId} = apiParams
    const proxy = `${getAppOrigin()}${
        getConfig()?.app?.commerceAPI?.proxyPath || '/mobify/proxy/api'
    }`
    const slasClient = new ShopperLogin({
        parameters: {clientId, organizationId, shortCode, siteId},
        proxy,
        throwOnBadResponse: true
    })
    const tokenResponse = await helpers.loginGuestUserPrivate({
        slasClient,
        parameters: {},
        credentials: {clientSecret: process.env.PWA_KIT_SLAS_CLIENT_SECRET}
    })
    _notifyToken = tokenResponse.access_token
    // Cache for 25 minutes — SLAS guest tokens last 30 min, 5 min buffer
    _notifyTokenExpiry = Date.now() + 25 * 60 * 1000
    return _notifyToken
}

async function sendViaB2cCartridge(type, recipient, data, apiParams) {
    const {organizationId, siteId} = apiParams
    const token = await getNotifyToken(apiParams)
    const proxy = `${getAppOrigin()}${
        getConfig()?.app?.commerceAPI?.proxyPath || '/mobify/proxy/api'
    }`
    const url = `${proxy}/custom/pwakit-notify/v1/organizations/${encodeURIComponent(
        organizationId
    )}/notify?siteId=${encodeURIComponent(siteId)}`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({type, recipient, data, host: new URL(getAppOrigin()).hostname})
    })
    if (!res.ok) {
        if (res.status === 401) {
            // Clear cached token so next call gets a fresh one
            _notifyToken = null
            _notifyTokenExpiry = 0
        }
        let body = ''
        try {
            body = await res.text()
        } catch (_) {} // eslint-disable-line no-empty
        logger.error(`pwakit-notify ${res.status} body: ${body} url: ${url}`)
        throw new Error(`pwakit-notify returned ${res.status}`)
    }
    return await res.json()
}

const resetPasswordCallback =
    config.app.login?.resetPassword?.callbackURI || '/reset-password-callback'
const passwordlessLoginCallback =
    config.app.login?.passwordless?.callbackURI || '/passwordless-login-callback'

async function sendMagicLinkEmail(req, res, landingPath, notifyType, redirectUrl) {
    const {email_id, token} = req.body

    let magicLinkPath = `${landingPath}?token=${encodeURIComponent(token)}`
    if (notifyType === 'passwordless-magic-link' && redirectUrl) {
        magicLinkPath += `&redirect_url=${encodeURIComponent(redirectUrl)}`
    }

    const appConfig = getConfig()?.app
    await sendViaB2cCartridge(
        notifyType,
        email_id,
        {magicLinkPath},
        appConfig.commerceAPI.parameters
    )
    res.json({success: true})
}

const CLAIM = {
    ISSUER: 'iss'
}

const DELIMITER = {
    ISSUER: '/'
}

const throwSlasTokenValidationError = (message, code) => {
    throw new Error(`SLAS Token Validation Error: ${message}`, code)
}

export const createRemoteJWKSet = (tenantId) => {
    const appOrigin = getAppOrigin()
    const {app: appConfig} = getConfig()
    const shortCode = appConfig.commerceAPI?.parameters?.shortCode
    const configTenantId = appConfig.commerceAPI?.parameters?.organizationId?.replace(
        /^f_ecom_/,
        ''
    )
    if (!shortCode || !configTenantId) {
        throw new Error(
            'Cannot find `commerceAPI.parameters.(shortCode|organizationId)` in your config file. Please check the config file.'
        )
    }
    if (tenantId !== configTenantId) {
        throw new Error(
            `The tenant ID in your PWA Kit configuration ("${configTenantId}") does not match the tenant ID in the SLAS callback token ("${tenantId}").`
        )
    }
    const JWKS_URI = `${appOrigin}/${shortCode}/${tenantId}/oauth2/jwks`
    return joseCreateRemoteJWKSet(new URL(JWKS_URI))
}

export const validateSlasCallbackToken = async (token) => {
    const payload = decodeJwt(token)
    const subClaim = payload[CLAIM.ISSUER]
    const tokens = subClaim.split(DELIMITER.ISSUER)
    const tenantId = tokens[2]
    try {
        let jwks
        if (process.env.SLAS_JWKS_JSON) {
            const parsed = JSON.parse(process.env.SLAS_JWKS_JSON)
            if (!Array.isArray(parsed?.keys) || parsed.keys.length === 0) {
                throwSlasTokenValidationError(
                    'SLAS_JWKS_JSON must be a JSON object with a non-empty "keys" array',
                    400
                )
            }
            jwks = createLocalJWKSet(parsed)
        } else {
            jwks = createRemoteJWKSet(tenantId)
        }
        const {payload: validatedPayload} = await jwtVerify(token, jwks, {
            algorithms: ['RS256', 'ES256']
        })
        return validatedPayload
    } catch (error) {
        throwSlasTokenValidationError(error.message, 401)
    }
}

const tenantIdRegExp = /^[a-zA-Z]{4}_([0-9]{3}|s[0-9]{2}|stg|dev|prd)$/
const shortCodeRegExp = /^[a-zA-Z0-9-]+$/

/**
 *  Handles JWKS (JSON Web Key Set) caching the JWKS response for 2 weeks.
 *
 * @param {object} req Express request object.
 * @param {object} res Express response object.
 * @param {object} options Options for fetching B2C Commerce API JWKS.
 * @param {string} options.shortCode - The Short Code assigned to the realm.
 * @param {string} options.tenantId - The Tenant ID for the ECOM instance.
 * @returns {Promise<*>} Promise with the JWKS data.
 */
export async function jwksCaching(req, res, options) {
    const {shortCode, tenantId} = options

    const isValidRequest = tenantIdRegExp.test(tenantId) && shortCodeRegExp.test(shortCode)
    if (!isValidRequest)
        return res
            .status(400)
            .json({error: 'Bad request parameters: Tenant ID or short code is invalid.'})
    try {
        const JWKS_URI = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/f_ecom_${tenantId}/oauth2/jwks`
        const response = await fetch(JWKS_URI)

        if (!response.ok) {
            throw new Error('Request failed with status: ' + response.status)
        }

        // JWKS rotate every 30 days. For now, cache response for 14 days so that
        // fetches only need to happen twice a month
        res.set('Cache-Control', 'public, max-age=1209600, stale-while-revalidate=86400')

        return res.json(await response.json())
    } catch (error) {
        res.status(400).json({error: `Error while fetching data: ${error.message}`})
    }
}

// ─── S15: In-process throttle middleware for /api/order-lookup/verify ────────
// Keyed on the first IP from X-Forwarded-For (or req.ip). Uses a Map with
// {count, resetAt} per key. No external library — zero new dependencies.
// Reads windowMs/max from app.guestOrderLookup.requestCodeThrottle at request
// time so config hot-reload works without restarting the server.
export function createVerifyThrottle() {
    /** @type {Map<string, {count: number, resetAt: number}>} */
    const store = new Map()

    return function verifyThrottleMiddleware(req, res, next) {
        const appConfig = getConfig()?.app
        // No-op when feature is disabled
        if (!appConfig?.guestOrderLookup?.enabled) return next()
        // Only throttle the verify (access code submission) endpoint
        if (req.path !== '/api/order-lookup/verify') return next()

        const throttleConfig = appConfig?.guestOrderLookup?.requestCodeThrottle
        const windowMs = throttleConfig?.windowMs ?? 60000
        const max = throttleConfig?.max ?? 5

        // Throttle keyed on x-forwarded-for. In MRT deployments this header is set
        // by the trusted CDN edge. In non-MRT environments (local dev, custom hosting)
        // it may be spoofable — SCAPI rate limiting is the authoritative backstop.
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown'
        const now = Date.now()
        const entry = store.get(ip)

        if (!entry || now >= entry.resetAt) {
            store.set(ip, {count: 1, resetAt: now + windowMs})
            return next()
        }

        entry.count += 1
        if (entry.count > max) {
            return res.status(429).json({error: 'Too many requests'})
        }
        return next()
    }
}

// Guest order lookup: warn if feature is enabled but cookies are not allowed
const _golConfig = getConfig()?.app?.guestOrderLookup
if (_golConfig?.enabled && !options.localAllowCookies && !process.env.MRT_ALLOW_COOKIES) {
    logger.warn(
        'guestOrderLookup.enabled is true but neither localAllowCookies nor MRT_ALLOW_COOKIES is set. The cc-goa_* HttpOnly cookie will not be written. Set localAllowCookies: true for local dev or MRT_ALLOW_COOKIES=true for MRT.',
        {namespace: 'guest-order-lookup'}
    )
}

/**
 * Handle the SLAS `/callback` redirect.
 *
 * The Trusted Agent (Order on Behalf) popup redirects here with both a `code` and
 * a `state`. That flow needs the React app to mount so the callback page can hand
 * the result back to the opener, so let it fall through to the renderer via
 * `next()`. This URL carries OAuth material, so that variant must never be cached.
 *
 * For every other request (including the standard SLAS login redirect, which does
 * not navigate the top window here and carries no `state`) this endpoint does
 * nothing and is safe to cache for a long time.
 */
export function handleCallback(req, res, next) {
    if (req.query.code && req.query.state) {
        res.set('Cache-Control', 'no-store')
        return next()
    }

    res.set('Cache-Control', `max-age=31536000`)
    res.send()
}

// Always require Secure on the cc-goa_* cookie regardless of cookie-forwarding config.
// For local dev, set localAllowCookies: true AND use HTTPS (pwa-kit-dev --https) so
// the browser accepts the Secure cookie; plain-HTTP local runs cannot complete the flow.
const cookieSecureFlag = ' Secure;'

const {handler} = runtime.createHandler(options, (app) => {
    app.use(express.json()) // To parse JSON payloads
    app.use(express.urlencoded({extended: true}))
    // Set default HTTP security headers required by PWA Kit
    app.use(defaultPwaKitSecurityHeaders)
    // Set custom HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'img-src': [
                        // Default source for product images - replace with your CDN
                        '*.commercecloud.salesforce.com',
                        '*.demandware.net',
                        '*.adyen.com',
                        'pay.google.com', // Google Pay payment handler icon
                        'www.gstatic.com', // optional, if icon is on gstatic
                        // Commerce Client messaging widget images
                        'cimulate.ai',
                        '*.cimulate.ai'
                    ],
                    'script-src': [
                        // Commerce Client messaging widget bundle (messaging.umd.js)
                        '*.cimulate.ai',
                        // Commerce Client bundle served from the SFCC static CDN
                        '*.sfcc-store-internal.net',
                        // Origin of the merchant-hosted Commerce Client component-override
                        // script, added only when cc_overridesUrl holds a valid HTTPS URL.
                        // Serving that script from a different host than the configured one
                        // requires adding the host here.
                        ...getCommerceClientOverridesCspSources(config.app.commerceAgent),
                        // Used by the service worker in /worker/main.js
                        'storage.googleapis.com',
                        // Payment gateways
                        '*.stripe.com',
                        '*.paypal.com',
                        '*.adyen.com',
                        'pay.google.com',
                        'www.gstatic.com',
                        '*.demandware.net', // Used to load a valid payment scripts in test environment
                        'maps.googleapis.com',
                        'places.googleapis.com'
                    ],
                    'connect-src': [
                        // Connect to Einstein APIs
                        'api.cquotient.com',
                        // Connect to Commerce Client widget APIs
                        '*.cimulate.ai',
                        // Connect to DataCloud APIs
                        '*.c360a.salesforce.com',
                        'maps.googleapis.com',
                        'places.googleapis.com',
                        // Connect to SCRT2 URLs
                        '*.salesforce-scrt.com',
                        // Payment gateways
                        // Note: Google Pay requires different CSP entries depending on the integration and environment.
                        // - 'pay.google.com' and 'payments.google.com' are generally needed for the SDK to load and create payment tokens.
                        // - 'google.com/pay/' and 'www.google.com/pay/' may be required for certain flows (especially with Adyen) or in some browsers
                        //   where the interactive payment sheet makes server calls directly to google.com/pay.
                        // - You may need to adjust these URLs based on your environments.
                        '*.demandware.net', // Used to load a valid payment scripts in test environment
                        '*.adyen.com',
                        '*.paypal.com',
                        'pay.google.com',
                        'payments.google.com',
                        'google.com/pay',
                        'google.com/pay/',
                        'www.google.com/pay',
                        'www.google.com/pay/',
                        // Connect to SFCC/ODS instances
                        '*.demandware.net'
                    ],
                    'frame-src': [
                        // Allow frames from Salesforce site.com (Needed for MIAW)
                        '*.site.com',
                        // Payment gateways
                        '*.stripe.com',
                        '*.paypal.com',
                        '*.adyen.com',
                        'payments.google.com',
                        'pay.google.com'
                    ],
                    'frame-ancestors': [
                        // Allow Page Designer to embed the storefront in an iframe
                        '*.demandware.net'
                    ]
                }
            }
        })
    )

    // Handle the redirect from SLAS as to avoid error
    app.get('/callback', handleCallback)

    app.get('/:shortCode/:tenantId/oauth2/jwks', (req, res) => {
        jwksCaching(req, res, {shortCode: req.params.shortCode, tenantId: req.params.tenantId})
    })

    // Handles the passwordless login callback route. SLAS makes a POST request to this
    // endpoint sending the email address and passwordless token. Then this endpoint calls
    // the sendMagicLinkEmail function to send an email with the passwordless login magic link.
    // https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-passwordless-login.html#receive-the-callback
    app.post(passwordlessLoginCallback, async (req, res) => {
        const appConfig = getConfig()?.app
        if (appConfig?.login?.passwordless?.mode !== 'callback') {
            return res.status(400).json({error: 'Passwordless callback mode not enabled'})
        }
        const slasCallbackToken = req.headers['x-slas-callback-token']
        if (!slasCallbackToken) {
            return res.status(400).json({error: 'Missing x-slas-callback-token header'})
        }
        const redirectUrl = req.query.redirectUrl
        try {
            await validateSlasCallbackToken(slasCallbackToken)
            await sendMagicLinkEmail(
                req,
                res,
                config.app.login?.passwordless?.landingPath,
                'passwordless-magic-link',
                redirectUrl
            )
        } catch (err) {
            logger.error('passwordless callback failed', {
                namespace: 'slas-callback',
                additionalProperties: {error: err?.message}
            })
            res.status(500).json({error: 'Failed to send notification'})
        }
    })

    // Handles the reset password callback route. SLAS makes a POST request to this
    // endpoint sending the email address and reset password token. Then this endpoint calls
    // the sendMagicLinkEmail function to send an email with the reset password magic link.
    // https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-password-reset.html#slas-password-reset-flow
    app.post(resetPasswordCallback, async (req, res) => {
        const appConfig = getConfig()?.app
        if (appConfig?.login?.resetPassword?.mode !== 'callback') {
            return res.status(400).json({error: 'Reset password callback mode not enabled'})
        }
        const slasCallbackToken = req.headers['x-slas-callback-token']
        if (!slasCallbackToken) {
            return res.status(400).json({error: 'Missing x-slas-callback-token header'})
        }
        try {
            await validateSlasCallbackToken(slasCallbackToken)
            await sendMagicLinkEmail(
                req,
                res,
                config.app.login?.resetPassword?.landingPath,
                'password-reset'
            )
        } catch (err) {
            logger.error('reset-password callback failed', {
                namespace: 'slas-callback',
                additionalProperties: {error: err?.message}
            })
            res.status(500).json({error: 'Failed to send notification'})
        }
    })

    // Proxy endpoint for the shared maintenance page — fetches CDN content server-side
    // to avoid CORS restrictions on the client.
    app.get('/api/maintenance-page', async (_req, res) => {
        const {app: appConfig} = config
        const {sharedMaintenancePage, cdnUrl, forwardedHost} =
            appConfig?.pages?.maintenancePage || {}

        if (!sharedMaintenancePage || !cdnUrl) {
            return res.status(404).end()
        }

        try {
            const cdnRes = await fetch(cdnUrl, {
                headers: {'x-dw-forwarded-host': forwardedHost}
            })
            if (!cdnRes.ok && cdnRes.status !== 503) {
                return res.status(cdnRes.status).end()
            }
            let html = await cdnRes.text()
            html = html.replace(/<\/?html[^>]*>/gi, '')
            html = html.replace(/<\/?head[^>]*>/gi, '')
            html = html.replace(/<\/?body[^>]*>/gi, '')
            res.setHeader('Content-Type', 'text/html')
            res.send(html)
        } catch (error) {
            logger.error('Failed to fetch maintenance page', {
                namespace: 'maintenance-page',
                additionalProperties: {error}
            })
            res.status(502).json({
                error: 'Failed to fetch maintenance page',
                details: error.message
            })
        }
    })

    // Shopper Agent — Token Bridge proxy.
    // Browser POSTs an auth_link_key and siteId (as x-site-id header).
    // In HttpOnly mode, tokens are read from cookies server-side.
    // In non-HttpOnly mode, SLAS access token is sent in request body.
    // Server extracts my_domain from AGENT_MYDOMAIN environment variable,
    // validates it's a trusted Salesforce host (SSRF prevention), then
    // forwards the tokens to Core's `/agent/identity/bridge` endpoint with
    // the access token in an `Authorization: SLAS` header and the refresh
    // token in the body.
    registerTokenBridgeRoute(app)

    app.get('/robots.txt', runtime.serveStaticFile('static/robots.txt'))
    app.get('/favicon.ico', runtime.serveStaticFile('static/ico/favicon.ico'))
    app.get(
        '/static/inline-agent-widget.umd.js',
        runtime.serveStaticFile('static/inline-agent-widget.umd.js')
    )

    app.get('/worker.js(.map)?', runtime.serveServiceWorker)

    // Helper function to transform relative icon paths to absolute URLs
    function transformIconPaths(data, ecomServerHost) {
        const baseUrl = `https://${ecomServerHost}/on/demandware.static/Sites-Site/-/-/internal`
        const methodTypes = data?.paymentMethodTypes
        if (methodTypes) {
            for (const method of Object.values(methodTypes)) {
                for (const image of method.images ?? []) {
                    if (image.src?.startsWith('/icons/')) {
                        image.src = `${baseUrl}${image.src}`
                    }
                }
            }
        }
        return data
    }

    // Helper function to fetch payment metadata from the Commerce Cloud instance
    app.get('/api/payment-metadata', async (req, res) => {
        try {
            const response = await fetch(config.app.sfPayments.metadataUrl, {
                headers: {Accept: 'application/json'}
            })
            if (!response.ok) {
                throw new Error(`Metadata request failed with status: ${response.status}`)
            }
            const data = await response.json()
            const transformedData = transformIconPaths(
                data,
                new URL(config.app.sfPayments.metadataUrl).hostname
            )
            res.setHeader('Content-Type', 'application/json')
            res.json(transformedData)
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch metadata',
                details: error.message
            })
        }
    })

    // S15: defense-in-depth throttle on /api/order-lookup/* endpoints
    app.use(createVerifyThrottle())

    app.post('/api/order-lookup/verify', async (req, res) => {
        const appConfig = getConfig()?.app
        if (!appConfig?.guestOrderLookup?.enabled)
            return res.status(503).json({error: 'Feature not enabled'})

        const {orderNo, email, accessCode} = req.body || {}
        if (!orderNo || !email || !accessCode)
            return res.status(400).json({error: 'Missing required fields'})

        const siteIdForToken = getSiteIdFromRequest(req) || appConfig.commerceAPI.parameters.siteId
        const authorization = req.headers.authorization
        if (!authorization) {
            return res.status(401).json({error: 'Missing authorization'})
        }

        const correlationId = req.headers['x-correlation-id']
        const start = Date.now()

        try {
            const shopperOrders = makeShopperOrders(appConfig.commerceAPI.parameters, authorization)
            const order = await shopperOrders.guestOrderLookup({
                parameters: {orderNo, expand: ['oms', 'oms_shipments']},
                body: {orderViewCode: accessCode, email}
            })
            // 5.5.0 resolves instead of throwing on SCAPI error responses — detect by shape
            if (!order?.orderNo) {
                const title = order?.title || ''
                const fakeStatus = /unauthorized/i.test(title)
                    ? 401
                    : /not.found/i.test(title)
                    ? 404
                    : 500
                const proxyErr = new Error(order?.detail || 'Unexpected SCAPI response')
                proxyErr.response = {status: fakeStatus}
                throw proxyErr
            }

            // Apply guest field allowlist
            const filtered = filterGuestOrderFields(order)

            // Write HttpOnly session cookie
            const siteId = siteIdForToken
            const cookieName = `cc-goa_${siteId}`
            const existing = parseGuestOrderCookie(req, cookieName)
            existing[orderNo] = {email, verifiedCode: accessCode}
            const cookieVal = evictIfNeeded(existing)
            res.setHeader(
                'Set-Cookie',
                `${cookieName}=${encodeURIComponent(
                    JSON.stringify(cookieVal)
                )}; HttpOnly;${cookieSecureFlag} SameSite=Strict; Path=/; Max-Age=900`
            )

            logger.info('guest-order-lookup verify success', {
                namespace: 'guest-order-lookup',
                additionalProperties: {
                    correlationId,
                    orderNoPrefix: orderNo?.slice(0, 4),
                    scapiStatus: 200,
                    durationMs: Date.now() - start
                }
            })
            res.json(filtered)
        } catch (err) {
            const scapiStatus = err?.response?.status || 500
            const errorKind = scapiStatus === 404 ? 'invalid_code' : 'scapi_error'
            logger.warn('guest-order-lookup verify error', {
                namespace: 'guest-order-lookup',
                additionalProperties: {
                    correlationId,
                    orderNoPrefix: orderNo?.slice(0, 4),
                    scapiStatus,
                    errorKind,
                    durationMs: Date.now() - start
                }
            })
            if (scapiStatus === 404)
                return res.status(404).json({error: 'Invalid or expired access code'})
            res.status(502).json({error: 'Service error'})
        }
    })

    app.get('/api/order-lookup/order/:orderNo', async (req, res) => {
        const appConfig = getConfig()?.app
        if (!appConfig?.guestOrderLookup?.enabled)
            return res.status(503).json({error: 'Feature not enabled'})

        const siteId = getSiteIdFromRequest(req) || appConfig.commerceAPI.parameters.siteId
        const authorization = req.headers.authorization
        if (!authorization) return res.status(401).json({error: 'Missing authorization'})

        const cookieName = `cc-goa_${siteId}`
        const cookieData = parseGuestOrderCookie(req, cookieName)

        const orderNo = req.params.orderNo
        if (!orderNo || !cookieData[orderNo])
            return res.status(403).json({error: 'No verified session for this order'})

        const {email, verifiedCode} = cookieData[orderNo]
        const correlationId = req.headers['x-correlation-id']
        const start = Date.now()

        try {
            const shopperOrders = makeShopperOrders(appConfig.commerceAPI.parameters, authorization)
            const order = await shopperOrders.guestOrderLookup({
                parameters: {orderNo, expand: ['oms', 'oms_shipments']},
                body: {orderViewCode: verifiedCode, email}
            })
            // 5.5.0 resolves instead of throwing on SCAPI error responses — detect by shape
            if (!order?.orderNo) {
                const title = order?.title || ''
                const fakeStatus = /unauthorized/i.test(title)
                    ? 401
                    : /not.found/i.test(title)
                    ? 404
                    : 500
                const proxyErr = new Error(order?.detail || 'Unexpected SCAPI response')
                proxyErr.response = {status: fakeStatus}
                throw proxyErr
            }
            const filtered = filterGuestOrderFields(order)
            logger.info('guest-order-lookup order fetch success', {
                namespace: 'guest-order-lookup',
                additionalProperties: {
                    correlationId,
                    orderNoPrefix: orderNo?.slice(0, 4),
                    scapiStatus: 200,
                    durationMs: Date.now() - start
                }
            })
            res.json(filtered)
        } catch (err) {
            const scapiStatus = err?.response?.status || 500
            const errorKind = scapiStatus === 404 ? 'expired_code' : 'scapi_error'
            logger.warn('guest-order-lookup order fetch error', {
                namespace: 'guest-order-lookup',
                additionalProperties: {
                    correlationId,
                    orderNoPrefix: orderNo?.slice(0, 4),
                    scapiStatus,
                    errorKind,
                    durationMs: Date.now() - start
                }
            })
            if (scapiStatus === 404) {
                // Clear this order's cookie entry
                const cookieData2 = parseGuestOrderCookie(req, cookieName)
                delete cookieData2[orderNo]
                res.setHeader(
                    'Set-Cookie',
                    `${cookieName}=${encodeURIComponent(
                        JSON.stringify(cookieData2)
                    )}; HttpOnly;${cookieSecureFlag} SameSite=Strict; Path=/; Max-Age=900`
                )
                return res.status(404).json({error: 'Session expired'})
            }
            if (scapiStatus === 401) return res.status(401).json({error: 'Unauthorized'})
            if (scapiStatus === 403) return res.status(403).json({error: 'Forbidden'})
            res.status(502).json({error: 'Service error'})
        }
    })

    app.get('/api/order-lookup/oms-meta', async (req, res) => {
        const appConfig = getConfig()?.app
        if (!appConfig?.guestOrderLookup?.enabled)
            return res.status(503).json({error: 'Feature not enabled'})

        const siteId = getSiteIdFromRequest(req) || appConfig.commerceAPI.parameters.siteId
        const authorization = req.headers.authorization
        if (!authorization) return res.status(401).json({error: 'Missing authorization'})

        const cookieName = `cc-goa_${siteId}`
        const cookieData = parseGuestOrderCookie(req, cookieName)
        if (!cookieData || Object.keys(cookieData).length === 0)
            return res.status(401).json({error: 'No active session'})

        try {
            const shopperOrders = makeShopperOrders(appConfig.commerceAPI.parameters, authorization)
            const meta = await shopperOrders.getOmsMetaData({parameters: {}})
            const cancelReasonCodes = meta.cancelReasonCodes ?? []
            const returnReasonCodes = meta.returnReasonCodes ?? []
            return res.json({
                // OmsMetaData has no omsActive field; derive from either operation being available
                omsActive: cancelReasonCodes.length > 0 || returnReasonCodes.length > 0,
                cancelReasonCodes,
                returnReasonCodes
            })
        } catch (err) {
            if (err?.response?.status === 409) {
                return res.json({omsActive: false, cancelReasonCodes: [], returnReasonCodes: []})
            }
            return res.status(502).json({error: 'Failed to fetch OMS metadata'})
        }
    })

    app.post('/api/order-lookup/cancel', async (req, res) => {
        const appConfig = getConfig()?.app
        if (!appConfig?.guestOrderLookup?.enabled)
            return res.status(503).json({error: 'Feature not enabled'})

        const siteId = getSiteIdFromRequest(req) || appConfig.commerceAPI.parameters.siteId
        const authorization = req.headers.authorization
        if (!authorization) return res.status(401).json({error: 'Missing authorization'})

        const cookieName = `cc-goa_${siteId}`
        const cookieData = parseGuestOrderCookie(req, cookieName)

        const {orderNo, reason} = req.body ?? {}
        // errorKind: 'invalid_input' for client input errors; SCAPI-classified kinds for downstream errors
        if (!orderNo || typeof orderNo !== 'string')
            return res
                .status(400)
                .json({errorKind: 'invalid_input', message: 'orderNo is required'})
        if (!cookieData?.[orderNo])
            return res.status(401).json({error: 'No session for this order'})

        let regex
        try {
            regex = new RegExp(
                appConfig.guestOrderLookup?.orderNumberRegex ?? '^[a-zA-Z0-9-]{6,32}$'
            )
        } catch {
            regex = /^[a-zA-Z0-9-]{6,32}$/
        }
        if (!regex.test(orderNo))
            return res
                .status(400)
                .json({errorKind: 'invalid_input', message: 'Invalid orderNo format'})

        try {
            const shopperOrders = makeShopperOrders(appConfig.commerceAPI.parameters, authorization)
            await shopperOrders.cancelOmsOrder({
                parameters: {orderNo},
                body: reason && typeof reason === 'string' ? {reason} : {}
            })
            return res.json({success: true})
        } catch (err) {
            const status = err?.response?.status
            if (status === 400) return res.status(400).json({errorKind: 'invalid_reason'})
            if (status === 404) return res.status(404).json({errorKind: 'not_found'})
            if (status === 409) return res.status(409).json({errorKind: 'not_cancellable'})
            return res.status(500).json({errorKind: 'transient'})
        }
    })

    app.post('/api/order-lookup/return', async (req, res) => {
        const appConfig = getConfig()?.app
        if (!appConfig?.guestOrderLookup?.enabled)
            return res.status(503).json({error: 'Feature not enabled'})

        const siteId = getSiteIdFromRequest(req) || appConfig.commerceAPI.parameters.siteId
        const authorization = req.headers.authorization
        if (!authorization) return res.status(401).json({error: 'Missing authorization'})

        const cookieName = `cc-goa_${siteId}`
        const cookieData = parseGuestOrderCookie(req, cookieName)

        const {orderNo, productItems} = req.body ?? {}
        // errorKind: 'invalid_input' for client input errors; SCAPI-classified kinds for downstream errors
        if (!orderNo || typeof orderNo !== 'string')
            return res
                .status(400)
                .json({errorKind: 'invalid_input', message: 'orderNo is required'})
        if (!cookieData?.[orderNo])
            return res.status(401).json({error: 'No session for this order'})

        let regex
        try {
            regex = new RegExp(
                appConfig.guestOrderLookup?.orderNumberRegex ?? '^[a-zA-Z0-9-]{6,32}$'
            )
        } catch {
            regex = /^[a-zA-Z0-9-]{6,32}$/
        }
        if (!regex.test(orderNo))
            return res
                .status(400)
                .json({errorKind: 'invalid_input', message: 'Invalid orderNo format'})

        if (!Array.isArray(productItems) || productItems.length === 0)
            return res.status(400).json({
                errorKind: 'invalid_input',
                message: 'productItems must be a non-empty array'
            })

        for (const item of productItems) {
            if (!item.itemId || typeof item.itemId !== 'string')
                return res.status(400).json({
                    errorKind: 'invalid_input',
                    message: 'Each productItem must have a string itemId'
                })
            const qty = Number(item.quantity)
            if (!Number.isFinite(qty) || qty < 1)
                return res.status(400).json({
                    errorKind: 'invalid_input',
                    message: 'Each productItem must have a positive quantity'
                })
        }

        try {
            const shopperOrders = makeShopperOrders(appConfig.commerceAPI.parameters, authorization)
            await shopperOrders.returnOmsOrder({
                parameters: {orderNo},
                body: {productItems}
            })
            return res.json({success: true})
        } catch (err) {
            const status = err?.response?.status
            if (status === 400) {
                let errorCode
                try {
                    errorCode = (await err.response.clone().json())?.errorCode
                } catch {
                    /* best-effort parse; fall through to generic error if body is unparseable */
                }
                if (errorCode === 'InvalidReasonCode')
                    return res.status(400).json({errorKind: 'invalidReason'})
                if (errorCode === 'UnknownProductItemIds')
                    return res.status(400).json({errorKind: 'unknownItems'})
                if (errorCode === 'ReturnQuantityExceeded')
                    return res.status(400).json({errorKind: 'quantityExceeded'})
                return res.status(400).json({errorKind: 'unknown'})
            }
            if (status === 404) return res.status(404).json({errorKind: 'notFound'})
            if (status === 409) return res.status(409).json({errorKind: 'conflict'})
            return res.status(500).json({errorKind: 'transient'})
        }
    })

    app.get('*', runtime.render)
})
// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = handler
