/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getCookieName,
    getSiteId,
    SESSION_COOKIE_CONFIG
} from '@salesforce/pwa-kit-runtime/ssr/server/httponly-cookie-config.js'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {isTrustedSalesforceDomain} from './salesforce-domain-allowlist.js'

/* -------------------------------------------------------------------------
 * Token Bridge PoC — calls Core's `/agent/identity/bridge` from PWA Kit.
 *
 * This module is intentionally free of React (and of the
 * `@salesforce/retail-react-app/...` self-referential imports used by the
 * UI component) so it can be loaded by `app/ssr.js` under bare `babel-node`
 * during local development. The React component (`./index.jsx`) re-uses
 * the browser-side helper `callTokenBridge` from here.
 *
 * Flow:
 *   1. Browser: Depending on HttpOnly mode:
 *      - HttpOnly ON: Tokens in cookies (cc-at_{siteId}, cc-nx / cc-nx-g)
 *        sent automatically to same-origin proxy. Client sends auth_link_key
 *        in request body, and siteId as x-site-id header.
 *      - HttpOnly OFF: Access token in localStorage, refresh token in cookie.
 *        Client sends auth_link_key and the access token (from localStorage)
 *        in the request body, and siteId as the x-site-id header.
 *   2. Server route (registerTokenBridgeRoute, mounted in app/ssr.js):
 *      - Reads siteId from x-site-id header (standard PWA Kit pattern)
 *      - Reads tokens from cookies (HttpOnly mode) or the request body (non-HttpOnly)
 *      - Reads my_domain directly from AGENT_MYDOMAIN environment variable
 *      - Validates my_domain against Salesforce domain allowlist (SSRF prevention)
 *      - Forwards to Core with `Authorization: SLAS <access_token>` and
 *        `refresh_token` in the body.
 *   3. Core's response (status + body) is forwarded verbatim so the caller
 *      can branch on documented errors (INVALID_SLAS_TOKEN, SLAS_TOKEN_EXPIRED, ...).
 *
 * My Domain resolution: read directly from AGENT_MYDOMAIN environment variable,
 * then validated against a Salesforce domain allowlist (prevents SSRF).
 * ------------------------------------------------------------------------- */

export const TOKEN_BRIDGE_PROXY_PATH = '/api/agent/identity/bridge'
const CORE_TOKEN_BRIDGE_PATH = '/agent/identity/bridge'

/**
 * Parse cookies from the Cookie header string.
 * @param {string} [cookieHeader] - Cookie header string
 * @returns {Object} Object with cookie name-value pairs
 */
function parseCookies(cookieHeader) {
    const cookies = {}
    if (!cookieHeader) return cookies

    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.split('=')
        if (name && rest.length > 0) {
            cookies[name.trim()] = rest.join('=').trim()
        }
    })
    return cookies
}

/**
 * Resolve the Agentforce My Domain origin to call.
 *
 * Accepts the raw value from the AGENT_MYDOMAIN environment variable — which
 * may be scheme-less (e.g. `orgfarm-1234.my.salesforce.com`) or include a
 * trailing slash — and always returns an absolute URL origin (or null) so
 * `new URL()` and `fetch()` can parse it. Trims whitespace, strips trailing
 * slashes, and prepends `https://` when no scheme is present.
 *
 * @param {string} [myDomain] - The My Domain of the customer org (typically
 *   from the AGENT_MYDOMAIN environment variable)
 * @returns {string|null} - Absolute origin, or null if the input is empty/invalid
 */
export function resolveAgentforceMyDomain(myDomain) {
    if (!myDomain || typeof myDomain !== 'string') return null
    const trimmed = myDomain.trim().replace(/\/+$/, '')
    if (!trimmed) return null
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

// isTrustedSalesforceDomain (Core `*.salesforce.com` allowlist) lives in
// ./salesforce-domain-allowlist.js — the Token Bridge only ever talks to Core's
// My Domain (AGENT_MYDOMAIN), so it uses the Core list for both its upstream SSRF
// check and the CSRF Origin check.

/** Express handler for POST /api/agent/identity/bridge. */
export async function handleTokenBridge(req, res) {
    try {
        const {auth_link_key: authLinkKey, slas_access_token: bodySlasAccessToken} = req.body || {}

        if (!authLinkKey || typeof authLinkKey !== 'string') {
            return res.status(400).json({error: 'MISSING_AUTH_LINK_KEY'})
        }

        // CSRF protection: Validate Origin header for state-changing POST
        // In HttpOnly mode, this endpoint acts on ambient cookie authority (cc-at/cc-nx),
        // so we verify the request comes from a same-origin or trusted Salesforce origin.
        // This provides defense-in-depth beyond SameSite=Lax cookie protection.
        const origin = req.headers.origin || req.headers.referer
        if (origin) {
            try {
                const originUrl = new URL(origin)
                // Use `host` (host:port) rather than `hostname` (no port) so the
                // comparison matches `req.headers.host`, which includes the port
                // (e.g. `localhost:3000` in local dev).
                const originHost = originUrl.host.toLowerCase()

                // Allow same-origin requests (PWA Kit storefront calling its own API)
                const requestHost = req.headers.host?.toLowerCase()
                const isSameOrigin = originHost === requestHost

                // Allow trusted Salesforce origins (for Storefront Preview iframe)
                const isTrustedSalesforceOrigin = isTrustedSalesforceDomain(origin)

                if (!isSameOrigin && !isTrustedSalesforceOrigin) {
                    console.error('[token-bridge] CSRF attempt blocked: untrusted Origin', {
                        origin,
                        requestHost
                    })
                    return res.status(403).json({error: 'FORBIDDEN_ORIGIN'})
                }
            } catch (err) {
                // Invalid Origin URL
                console.error('[token-bridge] Invalid Origin header', {origin})
                return res.status(400).json({error: 'INVALID_ORIGIN'})
            }
        }
        // If no Origin/Referer header, allow (same-origin POSTs from some browsers/tools)

        // Read siteId from x-site-id header using official helper
        const siteId = getSiteId(req)

        // Check if HttpOnly mode is enabled
        const isHttpOnly = process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES === 'true'

        // Parse cookies from the request
        const cookies = parseCookies(req.headers.cookie)

        let slasAccessToken, refreshToken

        if (isHttpOnly) {
            // HttpOnly mode: Read tokens from cookies using official cookie name helpers
            const accessTokenCookie = getCookieName(SESSION_COOKIE_CONFIG.accessToken, siteId)
            const refreshTokenRegisteredCookie = getCookieName(
                SESSION_COOKIE_CONFIG.refreshTokenRegistered,
                siteId
            )
            const refreshTokenGuestCookie = getCookieName(
                SESSION_COOKIE_CONFIG.refreshTokenGuest,
                siteId
            )

            slasAccessToken = cookies[accessTokenCookie]
            refreshToken = cookies[refreshTokenRegisteredCookie] || cookies[refreshTokenGuestCookie]

            if (!slasAccessToken) {
                console.error('[token-bridge] HttpOnly mode: Access token cookie not found')
                return res.status(401).json({error: 'INVALID_SLAS_TOKEN'})
            }
        } else {
            // Non-HttpOnly mode: access token arrives in the request body
            // (browser reads it from localStorage), refresh token from cookie
            const refreshTokenRegisteredCookie = getCookieName(
                SESSION_COOKIE_CONFIG.refreshTokenRegistered,
                siteId
            )
            const refreshTokenGuestCookie = getCookieName(
                SESSION_COOKIE_CONFIG.refreshTokenGuest,
                siteId
            )

            slasAccessToken = bodySlasAccessToken
            refreshToken = cookies[refreshTokenRegisteredCookie] || cookies[refreshTokenGuestCookie]

            if (!slasAccessToken || typeof slasAccessToken !== 'string') {
                return res.status(401).json({error: 'INVALID_SLAS_TOKEN'})
            }
        }

        // Read the Agentforce My Domain from the AGENT_MYDOMAIN environment
        // variable and normalize it to an absolute origin. AGENT_MYDOMAIN may be
        // scheme-less (e.g. `orgfarm-...my.salesforce.com`); resolveAgentforceMyDomain
        // prepends `https://` so `new URL()` in isTrustedSalesforceDomain and the
        // downstream fetch can parse it.
        const myDomain = resolveAgentforceMyDomain(process.env.AGENT_MYDOMAIN)

        if (!myDomain) {
            console.error(
                '[token-bridge] Agentforce My Domain is not configured. ' +
                    'Set the AGENT_MYDOMAIN environment variable.'
            )
            return res.status(500).json({error: 'MYDOMAIN_NOT_CONFIGURED'})
        }

        // SSRF prevention: validate myDomain against Salesforce allowlist
        if (!isTrustedSalesforceDomain(myDomain)) {
            console.error(
                '[token-bridge] SSRF attempt blocked: myDomain is not a trusted Salesforce domain',
                {myDomain}
            )
            return res.status(400).json({error: 'UNTRUSTED_MYDOMAIN'})
        }

        if (!refreshToken) {
            // We never expect to reach Core without a refresh token in this flow;
            // log at error level so it surfaces in production monitoring.
            console.error(
                '[token-bridge] No SLAS refresh token available; ' +
                    'forwarding to Core without refresh_token.'
            )
        }

        const coreResponse = await fetch(`${myDomain}${CORE_TOKEN_BRIDGE_PATH}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `SLAS ${slasAccessToken}`
            },
            body: JSON.stringify({
                auth_link_key: authLinkKey,
                ...(refreshToken ? {refresh_token: refreshToken} : {})
            })
        })

        let body = null
        try {
            body = await coreResponse.json()
        } catch {
            body = null
        }
        return res.status(coreResponse.status).json(body)
    } catch (err) {
        console.error('[token-bridge] Unexpected error:', err)
        return res.status(500).json({error: 'INTERNAL_ERROR'})
    }
}

/** Mount the Token Bridge proxy on the given Express app (called from app/ssr.js). */
export function registerTokenBridgeRoute(app) {
    app.post(TOKEN_BRIDGE_PROXY_PATH, handleTokenBridge)
}

/**
 * Browser helper: POSTs to the same-origin proxy and returns Core's status + body.
 *
 * In HttpOnly mode, tokens are sent automatically via cookies. In non-HttpOnly mode,
 * the access token is read from localStorage and sent in the request body,
 * while the refresh token is read from cookies server-side.
 *
 * myDomain is now derived server-side from AGENT_MYDOMAIN environment variable.
 *
 * @param {string} authLinkKey - Auth link key from the embedded messaging API
 * @param {string} [slasAccessToken] - SLAS access token (non-HttpOnly mode only)
 * @param {string} [siteId] - Site ID sent as x-site-id header for cookie name resolution
 */
export const callTokenBridge = async ({authLinkKey, slasAccessToken, siteId}) => {
    const requestBody = {
        auth_link_key: authLinkKey
    }

    // Only include access token if provided (non-HttpOnly mode)
    if (slasAccessToken) {
        requestBody.slas_access_token = slasAccessToken
    }

    const headers = {
        'Content-Type': 'application/json'
    }

    // Send siteId as x-site-id header (same pattern as other PWA Kit routes)
    // This is used server-side to resolve HttpOnly cookie names (cc-at_{siteId}, cc-nx_{siteId})
    if (siteId) {
        headers['x-site-id'] = siteId
    }

    const res = await fetch(TOKEN_BRIDGE_PROXY_PATH, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
    })

    let responseBody = null
    try {
        responseBody = await res.json()
    } catch {
        responseBody = null
    }
    return {status: res.status, body: responseBody}
}
