/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {jwtDecode} from 'jwt-decode'
import {cookieAsString} from '../../utils/ssr-proxying'
import {SET_COOKIE} from './constants'
import {getValidatedCookieDomain} from './cookie-domain'
import {clearStorefrontPreviewMarker, readStorefrontPreviewMarker} from './preview-context'
import {
    SESSION_COOKIE_CONFIG,
    getAllCookieConfigs,
    getCookieName,
    getResponseBodyFieldsToStrip,
    getSiteId
} from './httponly-cookie-config'
import logger from '../../utils/logger-instance'

// SameSite/Partitioned attributes for top-level (non-preview) traffic.
const DEFAULT_SITE_ATTRS = Object.freeze({sameSite: 'lax'})

// SameSite/Partitioned attributes for traffic from a trusted Storefront
// Preview iframe (CHIPS — partitioned by the parent's top-level site).
const PREVIEW_IFRAME_SITE_ATTRS = Object.freeze({sameSite: 'none', partitioned: true})

/**
 * Resolves the SameSite/Partitioned attributes to apply to all session
 * cookies on this response. When the request carries a validated
 * Storefront-Preview marker (set under server-attested conditions on the
 * iframe document load), returns `{sameSite: 'none', partitioned: true}`
 * so cookies attach inside the cross-site iframe. Otherwise returns
 * `{sameSite: 'lax'}` (the existing top-level behavior).
 * @private
 */
function getSiteAttrsForRequest(req) {
    return readStorefrontPreviewMarker(req) ? PREVIEW_IFRAME_SITE_ATTRS : DEFAULT_SITE_ATTRS
}

// Refresh token cookie TTL defaults (seconds). Must stay in sync with commerce-sdk-react auth constants.
const DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL = 30 * 24 * 60 * 60
const DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL = 90 * 24 * 60 * 60

/**
 * Returns a function that appends a Set-Cookie header to `res`. When
 * `cookieDomain` is configured, every write also emits a second expiring
 * Set-Cookie for the same name without a Domain attribute, expiring any
 * pre-existing host-scoped cookie. This mirrors
 * `CookieStorage.removeHostAndDomainCookie` in commerce-sdk-react and prevents
 * stale duplicates when a merchant first enables the cookieDomain config.
 *
 * `siteAttrs` (sameSite/partitioned) is decided per-request by
 * `getSiteAttrsForRequest` and applied uniformly to every cookie this
 * helper emits — including the host-scoped cleanup writes, so deletions
 * match the partition of the original write (Partitioned-cookie deletion
 * is partition-keyed).
 * @private
 */
function makeAppendCookie(res, cookieDomain, siteAttrs) {
    return ({name, value, expires, attributes}) => {
        res.append(
            SET_COOKIE,
            cookieAsString({
                name,
                value,
                expires,
                ...attributes,
                ...siteAttrs,
                ...(cookieDomain && {domain: cookieDomain})
            })
        )
        if (cookieDomain) {
            res.append(
                SET_COOKIE,
                cookieAsString({
                    name,
                    value: '',
                    expires: new Date(0),
                    ...attributes,
                    ...siteAttrs
                })
            )
        }
    }
}

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
    const cookieDomain = getValidatedCookieDomain(options)
    const siteAttrs = getSiteAttrsForRequest(req)
    const appendCookie = makeAppendCookie(res, cookieDomain, siteAttrs)
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

    // Decode JWT and extract claims. `isGuest` is hoisted because the
    // refresh-token block below needs it to choose the guest/registered cookie.
    let isGuest = true
    if (parsed.access_token) {
        const tokenClaims = getTokenClaims(parsed.access_token)
        isGuest = tokenClaims.isGuest

        // Access token (HttpOnly)
        appendCookie({
            name: getCookieName(accessToken, site),
            value: parsed.access_token,
            expires: tokenClaims.accessExpires,
            attributes: accessToken.attributes
        })

        // Expiry timestamp from JWT exp claim (non-HttpOnly so client can check expiry)
        appendCookie({
            name: getCookieName(accessTokenExpires, site),
            value: String(tokenClaims.expiresAt),
            expires: tokenClaims.accessExpires,
            attributes: accessTokenExpires.attributes
        })

        // Do-not-track flag from JWT (non-HttpOnly so client can read it)
        if (tokenClaims.dnt !== undefined) {
            appendCookie({
                name: getCookieName(accessTokenDnt, site),
                value: String(tokenClaims.dnt),
                expires: tokenClaims.accessExpires,
                attributes: accessTokenDnt.attributes
            })
        }

        // uido: IDP origin (e.g. "slas", "ecom"); non-HttpOnly so client can read for useCustomerType/isExternal
        if (tokenClaims.uido) {
            appendCookie({
                name: getCookieName(uido, site),
                value: tokenClaims.uido,
                expires: tokenClaims.accessExpires,
                attributes: uido.attributes
            })
        }

        // IDP access token (HttpOnly)
        if (parsed.idp_access_token) {
            appendCookie({
                name: getCookieName(idpAccessToken, site),
                value: parsed.idp_access_token,
                expires: tokenClaims.accessExpires,
                attributes: idpAccessToken.attributes
            })
        }

        // id_token (non-HttpOnly): expiry tied to access token JWT exp.
        if (parsed.id_token) {
            appendCookie({
                name: getCookieName(idToken, site),
                value: parsed.id_token,
                expires: tokenClaims.accessExpires,
                attributes: idToken.attributes
            })
        }

        // Hybrid SFRA + PWA: customer_id and customer_type describe the identity
        // carried by the access token (customer_type is derived from the JWT
        // `isb` claim), so they are mirrored as non-HttpOnly siteId-suffixed
        // cookies here — aligned to the access-token expiry, alongside cc-at /
        // cc-at-expires / uido / id_token. Written on every access-token response
        // so they stay in sync with the current token (mirroring the client's
        // handleTokenResponse). The session-scoped usid / enc_user_id cookies
        // stay refresh-TTL-aligned in the refresh-token block below.
        appendCookie({
            name: getCookieName(customerType, site),
            value: tokenClaims.isGuest ? 'guest' : 'registered',
            expires: tokenClaims.accessExpires,
            attributes: customerType.attributes
        })

        if (parsed.customer_id) {
            appendCookie({
                name: getCookieName(customerId, site),
                value: parsed.customer_id,
                expires: tokenClaims.accessExpires,
                attributes: customerId.attributes
            })
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

        appendCookie({
            name: getCookieName(refreshConfig, site),
            value: parsed.refresh_token,
            expires: refreshExpires,
            attributes: refreshConfig.attributes
        })

        // Delete the opposite refresh token cookie to mirror client-side behavior:
        // Login (guest → registered): delete guest cookie cc-nx-g
        // Logout (registered → guest): delete registered cookie cc-nx
        const staleRefreshConfig = isGuest ? refreshTokenRegistered : refreshTokenGuest
        appendCookie({
            name: getCookieName(staleRefreshConfig, site),
            value: '',
            expires: new Date(0),
            attributes: staleRefreshConfig.attributes
        })

        // Hybrid SFRA + PWA: mirror session-scoped SLAS metadata as
        // siteId-suffixed cookies so SFRA can read the same session state. These
        // are aligned to the refresh-token TTL because they must survive
        // access-token refreshes within a single shopper session. (customer_id
        // and customer_type are identity-scoped and written in the access-token
        // block above, aligned to the access-token expiry.)
        if (parsed.enc_user_id) {
            appendCookie({
                name: getCookieName(encUserId, site),
                value: parsed.enc_user_id,
                expires: refreshExpires,
                attributes: encUserId.attributes
            })
        }

        // usid: SLAS session id, non-HttpOnly so client/SFRA/Einstein can read
        // it. Aligned to refresh-token TTL to persist across access-token
        // refreshes within a single shopper session.
        if (parsed.usid) {
            appendCookie({
                name: getCookieName(usid, site),
                value: parsed.usid,
                expires: refreshExpires,
                attributes: usid.attributes
            })
        }

        // cc-nx-expires: absolute epoch (seconds) when the refresh token cookie
        // expires. Mirrors cc-at-expires for the access token. Cookie expiry
        // attribute aligned to the same instant.
        appendCookie({
            name: getCookieName(refreshTokenExpires, site),
            value: String(Math.floor(refreshExpires.getTime() / 1000)),
            expires: refreshExpires,
            attributes: refreshTokenExpires.attributes
        })

        // idp_refresh_token (HttpOnly): refresh-TTL-aligned, only when present.
        if (parsed.idp_refresh_token) {
            appendCookie({
                name: getCookieName(idpRefreshToken, site),
                value: parsed.idp_refresh_token,
                expires: refreshExpires,
                attributes: idpRefreshToken.attributes
            })
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
 * stale tokens are not sent with subsequent requests. When `cookieDomain` is configured,
 * also expires the host-scoped versions so cookies set before the flag was enabled are
 * cleaned up too.
 * @private
 */
export function expireHttpOnlySessionCookies(req, res, options) {
    const siteId = getSiteId(req)
    if (!siteId) {
        throw new Error(
            'HttpOnly session cookies are enabled but siteId is missing. ' +
                'Ensure the x-site-id header is set on the request.'
        )
    }

    const site = siteId
    const expired = new Date(0)
    const cookieDomain = getValidatedCookieDomain(options)
    const siteAttrs = getSiteAttrsForRequest(req)
    const appendCookie = makeAppendCookie(res, cookieDomain, siteAttrs)

    for (const config of getAllCookieConfigs()) {
        appendCookie({
            name: getCookieName(config, site),
            value: '',
            expires: expired,
            attributes: config.attributes
        })
    }

    // Also expire the marker cookie itself, so the iframe-context state
    // doesn't outlive the SLAS session it was associated with. The marker
    // re-issues on the next qualifying iframe document load.
    clearStorefrontPreviewMarker(res)
}
