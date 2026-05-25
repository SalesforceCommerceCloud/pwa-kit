/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {cookieAsString} from '../../utils/ssr-proxying'
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
 * Reads a single cookie value from a `Cookie` header. Inline so we don't
 * pull in the `cookie` package as a direct dependency. Marker values are
 * known origin strings (no URL-encoded characters), so split-and-prefix
 * is sufficient — does not handle the full RFC 6265 cookie grammar.
 * @private
 */
function getCookieValue(cookieHeader, name) {
    if (!cookieHeader) return undefined
    const target = `${name}=`
    for (const pair of cookieHeader.split(';')) {
        const trimmed = pair.trimStart()
        if (trimmed.startsWith(target)) {
            return trimmed.slice(target.length)
        }
    }
    return undefined
}

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
 *  - Sec-Fetch-Dest: iframe                — only set on iframe document loads
 *  - Sec-Fetch-Site: cross-site|same-site  — set when the navigating frame's
 *                                             parent is on a different origin.
 *                                             `cross-site` covers production
 *                                             (RA on commercecloud.com,
 *                                             storefront on mobify-storefront.com).
 *                                             `same-site` covers non-prod
 *                                             scenarios where both share an
 *                                             eTLD+1 (e.g. *.mobify-storefront.com).
 *  - Referer origin                        — preserved on cross-origin navigations
 *                                             when the parent uses a referrer policy
 *                                             that exposes the origin (Runtime Admin
 *                                             uses strict-origin-when-cross-origin).
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
    const fetchSite = req.headers?.[SEC_FETCH_SITE]
    if (fetchSite !== 'cross-site' && fetchSite !== 'same-site') return undefined
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
 * Cookie attributes (browser-enforced via the `__Host-` prefix):
 *   Path=/; Secure; HttpOnly; SameSite=None; Partitioned
 *   No `Domain` attribute — the marker is host-scoped on purpose, since it
 *   is only ever read by the storefront BFF on the same host that issued
 *   it. `__Host-` rejects the cookie at the browser if any of these
 *   invariants are violated.
 *
 * Session cookie (no Expires/Max-Age) — the marker is re-issued on every
 * qualifying request, and clears when the preview window closes.
 *
 * Trade-off (host-scope vs. cross-subdomain in-iframe navigation):
 *   The marker does not travel across subdomains. If a preview iframe ever
 *   navigates from `app.example.com` to `checkout.example.com` (both are
 *   storefront BFF hosts under the same eTLD+1), the BFF on the new host
 *   won't see the marker and will fall back to SameSite=Lax for any
 *   session cookies it issues — which the browser strips in the cross-site
 *   iframe context, breaking the iframe on the second host. Storefront
 *   Preview's actual flow doesn't exercise this case (Runtime Admin sets
 *   `iframe.src` once and uses postMessage `locationChange` for in-iframe
 *   nav, which stays on the same host), but it's worth knowing if a
 *   merchant's PWA spans subdomains via direct in-iframe navigation. The
 *   intentional cost of `__Host-`: a stronger browser-enforced contract
 *   (no Domain branch, no host-vs-domain migration cleanup) at the price
 *   of this niche scenario.
 */
export function tryWriteStorefrontPreviewMarker(req, res) {
    const parentOrigin = detectTrustedPreviewParent(req)
    if (!parentOrigin) return

    // The parent origin is written as the cookie value as-is (e.g.
    // `https://runtime.commercecloud.com`). Browsers and our inline
    // parser round-trip `:` and `/` cleanly without URL-encoding for
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
            partitioned: true
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
    const value = getCookieValue(req.headers?.cookie, STOREFRONT_PREVIEW_CTX_COOKIE)
    if (!value || !isAllowedParentOrigin(value)) return undefined
    return value
}
