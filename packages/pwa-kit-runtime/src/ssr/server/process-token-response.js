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
    getResponseBodyFieldsToStrip,
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
        customerId,
        encUserId,
        customerType,
        usid,
        refreshTokenExpires,
        idToken,
        idpRefreshToken
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

        // id_token (non-HttpOnly): expiry tied to access token JWT exp.
        if (parsed.id_token) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(idToken, site),
                    value: parsed.id_token,
                    expires: tokenClaims.accessExpires,
                    ...idToken.attributes
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

        // Hybrid SFRA + PWA: mirror SLAS metadata as siteId-suffixed cookies so SFRA
        // can read the same session state. Expiry aligned with refresh token TTL.
        //
        // These writes live inside `if (parsed.refresh_token)` because we need a fresh
        // refresh-token TTL to choose `refreshExpires`. SLAS responses that include
        // these metadata fields always also include a refresh_token (login flows and
        // refresh-with-rotation), so in practice this is the same condition. If a
        // future flow returns metadata without a refresh_token, the existing cookies
        // remain valid until they expire on their own schedule.
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(customerType, site),
                value: isGuest ? 'guest' : 'registered',
                expires: refreshExpires,
                ...customerType.attributes
            })
        )

        if (parsed.customer_id) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(customerId, site),
                    value: parsed.customer_id,
                    expires: refreshExpires,
                    ...customerId.attributes
                })
            )
        }

        if (parsed.enc_user_id) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(encUserId, site),
                    value: parsed.enc_user_id,
                    expires: refreshExpires,
                    ...encUserId.attributes
                })
            )
        }

        // usid: SLAS session id, non-HttpOnly so client/SFRA/Einstein can read
        // it. Aligned to refresh-token TTL to persist across access-token
        // refreshes within a single shopper session.
        if (parsed.usid) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(usid, site),
                    value: parsed.usid,
                    expires: refreshExpires,
                    ...usid.attributes
                })
            )
        }

        // cc-nx-expires: absolute epoch (seconds) when the refresh token cookie
        // expires. Mirrors cc-at-expires for the access token. Cookie expiry
        // attribute aligned to the same instant.
        res.append(
            SET_COOKIE,
            cookieAsString({
                name: getCookieName(refreshTokenExpires, site),
                value: String(Math.floor(refreshExpires.getTime() / 1000)),
                expires: refreshExpires,
                ...refreshTokenExpires.attributes
            })
        )

        // idp_refresh_token (HttpOnly): refresh-TTL-aligned, only when present.
        if (parsed.idp_refresh_token) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name: getCookieName(idpRefreshToken, site),
                    value: parsed.idp_refresh_token,
                    expires: refreshExpires,
                    ...idpRefreshToken.attributes
                })
            )
        }
    }

    // Strip HttpOnly token fields from the response body so they are only
    // readable via the corresponding cookies. The list of fields is derived
    // from `slasKey` markers on SESSION_COOKIE_CONFIG so this stays aligned
    // with the cookies being set above.
    const stripped = {...parsed}
    for (const field of getResponseBodyFieldsToStrip()) {
        delete stripped[field]
    }
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
