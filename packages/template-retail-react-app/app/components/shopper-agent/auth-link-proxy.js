/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* -------------------------------------------------------------------------
 * Auth Link Proxy — calls SCRT's `/iamessage/api/v2/authorization/authlink` from PWA Kit.
 *
 * This module provides a same-origin proxy for Commerce Client to retrieve auth link keys
 * from SCRT, since `window.embeddedservice_bootstrap.userVerificationAPI.getAuthLinkKey`
 * is not available for Commerce Client messaging widgets.
 *
 * This module is intentionally free of React (and of the
 * `@salesforce/retail-react-app/...` self-referential imports used by the
 * UI component) so it can be loaded by `app/ssr.js` under bare `babel-node`
 * during local development. The React component (`./index.jsx`) re-uses
 * the browser-side helper `callAuthLinkProxy` from here.
 *
 * Flow:
 *   1. Browser: Commerce Client widget is ready (onCimulateWidgetReady event)
 *      - Extract Commerce Client JWT from the cim_af_ct_* storage key
 *      - Send commerce_client_jwt in request body to /api/agent/authlink
 *   2. Server route (registerAuthLinkRoute, mounted in app/ssr.js):
 *      - Reads commerce_client_jwt from request body
 *      - Validates JWT is present
 *      - Reads scrt2Url from the COMMERCE_AGENT_SETTINGS environment variable
 *      - Validates scrt2Url against Salesforce domain allowlist (SSRF prevention)
 *      - Forwards to SCRT with `Authorization: Bearer <commerce_client_jwt>`
 *
 * NOTE: unlike the Token Bridge, this route does NOT use a siteId — the SCRT
 * authlink endpoint authenticates with the Commerce Client JWT (Bearer) alone,
 * so there is no x-site-id header on this request.
 *   3. SCRT's response (auth_link_key) is forwarded to the browser
 *   4. Browser then calls the existing Token Bridge proxy with auth_link_key
 *
 * IMPORTANT: This endpoint uses the Commerce Client JWT, NOT the SLAS token.
 * The Commerce Client JWT is extracted from the cim_af_ct_* storage key
 * which is set by the Commerce Client widget itself.
 *
 * SCRT2 host resolution: the auth link endpoint (/iamessage/*) is served by
 * SCRT2 (*.salesforce-scrt.com), which is a DIFFERENT host from Core's My Domain
 * (AGENT_MYDOMAIN, used by the Token Bridge). The SCRT2 origin is read from the
 * scrt2Url field of the COMMERCE_AGENT_SETTINGS environment variable, then
 * validated against a Salesforce domain allowlist (prevents SSRF).
 * ------------------------------------------------------------------------- */

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {isTrustedSalesforceDomain, isTrustedSCRTDomain} from './salesforce-domain-allowlist.js'

export const AUTH_LINK_PROXY_PATH = '/api/agent/authlink'

/**
 * Upstream timeout (ms) for the SCRT authlink call. Without a bound, a hung SCRT
 * connection would tie up the request until the platform's socket timeout, so
 * we abort well before that and return a 504 the caller can act on.
 */
const SCRT_FETCH_TIMEOUT_MS = 10000

/**
 * SCRT auth link endpoint path — fixed at the **v2** IA-message API.
 *
 * The presented JWT must be minted for the same version; the Commerce Client
 * (Cimulate) widget stores a v2 continuation token, which is what this endpoint
 * expects. A version mismatch is rejected by SCRT with HTTP 401 error 900020
 * (`JWT_VALID_NOT_AUTHORIZED_TO_API`) — the fix is to present a v2 token, NOT
 * to change this path.
 */
const SCRT_AUTHLINK_PATH = '/iamessage/api/v2/authorization/authlink'

/**
 * Extract the SCRT2 origin from the COMMERCE_AGENT_SETTINGS environment variable.
 *
 * The auth link endpoint (`/iamessage/*`) is served by SCRT2, whose host
 * (`*.salesforce-scrt.com`) is different from Core's My Domain (AGENT_MYDOMAIN).
 * SCRT2's base URL is already provisioned to the storefront as the `scrt2Url`
 * field of COMMERCE_AGENT_SETTINGS, so we read it from the same server-side
 * source rather than introducing a new env var.
 *
 * Any trailing slash is stripped so it can be concatenated with an absolute
 * path. Example: https://orgfarm-8fcc267362.test1.my.pc-rnd.salesforce-scrt.com
 *
 * @returns {string|null} - The SCRT2 origin (no trailing slash) or null if not found
 */
export function extractScrt2UrlFromEnv() {
    const raw = process.env.COMMERCE_AGENT_SETTINGS

    if (!raw) {
        console.error('[auth-link-proxy] COMMERCE_AGENT_SETTINGS environment variable not set')
        return null
    }

    let settings
    try {
        settings = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (err) {
        console.error('[auth-link-proxy] COMMERCE_AGENT_SETTINGS is not valid JSON', {
            message: err.message
        })
        return null
    }

    const scrt2Url = settings?.scrt2Url
    if (!scrt2Url || typeof scrt2Url !== 'string' || !scrt2Url.trim()) {
        console.error('[auth-link-proxy] scrt2Url not present in COMMERCE_AGENT_SETTINGS')
        return null
    }

    // Strip trailing slash(es) so `${scrt2Url}${SCRT_AUTHLINK_PATH}` is well-formed.
    return scrt2Url.trim().replace(/\/+$/, '')
}

// isTrustedSalesforceDomain (Core) and isTrustedSCRTDomain (SCRT2) are shared with
// token-bridge.js via ./salesforce-domain-allowlist.js. This proxy uses the Core list
// for the CSRF Origin check (Storefront Preview iframe is served from Core) and the
// SCRT2 list for the upstream SSRF check on scrt2Url.

/**
 * Express handler for POST /api/agent/authlink.
 *
 * Retrieves auth_link_key from SCRT's /iamessage/api/v2/authorization/authlink
 * endpoint. Uses Commerce Client JWT (from the cim_af_ct_* storage key) for
 * authorization.
 *
 * Request:
 *   Body:
 *     {
 *       "commerce_client_jwt": "<jwt_from_cim_af_ct_storage>"
 *     }
 *
 * Response:
 *   The SCRT status code and body are forwarded verbatim.
 *   Success: { "auth_link_key": "..." }
 *   SCRT error: <scrt error body, forwarded unchanged>
 *   Pre-flight error (no SCRT call): { "error": "ERROR_CODE" }
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleAuthLinkProxy(req, res) {
    try {
        const {commerce_client_jwt: commerceClientJWT} = req.body || {}

        // Validate that Commerce Client JWT is provided
        if (!commerceClientJWT || typeof commerceClientJWT !== 'string') {
            console.error('[auth-link-proxy] Commerce Client JWT not provided')
            return res.status(401).json({error: 'MISSING_COMMERCE_CLIENT_JWT'})
        }

        // CSRF protection: Validate Origin header for state-changing POST
        const origin = req.headers.origin || req.headers.referer
        if (origin) {
            try {
                const originUrl = new URL(origin)
                // Compare host (hostname + port), NOT hostname alone: the Origin/
                // Referer header carries the port for non-default ports (e.g. local
                // dev at localhost:3001), and so does the HTTP Host header. Using
                // `.hostname` would strip the port from one side only ("localhost"
                // vs "localhost:3001") and reject a genuine same-origin request.
                // `.host` also normalizes away default ports (:443/:80), so prod
                // (https://…, no port in Host) still matches.
                const originHost = originUrl.host.toLowerCase()

                // Allow same-origin requests (PWA Kit storefront calling its own API)
                const requestHost = req.headers.host?.toLowerCase()
                const isSameOrigin = originHost === requestHost

                // Allow trusted Salesforce origins (for Storefront Preview iframe)
                const isTrustedSalesforceOrigin = isTrustedSalesforceDomain(origin)

                if (!isSameOrigin && !isTrustedSalesforceOrigin) {
                    console.error('[auth-link-proxy] CSRF attempt blocked: untrusted Origin', {
                        origin,
                        requestHost
                    })
                    return res.status(403).json({error: 'FORBIDDEN_ORIGIN'})
                }
            } catch (err) {
                // Invalid Origin URL
                console.error('[auth-link-proxy] Invalid Origin header', {origin})
                return res.status(400).json({error: 'INVALID_ORIGIN'})
            }
        }
        // If no Origin/Referer header, allow (same-origin POSTs from some browsers/tools)

        // Resolve the SCRT2 origin from COMMERCE_AGENT_SETTINGS.scrt2Url.
        // NOTE: this is intentionally NOT AGENT_MYDOMAIN — the auth link endpoint
        // (/iamessage/*) lives on SCRT2 (*.salesforce-scrt.com), a different host
        // from Core's My Domain. Pointing at AGENT_MYDOMAIN returns a 404 from Core.
        const scrt2Url = extractScrt2UrlFromEnv()

        if (!scrt2Url) {
            console.error(
                '[auth-link-proxy] SCRT2 URL is not configured. ' +
                    'Set scrt2Url in the COMMERCE_AGENT_SETTINGS environment variable.'
            )
            return res.status(500).json({error: 'SCRT2_URL_NOT_CONFIGURED'})
        }

        // SSRF prevention: validate scrt2Url against the SCRT2 allowlist
        if (!isTrustedSCRTDomain(scrt2Url)) {
            console.error(
                '[auth-link-proxy] SSRF attempt blocked: scrt2Url is not a trusted Salesforce domain',
                {scrt2Url}
            )
            return res.status(400).json({error: 'UNTRUSTED_SCRT2_URL'})
        }

        // Call SCRT's auth link endpoint with the Commerce Client JWT.
        // The path is fixed at v2 (see SCRT_AUTHLINK_PATH). The request is bounded
        // by SCRT_FETCH_TIMEOUT_MS via an AbortController so a hung upstream does
        // not tie up the connection indefinitely.
        const scrtRequestUrl = `${scrt2Url}${SCRT_AUTHLINK_PATH}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), SCRT_FETCH_TIMEOUT_MS)
        let scrtResponse
        let body = null
        try {
            scrtResponse = await fetch(scrtRequestUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${commerceClientJWT}`
                },
                signal: controller.signal
            })
            try {
                body = await scrtResponse.json()
            } catch (err) {
                if (err?.name === 'AbortError') {
                    throw err
                }
                body = null
            }
        } finally {
            clearTimeout(timeoutId)
        }

        // Forward the status and body from SCRT
        if (!scrtResponse.ok) {
            console.error('[auth-link-proxy] SCRT auth link request failed', {
                status: scrtResponse.status,
                scrtUrl: scrtRequestUrl,
                body
            })
        }

        // Forward SCRT's status and body to the caller unchanged. The SCRT2 URL
        // that was called is intentionally NOT put in the response — it is only
        // logged server-side (above) for diagnostics, never exposed to the browser.
        return res.status(scrtResponse.status).json(body)
    } catch (err) {
        // AbortError => the SCRT_FETCH_TIMEOUT_MS deadline fired. Surface it as a
        // distinct 504 so the caller can tell a slow upstream from a real 500.
        if (err?.name === 'AbortError') {
            console.error('[auth-link-proxy] SCRT auth link request timed out', {
                timeoutMs: SCRT_FETCH_TIMEOUT_MS
            })
            return res.status(504).json({error: 'SCRT_TIMEOUT'})
        }
        console.error('[auth-link-proxy] Unexpected error:', err)
        return res.status(500).json({error: 'INTERNAL_ERROR'})
    }
}

/**
 * Mount the Auth Link proxy on the given Express app (called from app/ssr.js).
 *
 * @param {Object} app - Express application instance
 */
export function registerAuthLinkRoute(app) {
    app.post(AUTH_LINK_PROXY_PATH, handleAuthLinkProxy)
}

/**
 * Browser helper: POSTs to the same-origin proxy and returns SCRT's auth_link_key.
 *
 * Uses the Commerce Client JWT (extracted from the cim_af_ct_* storage key)
 * to authenticate with SCRT's authlink endpoint.
 *
 * The SCRT2 origin is derived server-side from scrt2Url in the
 * COMMERCE_AGENT_SETTINGS environment variable.
 *
 * @param {Object} options - Request options
 * @param {string} options.commerceClientJWT - Commerce Client JWT from the cim_af_ct_* storage key (required)
 * @returns {Promise<Object>} Promise that resolves to { auth_link_key: "..." }
 */
export const callAuthLinkProxy = async ({commerceClientJWT}) => {
    const requestBody = {
        commerce_client_jwt: commerceClientJWT
    }

    // No x-site-id header: the SCRT authlink endpoint authenticates with the
    // Commerce Client JWT (Bearer) alone. Unlike the Token Bridge — which needs
    // the siteId to resolve HttpOnly cookie names (cc-at_{siteId}) — authlink has
    // nothing to key off the siteId, so sending it would be dead weight.
    const res = await fetch(AUTH_LINK_PROXY_PATH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })

    let responseBody = null
    try {
        responseBody = await res.json()
    } catch {
        responseBody = null
    }

    if (!res.ok) {
        throw new Error(`Auth link proxy failed: ${responseBody?.error || `HTTP_${res.status}`}`)
    }

    return responseBody
}
