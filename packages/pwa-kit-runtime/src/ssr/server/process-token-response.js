/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {jwtDecode} from 'jwt-decode'
import {cookieAsString} from '../../utils/ssr-proxying'
import {SET_COOKIE} from './constants'
import logger from '../../utils/logger-instance'

// Refresh token cookie TTL defaults (seconds). Must stay in sync with commerce-sdk-react auth constants.
const DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL = 30 * 24 * 60 * 60
const DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL = 90 * 24 * 60 * 60

/**
 * Computes refresh token cookie TTL in seconds. Same logic as Auth.getRefreshTokenCookieTTLValue in commerce-sdk-react:
 * 1. Override value (if valid), 2. SLAS response value, 3. Default (guest or registered).
 * Used when setting HttpOnly refresh token cookies. Keep in sync with commerce-sdk-react auth.
 * @private
 */
export function getRefreshTokenCookieTTL(refreshTokenExpiresInSLASValue, isGuest, options = {}) {
    const overrideValue = isGuest
        ? options.refreshTokenGuestCookieTTL
        : options.refreshTokenRegisteredCookieTTL
    const defaultValue = isGuest
        ? DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
        : DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL
    const isOverrideValid =
        typeof overrideValue === 'number' && overrideValue > 0 && overrideValue <= defaultValue
    if (!isOverrideValid && overrideValue !== undefined) {
        logger.warn('You are attempting to use an invalid refresh token TTL value.')
    }
    return isOverrideValid ? overrideValue : refreshTokenExpiresInSLASValue || defaultValue
}

/**
 * Decodes the SLAS access token JWT and extracts claims. Same field extraction as
 * commerce-sdk-react parseSlasJWT.
 * @private
 */
function getTokenClaims(accessToken) {
    let payload
    try {
        payload = jwtDecode(accessToken)
    } catch (error) {
        throw new Error(`Failed to decode access token JWT: ${error.message || error}. `)
    }

    const accessExpires = new Date(payload.exp * 1000)

    // Extract isGuest and uido from JWT isb claim
    let isGuest = true
    let uido = null
    if (typeof payload.isb === 'string') {
        const isbParts = payload.isb.split('::')
        isGuest = isbParts[1] === 'upn:Guest'
        const uidoPart = isbParts[0].split('uido:')[1]
        if (uidoPart) uido = uidoPart
    }

    return {accessExpires, expiresAt: payload.exp, dnt: payload.dnt, isGuest, uido}
}

/**
 * When HttpOnly session cookies are enabled: set tokens as HttpOnly cookies,
 * strip token fields from body, and append our Set-Cookie headers (preserving upstream cookies).
 * @private
 */
export function applyHttpOnlySessionCookies(responseBuffer, proxyRes, req, res, options) {
    const siteId = req.headers?.['x-site-id']
    if (!siteId || typeof siteId !== 'string' || siteId.trim() === '') {
        throw new Error(
            'HttpOnly session cookies are enabled but siteId is missing. ' +
                'Ensure the x-site-id header is set on the request.'
        )
    }

    let parsed
    try {
        parsed = JSON.parse(responseBuffer.toString('utf8'))
    } catch {
        return responseBuffer
    }

    const site = siteId.trim()

    // Decode JWT and extract claims
    let isGuest = true
    if (parsed.access_token) {
        const {
            accessExpires,
            expiresAt,
            dnt,
            uido,
            isGuest: guest
        } = getTokenClaims(parsed.access_token)
        isGuest = guest

        // Access token (HttpOnly)
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: `cc-at_${site}`,
                value: parsed.access_token,
                path: '/',
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
                expires: accessExpires
            })
        )

        // Expiry timestamp from JWT exp claim (non-HttpOnly so client can check expiry)
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: `cc-at-expires_${site}`,
                value: String(expiresAt),
                path: '/',
                secure: true,
                sameSite: 'lax',
                httpOnly: false,
                expires: accessExpires
            })
        )

        // Do-not-track flag from JWT (non-HttpOnly so client can read it)
        if (dnt !== undefined) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: `cc-at-dnt_${site}`,
                    value: String(dnt),
                    path: '/',
                    secure: true,
                    sameSite: 'lax',
                    httpOnly: false,
                    expires: accessExpires
                })
            )
        }

        // uido: IDP origin (e.g. "slas", "ecom"); non-HttpOnly so client can read for useCustomerType/isExternal
        if (uido) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: `uido_${site}`,
                    value: uido,
                    path: '/',
                    secure: true,
                    sameSite: 'lax',
                    httpOnly: false,
                    expires: accessExpires
                })
            )
        }

        // IDP access token (HttpOnly)
        if (parsed.idp_access_token) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: `idp_access_token_${site}`,
                    value: parsed.idp_access_token,
                    path: '/',
                    secure: true,
                    sameSite: 'lax',
                    httpOnly: true,
                    expires: accessExpires
                })
            )
        }
    }

    // Refresh token (HttpOnly) — uses its own TTL, independent of access token expiry
    if (parsed.refresh_token) {
        const commerceAPI = options.mobify?.app?.commerceAPI || {}
        const refreshTTL = getRefreshTokenCookieTTL(
            parsed.refresh_token_expires_in,
            isGuest,
            commerceAPI
        )
        const refreshExpires = new Date(Date.now() + refreshTTL * 1000)
        const refreshCookieName = isGuest ? `cc-nx-g_${site}` : `cc-nx_${site}`

        res.append(
            SET_COOKIE,
            cookieAsString({
                name: refreshCookieName,
                value: parsed.refresh_token,
                path: '/',
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
                expires: refreshExpires
            })
        )

        // Delete the opposite refresh token cookie to mirror client-side behavior:
        // Login (guest → registered): delete guest cookie cc-nx-g
        // Logout (registered → guest): delete registered cookie cc-nx
        const staleCookieName = isGuest ? `cc-nx_${site}` : `cc-nx-g_${site}`
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: staleCookieName,
                value: '',
                path: '/',
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
                expires: new Date(0)
            })
        )
    }

    // Strip token fields from body so they are not exposed to the client
    const stripped = {...parsed}
    delete stripped.access_token
    delete stripped.idp_access_token
    delete stripped.refresh_token
    return Buffer.from(JSON.stringify(stripped), 'utf8')
}
