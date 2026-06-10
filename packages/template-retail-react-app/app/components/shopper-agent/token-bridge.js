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
 *   1. Browser reads:
 *      - SLAS access token via useAccessToken hook
 *      - SLAS refresh token via useRefreshToken hook
 *      - my_domain via useConfigurations hook (Shopper Configurations API)
 *      All three tokens plus my_domain are sent in the request body to the
 *      same-origin proxy (POST /api/agent/identity/bridge), along with auth_link_key.
 *   2. Server route (registerTokenBridgeRoute, mounted in app/ssr.js)
 *      resolves the ANC MyDomain from the request body and forwards to Core with
 *      `Authorization: SLAS <access_token>` and `refresh_token` in the body.
 *   3. Core's response (status + body) is forwarded verbatim so the caller
 *      can branch on documented errors (INVALID_SLAS_TOKEN, SLAS_TOKEN_EXPIRED, ...).
 *
 * MyDomain resolution: sourced from the Shopper Configurations API via useConfigurations hook,
 * forwarded from the browser through the request body to the server-side handler.
 * ------------------------------------------------------------------------- */

export const TOKEN_BRIDGE_PROXY_PATH = '/api/agent/identity/bridge'
const CORE_TOKEN_BRIDGE_PATH = '/agent/identity/bridge'

/**
 * Resolve the ANC MyDomain origin to call.
 * Accepts values with or without a scheme; always returns an absolute URL
 * origin (or null) so `fetch()` can parse it.
 *
 * @param {string} [myDomain] - MyDomain value from the Shopper Configurations API
 */
export function resolveAncMyDomain(myDomain) {
    if (!myDomain || typeof myDomain !== 'string') return null
    const trimmed = myDomain.trim().replace(/\/+$/, '')
    if (!trimmed) return null
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Express handler for POST /api/agent/identity/bridge. */
export async function handleTokenBridge(req, res) {
    try {
        const {
            auth_link_key: authLinkKey,
            slas_access_token: slasAccessToken,
            slas_refresh_token: refreshToken,
            my_domain: myDomainFromConfig
        } = req.body || {}

        if (!authLinkKey || typeof authLinkKey !== 'string') {
            return res.status(400).json({error: 'MISSING_AUTH_LINK_KEY'})
        }
        if (!slasAccessToken || typeof slasAccessToken !== 'string') {
            return res.status(401).json({error: 'INVALID_SLAS_TOKEN'})
        }

        const myDomain = resolveAncMyDomain(myDomainFromConfig)
        if (!myDomain) {
            console.error(
                '[token-bridge] ANC MyDomain is not configured. ' +
                    'Provide my_domain via the Shopper Configurations API.'
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
 *
 * @param {string} authLinkKey - Auth link key from the embedded messaging API
 * @param {string} slasAccessToken - SLAS access token
 * @param {string} [slasRefreshToken] - SLAS refresh token
 * @param {string} [myDomain] - MyDomain value from the Shopper Configurations API
 */
export const callTokenBridge = async ({
    authLinkKey,
    slasAccessToken,
    slasRefreshToken,
    myDomain
}) => {
    const res = await fetch(TOKEN_BRIDGE_PROXY_PATH, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            auth_link_key: authLinkKey,
            slas_access_token: slasAccessToken,
            ...(slasRefreshToken ? {slas_refresh_token: slasRefreshToken} : {}),
            ...(myDomain ? {my_domain: myDomain} : {})
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
