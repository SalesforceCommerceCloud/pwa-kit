/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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
 *   1. Browser reads the SLAS access token (useAccessToken) and SLAS refresh
 *      token (useRefreshToken) from the commerce-sdk-react auth context.
 *      Both are sent in the request body to the same-origin proxy
 *      (POST /api/agent/identity/bridge), along with the auth_link_key.
 *   2. Server route (registerTokenBridgeRoute, mounted in app/ssr.js)
 *      resolves the ANC MyDomain and forwards to Core with
 *      `Authorization: SLAS <access_token>` and `refresh_token` in the body.
 *   3. Core's response (status + body) is forwarded verbatim so the caller
 *      can branch on documented errors (INVALID_SLAS_TOKEN, SLAS_TOKEN_EXPIRED, ...).
 *
 * MyDomain resolution: process.env.ANC_MYDOMAIN (PoC fallback). Once the
 * Shopper Configurations API exposes ancMyDomain, swap the body of
 * resolveAncMyDomain() to call SCAPI server-side and cache it.
 * ------------------------------------------------------------------------- */

export const TOKEN_BRIDGE_PROXY_PATH = '/api/agent/identity/bridge'
const CORE_TOKEN_BRIDGE_PATH = '/agent/identity/bridge'

/**
 * Resolve the ANC MyDomain origin to call. PoC: env var only.
 * Accepts values with or without a scheme; always returns an absolute URL
 * origin (or null) so `fetch()` can parse it.
 */
export function resolveAncMyDomain() {
    const fromEnv = process.env.ANC_MYDOMAIN
    if (!fromEnv) return null
    const trimmed = fromEnv.trim().replace(/\/+$/, '')
    if (!trimmed) return null
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Express handler for POST /api/agent/identity/bridge. */
export async function handleTokenBridge(req, res) {
    try {
        const {
            auth_link_key: authLinkKey,
            slas_access_token: slasAccessToken,
            slas_refresh_token: refreshToken
        } = req.body || {}

        if (!authLinkKey || typeof authLinkKey !== 'string') {
            return res.status(400).json({error: 'MISSING_AUTH_LINK_KEY'})
        }
        if (!slasAccessToken || typeof slasAccessToken !== 'string') {
            return res.status(401).json({error: 'INVALID_SLAS_TOKEN'})
        }

        const myDomain = resolveAncMyDomain()
        if (!myDomain) {
            console.error(
                '[token-bridge] ANC MyDomain is not configured. Set ANC_MYDOMAIN env var.'
            )
            return res.status(500).json({error: 'MYDOMAIN_NOT_CONFIGURED'})
        }

        if (!refreshToken) {
            // Core treats refresh_token as optional, so we still forward — but
            // warn so a misconfig surfaces. Without it, the Named Credential
            // cannot refresh once the SLAS access token expires.
            console.warn(
                '[token-bridge] No SLAS refresh token in request body; ' +
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
        return res.status(500).json({error: 'SLAS_INTERNAL_ERROR', details: err?.message})
    }
}

/** Mount the Token Bridge proxy on the given Express app (called from app/ssr.js). */
export function registerTokenBridgeRoute(app) {
    app.post(TOKEN_BRIDGE_PROXY_PATH, handleTokenBridge)
}

/**
 * Browser helper: POSTs to the same-origin proxy and returns Core's status + body.
 *
 * Both the SLAS access token and refresh token are read on the client via the
 * commerce-sdk-react auth context (see useAccessToken / useRefreshToken) and
 * passed through the body. The proxy forwards them to Core.
 */
export const callTokenBridge = async ({authLinkKey, slasAccessToken, slasRefreshToken}) => {
    const res = await fetch(TOKEN_BRIDGE_PROXY_PATH, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            auth_link_key: authLinkKey,
            slas_access_token: slasAccessToken,
            ...(slasRefreshToken ? {slas_refresh_token: slasRefreshToken} : {})
        })
    })

    let body = null
    try {
        body = await res.json()
    } catch {
        body = null
    }
    return {status: res.status, body}
}
