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
 * Decodes the SLAS access token JWT, extracts claims, and sets non-HttpOnly metadata cookies
 * (expires-at, dnt, uido) so the client can read them. Same field extraction as
 * commerce-sdk-react parseSlasJWT.
 *
 * Returns {isGuest} for the caller to determine the refresh token cookie name.
 * @private
 */
function setTokenClaimCookies(res, siteId, accessToken, expiresInSeconds) {
    let payload
    try {
        payload = jwtDecode(accessToken)
    } catch (error) {
        throw new Error(`Failed to decode access token JWT: ${error.message || error}. `)
    }

    const accessExpires = new Date(Date.now() + expiresInSeconds * 1000)

    // Expiry timestamp — use JWT iat when available (non-HttpOnly so client can check expiry)
    let expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds
    if (typeof payload.iat === 'number') {
        expiresAt = payload.iat + expiresInSeconds
    }
    res.append(
        SET_COOKIE,
        cookieAsString({
            name: `cc-at-expires-at_${siteId}`,
            value: String(expiresAt),
            path: '/',
            secure: true,
            sameSite: 'lax',
            httpOnly: false,
            expires: accessExpires
        })
    )

    // Do-not-track flag from JWT (non-HttpOnly so client can read it)
    if (payload.dnt !== undefined) {
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: `cc-at-dnt_${siteId}`,
                value: String(payload.dnt),
                path: '/',
                secure: true,
                sameSite: 'lax',
                httpOnly: false,
                expires: accessExpires
            })
        )
    }

    // Extract isGuest and uido from JWT isb claim
    let isGuest = true
    let uido = null
    if (typeof payload.isb === 'string') {
        const isbParts = payload.isb.split('::')
        isGuest = isbParts[1] === 'upn:Guest'
        const uidoPart = isbParts[0].split('uido:')[1]
        if (uidoPart) uido = uidoPart
    }

    // uido: IDP origin (e.g. "slas", "ecom"); non-HttpOnly so client can read for useCustomerType/isExternal
    if (uido) {
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: `uido_${siteId}`,
                value: uido,
                path: '/',
                secure: true,
                sameSite: 'lax',
                httpOnly: false,
                expires: accessExpires
            })
        )
    }

    return {isGuest}
}

/**
 * Sets the IDP access token as an HttpOnly cookie.
 * @private
 */
function setIdpAccessTokenCookie(res, siteId, idpAccessToken, expiresInSeconds) {
    const idpExpires = new Date(Date.now() + expiresInSeconds * 1000)
    res.append(
        SET_COOKIE,
        cookieAsString({
            name: `idp_access_token_${siteId}`,
            value: idpAccessToken,
            path: '/',
            secure: true,
            sameSite: 'lax',
            httpOnly: true,
            expires: idpExpires
        })
    )
}

/**
 * Sets the refresh token as an HttpOnly cookie. Cookie name depends on guest vs registered user.
 * @private
 */
function setRefreshTokenCookie(res, siteId, refreshToken, refreshTokenExpiresIn, isGuest) {
    const refreshTTL = getRefreshTokenCookieTTL(refreshTokenExpiresIn, isGuest)
    const refreshExpires = new Date(Date.now() + refreshTTL * 1000)
    const refreshCookieName = isGuest ? `cc-nx-g_${siteId}` : `cc-nx_${siteId}`

    res.append(
        SET_COOKIE,
        cookieAsString({
            name: refreshCookieName,
            value: refreshToken,
            path: '/',
            secure: true,
            sameSite: 'lax',
            httpOnly: true,
            expires: refreshExpires
        })
    )
}

/**
 * When HttpOnly session cookies are enabled: set tokens as HttpOnly cookies,
 * strip token fields from body, and append our Set-Cookie headers (preserving upstream cookies).
 * @private
 */
export function applyHttpOnlySessionCookies(responseBuffer, proxyRes, req, res, options) {
    const siteId = options.mobify?.app?.commerceAPI?.parameters?.siteId
    if (!siteId || typeof siteId !== 'string' || siteId.trim() === '') {
        throw new Error(
            'HttpOnly session cookies are enabled but siteId is missing. ' +
                'Set mobify.app.commerceAPI.parameters.siteId in your app config.'
        )
    }

    let parsed
    try {
        parsed = JSON.parse(responseBuffer.toString('utf8'))
    } catch {
        return responseBuffer
    }

    const site = siteId.trim()
    const expiresInSeconds = typeof parsed.expires_in === 'number' ? parsed.expires_in : 1800

    // Decode JWT, set metadata cookies (expires-at, dnt, uido), get isGuest
    let isGuest = true
    if (parsed.access_token) {
        // Access token (HttpOnly)
        const accessExpires = new Date(Date.now() + expiresInSeconds * 1000)
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

        const claims = setTokenClaimCookies(res, site, parsed.access_token, expiresInSeconds)
        isGuest = claims.isGuest
    }

    // IDP access token
    if (parsed.idp_access_token) {
        setIdpAccessTokenCookie(res, site, parsed.idp_access_token, expiresInSeconds)
    }

    // Refresh token
    if (parsed.refresh_token) {
        setRefreshTokenCookie(
            res,
            site,
            parsed.refresh_token,
            parsed.refresh_token_expires_in,
            isGuest
        )
    }

    // Strip token fields from body so they are not exposed to the client
    const stripped = {...parsed}
    delete stripped.access_token
    delete stripped.idp_access_token
    delete stripped.refresh_token
    return Buffer.from(JSON.stringify(stripped), 'utf8')
}
