/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {jwtDecode} from 'jwt-decode'
import {cookieAsString} from '../../utils/ssr-proxying'
import {SET_COOKIE} from './constants'
import {
    SESSION_COOKIE_CONFIG,
    getAllCookieConfigs,
    getCookieName,
    getSiteId
} from './httponly-cookie-config'
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
export function setHttpOnlySessionCookies(responseBuffer, proxyRes, req, res, options) {
    const siteId = getSiteId(req)
    if (!siteId) {
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

    const site = siteId
    const {
        accessToken,
        accessTokenExpires,
        accessTokenDnt,
        uido,
        idpAccessToken,
        refreshTokenGuest,
        refreshTokenRegistered,
        refreshTokenExists
    } = SESSION_COOKIE_CONFIG

    // Decode JWT and extract claims
    let isGuest = true
    if (parsed.access_token) {
        const tokenClaims = getTokenClaims(parsed.access_token)
        isGuest = tokenClaims.isGuest

        // Access token (HttpOnly)
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(accessToken, site),
                value: parsed.access_token,
                expires: tokenClaims.accessExpires,
                ...accessToken.attributes
            })
        )

        // Expiry timestamp from JWT exp claim (non-HttpOnly so client can check expiry)
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(accessTokenExpires, site),
                value: String(tokenClaims.expiresAt),
                expires: tokenClaims.accessExpires,
                ...accessTokenExpires.attributes
            })
        )

        // Do-not-track flag from JWT (non-HttpOnly so client can read it)
        if (tokenClaims.dnt !== undefined) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(accessTokenDnt, site),
                    value: String(tokenClaims.dnt),
                    expires: tokenClaims.accessExpires,
                    ...accessTokenDnt.attributes
                })
            )
        }

        // uido: IDP origin (e.g. "slas", "ecom"); non-HttpOnly so client can read for useCustomerType/isExternal
        if (tokenClaims.uido) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(uido, site),
                    value: tokenClaims.uido,
                    expires: tokenClaims.accessExpires,
                    ...uido.attributes
                })
            )
        }

        // IDP access token (HttpOnly)
        if (parsed.idp_access_token) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(idpAccessToken, site),
                    value: parsed.idp_access_token,
                    expires: tokenClaims.accessExpires,
                    ...idpAccessToken.attributes
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
        const refreshConfig = isGuest ? refreshTokenGuest : refreshTokenRegistered

        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(refreshConfig, site),
                value: parsed.refresh_token,
                expires: refreshExpires,
                ...refreshConfig.attributes
            })
        )

        // Non-HttpOnly indicator so the client can check if a refresh token cookie exists
        // (JavaScript cannot read HttpOnly cookies). Shares the same expiry as the refresh token.
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(refreshTokenExists, site),
                value: '1',
                expires: refreshExpires,
                ...refreshTokenExists.attributes
            })
        )

        // Delete the opposite refresh token cookie to mirror client-side behavior:
        // Login (guest → registered): delete guest cookie cc-nx-g
        // Logout (registered → guest): delete registered cookie cc-nx
        const staleRefreshConfig = isGuest ? refreshTokenRegistered : refreshTokenGuest
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(staleRefreshConfig, site),
                value: '',
                expires: new Date(0),
                ...staleRefreshConfig.attributes
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

/**
 * When a SLAS logout response is received, expire all HttpOnly session cookies so that
 * stale tokens are not sent with subsequent requests.
 * @private
 */
export function expireHttpOnlySessionCookies(req, res) {
    const siteId = getSiteId(req)
    if (!siteId) {
        throw new Error(
            'HttpOnly session cookies are enabled but siteId is missing. ' +
                'Ensure the x-site-id header is set on the request.'
        )
    }

    const site = siteId
    const expired = new Date(0)

    for (const config of getAllCookieConfigs()) {
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(config, site),
                value: '',
                expires: expired,
                ...config.attributes
            })
        )
    }
}
