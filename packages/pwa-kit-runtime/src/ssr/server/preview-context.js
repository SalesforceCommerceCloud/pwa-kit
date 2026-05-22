/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import cookie from 'cookie'
import {cookieAsString} from '../../utils/ssr-proxying'
import {getValidatedCookieDomain} from './cookie-domain'
import {
    SET_COOKIE,
    STOREFRONT_PREVIEW_CTX_COOKIE,
    STOREFRONT_PREVIEW_PARENT_ALLOW_LIST
} from './constants'

const SEC_FETCH_DEST = 'sec-fetch-dest'
const SEC_FETCH_SITE = 'sec-fetch-site'
const REFERER = 'referer'

const isAllowedParentOrigin = (origin) => STOREFRONT_PREVIEW_PARENT_ALLOW_LIST.includes(origin)

/**
 * Parses the Referer header and returns its origin, or undefined when the
 * header is missing or unparseable.
 * @private
 */
function getRefererOrigin(req) {
    const referer = req.headers?.[REFERER]
    if (!referer) return undefined
    try {
        return new URL(referer).origin
    } catch {
        return undefined
    }
}

/**
 * Returns the parent origin (validated against the allow-list) when the
 * incoming request looks like the initial top-level navigation of a
 * Storefront Preview iframe. Otherwise returns undefined.
 *
 * Detection relies entirely on browser-attested headers:
 *  - Sec-Fetch-Dest: iframe       — only set on iframe document loads
 *  - Sec-Fetch-Site: cross-site   — set when the navigating frame's parent
 *                                    is on a different site
 *  - Referer origin               — preserved on cross-origin navigations
 *                                    when the parent uses a referrer policy
 *                                    that exposes the origin (Runtime Admin
 *                                    uses strict-origin-when-cross-origin)
 *
 * `Sec-Fetch-*` headers are in the browser's forbidden-header list, so they
 * cannot be set from cross-origin JS. An attacker cannot trigger this gate.
 *
 * Only GET is accepted: iframe document loads are GETs (Storefront Preview
 * does not HEAD-prefetch). HEAD/POST iframe loads also exist in theory but
 * are not part of the Storefront Preview flow.
 *
 * @private
 */
function detectTrustedPreviewParent(req) {
    if (req.method !== 'GET') return undefined
    if (req.headers?.[SEC_FETCH_DEST] !== 'iframe') return undefined
    if (req.headers?.[SEC_FETCH_SITE] !== 'cross-site') return undefined
    const origin = getRefererOrigin(req)
    if (!origin || !isAllowedParentOrigin(origin)) return undefined
    return origin
}

/**
 * When the incoming request is the initial top-level navigation of a
 * Storefront Preview iframe whose parent is on the trusted allow-list,
 * append a Set-Cookie header that records the parent origin. The marker is
 * read on later SLAS proxy responses to switch session cookies to
 * SameSite=None; Partitioned. No-ops on every other request shape.
 *
 * Cookie attributes:
 *   Path=/; Secure; HttpOnly; SameSite=None; Partitioned
 *   plus Domain=... when commerceAPI.cookieDomain is configured.
 *
 * Session cookie (no Expires/Max-Age) — the marker is re-issued on every
 * qualifying request, and clears when the preview window closes.
 */
export function tryWriteStorefrontPreviewMarker(req, res, options) {
    const parentOrigin = detectTrustedPreviewParent(req)
    if (!parentOrigin) return

    const cookieDomain = getValidatedCookieDomain(options)
    // The parent origin is written as the cookie value as-is (e.g.
    // `https://runtime.commercecloud.com`). Browsers and the `cookie`
    // package round-trip `:` and `/` cleanly without URL-encoding for
    // every entry currently on STOREFRONT_PREVIEW_PARENT_ALLOW_LIST. If a
    // future allow-list entry contains characters that need encoding,
    // wrap this in encodeURIComponent (and decodeURIComponent on read).
    res.append(
        SET_COOKIE,
        cookieAsString({
            name: STOREFRONT_PREVIEW_CTX_COOKIE,
            value: parentOrigin,
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            partitioned: true,
            ...(cookieDomain && {domain: cookieDomain})
        })
    )
}

/**
 * Returns the validated parent origin from the marker cookie on the request,
 * or undefined when the cookie is absent, malformed, or carries a value that
 * is not on the trusted allow-list. The re-validation defends against stale
 * cookies left over from an old allow-list as well as values that would have
 * been impossible to set legitimately.
 */
export function readStorefrontPreviewMarker(req) {
    const cookieHeader = req.headers?.cookie
    if (!cookieHeader) return undefined
    const cookies = cookie.parse(cookieHeader)
    const value = cookies[STOREFRONT_PREVIEW_CTX_COOKIE]
    if (!value || !isAllowedParentOrigin(value)) return undefined
    return value
}
