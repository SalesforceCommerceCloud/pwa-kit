/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Server-side helpers for the `dw_attribution` first-touch marketing-attribution
 * cookie (W-23493129).
 *
 * CIP (Commerce Intelligence Platform) attributes placed orders back to the
 * marketing campaign that drove the shopper. At order placement ECOM reads
 * attribution server-side and emits `entryRequestURL` + `sessionReferrer`. ECOM
 * writes no cookie of its own — on standard SFRA/SiteGenesis storefronts it reads
 * the ClickStream first-click URL, but headless flows have no ClickStream, so the
 * storefront must write the value into a first-party cookie that rides along to
 * SCAPI on the order call.
 *
 * A cookie (rather than `session.custom` or Shopper Context `customQualifiers`) is
 * used because it is independent of the SLAS USID, which rotates on logout — so
 * attribution survives `login -> logout -> re-login` within a visit.
 *
 * The cookie value is an allowlist only, sanitized at write time, so no raw URLs
 * or PII (emails/tokens that can appear in free-text query params) are ever stored.
 * It is percent-encoded `key=value` pairs joined with `&`, e.g.
 *   utm_source=google&utm_medium=cpc&gclid=abc123&ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews
 * which ECOM URL-decodes on read to `ref = https://blog.com/post?utm_source=news`
 * and emits as `sessionReferrer`.
 */

import {cookieAsString} from '@salesforce/pwa-kit-runtime/utils/ssr-proxying'

export const ATTRIBUTION_COOKIE_NAME = 'dw_attribution'

// The Do Not Track cookie. Mirrors commerce-sdk-react's DNT_COOKIE_NAME
// (packages/commerce-sdk-react/src/constant.ts). A value of '1' means the shopper
// has opted out of tracking.
export const DNT_COOKIE_NAME = 'dw_dnt'

// Attribution params captured from the current (entry/landing) request URL.
// Includes the three major ad-network click IDs — gclid (Google), fbclid (Meta/
// Facebook), msclkid (Microsoft/Bing) — which all arrive as query params on the
// landing URL when a shopper clicks through a paid ad.
export const LANDING_PARAM_ALLOWLIST = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
    'msclkid'
]

// Attribution params captured from the referrer URL. Same set as the landing
// allowlist: the click IDs arrive on the landing URL, but may also appear on an
// external referrer, and none of these params are PII.
export const REFERRER_PARAM_ALLOWLIST = [...LANDING_PARAM_ALLOWLIST]

// Absolute (write-once, not sliding) TTL for the cookie: 30 minutes.
export const ATTRIBUTION_COOKIE_MAX_AGE_SECONDS = 30 * 60

// Cap the serialized cookie value to stay well under the MRT ~5,940-byte response
// header budget (the cookie shares that budget with SLAS/session cookies).
export const MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH = 2000

/**
 * Coerce an Express `req.query` value (string | string[] | undefined) to a single
 * string. Repeated params (`?utm_source=a&utm_source=b`) parse to an array; keep
 * the first occurrence.
 *
 * @param {string|string[]|undefined} value
 * @returns {string|undefined}
 */
function firstValue(value) {
    // Express' `qs` parser can yield arrays (repeated params) or objects (bracket
    // params like `?utm_source[x]=y`). Only accept plain strings; ignore the rest so
    // an object never serializes to junk like `[object Object]`.
    if (Array.isArray(value)) return value.find((v) => typeof v === 'string')
    return typeof value === 'string' ? value : undefined
}

/**
 * Read a cookie value from the incoming request's `Cookie` header.
 *
 * @param {import('express').Request} req
 * @param {string} name cookie name
 * @returns {string|null} the decoded value, or null when absent
 */
export function getCookie(req, name) {
    const header = req?.headers?.cookie
    if (!header) return null
    const match = header
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`))
    if (!match) return null
    try {
        return decodeURIComponent(match.slice(name.length + 1))
    } catch {
        // Malformed percent-encoding — return the raw value rather than throwing.
        return match.slice(name.length + 1)
    }
}

/**
 * Build the sanitized `ref` component from the incoming `Referer` header.
 *
 * Keeps the referrer's origin + path and its own allowlisted attribution params.
 * Drops the referrer's free-text query params, fragment, and any credentials
 * (userinfo), so PII cannot leak into the cookie. Same-origin referrers are
 * dropped — they are internal navigation, not attribution.
 *
 * @param {string|undefined} refererHeader raw `Referer` header value
 * @param {string|undefined} requestHostname hostname of the current request (`req.hostname`)
 * @returns {string} the sanitized referrer URL, or '' when there is nothing to keep
 */
export function buildSanitizedReferrer(refererHeader, requestHostname) {
    if (!refererHeader) return ''

    let url
    try {
        url = new URL(refererHeader)
    } catch {
        // Malformed referrer — ignore it.
        return ''
    }

    // Only http(s) referrers are meaningful for web attribution.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''

    // Same-origin navigation is not attribution; only keep external referrers.
    if (requestHostname && url.hostname === requestHostname) return ''

    // Keep only the referrer's own allowlisted attribution params.
    const refParams = new URLSearchParams()
    for (const key of REFERRER_PARAM_ALLOWLIST) {
        const value = url.searchParams.get(key)
        if (value) refParams.set(key, value)
    }
    const qs = refParams.toString()

    // `url.origin` is protocol + host (+ port) only — it excludes any
    // `user:password@` credentials, and we deliberately omit `url.hash`.
    return `${url.origin}${url.pathname}${qs ? `?${qs}` : ''}`
}

/**
 * Serialize ordered `[key, value]` pairs to percent-encoded `key=value` pairs
 * joined with `&` (the `dw_attribution` cookie value format).
 *
 * @param {Array<[string, string]>} pairs
 * @returns {string}
 */
function serializePairs(pairs) {
    const params = new URLSearchParams()
    // URLSearchParams preserves insertion order, so the serialized order is stable.
    for (const [key, value] of pairs) params.set(key, value)
    return params.toString()
}

/**
 * Build the full `dw_attribution` cookie value from the current request.
 *
 * @param {object} input
 * @param {object} [input.query] Express `req.query` for the current request
 * @param {string} [input.referer] raw `Referer` header value
 * @param {string} [input.requestHostname] `req.hostname` (used to drop same-origin referrers)
 * @returns {string} the cookie value, or '' when there is nothing to attribute
 */
export function buildAttributionValue({query = {}, referer, requestHostname} = {}) {
    // Landing params first, in allowlist order; then the sanitized referrer.
    const pairs = []
    for (const key of LANDING_PARAM_ALLOWLIST) {
        const value = firstValue(query[key])
        if (value) pairs.push([key, value])
    }
    const ref = buildSanitizedReferrer(referer, requestHostname)
    if (ref) pairs.push(['ref', ref])

    let value = serializePairs(pairs)
    if (value.length <= MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH) return value

    // Over budget. Drop `ref` first — it is the longest component and the current
    // URL's own params are the primary attribution signal.
    let trimmed = pairs.filter(([key]) => key !== 'ref')
    value = serializePairs(trimmed)

    // Still over budget (a pathologically long param value): drop the
    // least-critical trailing params until it fits.
    while (value.length > MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH && trimmed.length > 0) {
        trimmed = trimmed.slice(0, -1)
        value = serializePairs(trimmed)
    }
    return value
}

/**
 * Build an Express middleware that writes the first-touch `dw_attribution` cookie
 * on the SSR render path.
 *
 * Behaviour (all guards fail open — attribution must never break a shopper request):
 *  - No-op unless the runtime allows cookies (`req.app.options.allowCookies`, driven
 *    by `MRT_ALLOW_COOKIES` remotely / `localAllowCookies` locally). When cookies are
 *    disabled the runtime silently discards `Set-Cookie`, so writing one — and, worse,
 *    forcing `Cache-Control: no-store` — would only cost us caching with no benefit.
 *  - Write-once (first touch wins): skips when the cookie is already present.
 *  - Honours Do Not Track: skips when the `dw_dnt` cookie is `1`.
 *  - Skips when there is nothing to attribute, so ordinary (non-campaign) traffic is
 *    left untouched and fully cacheable.
 *  - When it does write, it forces `Cache-Control: no-store` at header-flush time
 *    (see `forceNoStore`): a cached SSR response retains its `Set-Cookie`, so a
 *    per-visit cookie on a cacheable response would be replayed to other shoppers.
 *
 * The cookie is HttpOnly + Secure + SameSite=Lax with a 30-minute absolute TTL. Lax
 * (not Strict) lets the cookie ride along on the top-level cross-site navigation from
 * the ad/referrer that is the whole point of attribution.
 *
 * @param {object} [options]
 * @param {string} [options.cookieDomain] value for the cookie's `Domain` attribute
 *   (from `config.app.commerceAPI.cookieDomain`); when unset the cookie is host-scoped
 * @param {{warn: Function}} [options.logger] logger for the fail-open path; defaults to `console`
 * @returns {import('express').RequestHandler}
 */
/**
 * Force `Cache-Control: no-store` to win for the rest of this response's lifecycle.
 *
 * A response that carries a per-visit `Set-Cookie` must never be shared-cached — a
 * cached SSR response retains its `Set-Cookie` array and the CDN would replay this
 * shopper's attribution cookie to everyone else on that cache key. Simply setting the
 * header here is not enough: this middleware runs *before* `runtime.render`, and the
 * home/PLP/PDP page components set a cacheable `s-maxage` via `useServerContext()`
 * during render (which runs after us), overwriting whatever we set up front.
 *
 * So we intercept `res.setHeader` and coerce any later `Cache-Control` write to
 * `no-store` (Express `res.set`/`res.header` both route through `setHeader`). This
 * mirrors the runtime's own `res.setHeader` interception in `prepNonProxyRequest`.
 *
 * @param {import('express').Response} res
 */
function forceNoStore(res) {
    const setHeader = res.setHeader.bind(res)
    res.setHeader = function (name, value) {
        if (typeof name === 'string' && name.toLowerCase() === 'cache-control') {
            return setHeader('Cache-Control', 'no-store')
        }
        return setHeader(name, value)
    }
    res.setHeader('Cache-Control', 'no-store')
}

export function createAttributionCookieMiddleware({cookieDomain, logger = console} = {}) {
    return function attributionCookieMiddleware(req, res, next) {
        try {
            // The runtime discards Set-Cookie unless cookies are allowed for this
            // deployment; do nothing (and don't disturb caching) when they are not.
            if (!req?.app?.options?.allowCookies) return next()

            // First touch wins — never overwrite an existing attribution cookie.
            if (getCookie(req, ATTRIBUTION_COOKIE_NAME) != null) return next()

            // Respect Do Not Track.
            if (getCookie(req, DNT_COOKIE_NAME) === '1') return next()

            const referer =
                (typeof req.get === 'function' ? req.get('referer') : undefined) ||
                req?.headers?.referer

            const value = buildAttributionValue({
                query: req.query,
                referer,
                requestHostname: req.hostname
            })

            // Nothing to attribute: leave the response untouched (stays cacheable).
            if (!value) return next()

            const cookie = cookieAsString({
                name: ATTRIBUTION_COOKIE_NAME,
                // `value` is already a safe set of percent-encoded `key=value` pairs
                // joined with `&` — store it verbatim so ECOM reads the agreed format.
                value,
                path: '/',
                maxAge: ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
                domain: cookieDomain || undefined,
                secure: true,
                httpOnly: true,
                sameSite: 'Lax'
            })

            // A response that writes a per-visit cookie must not be shared-cached.
            // Install the enforcement BEFORE appending the cookie so the "per-visit
            // cookie => no-store" coupling is atomic: if anything below threw, we'd fail
            // toward "not cached" rather than "cached with a cookie". forceNoStore also
            // beats the cacheable Cache-Control the page component sets later during
            // render (see forceNoStore).
            forceNoStore(res)

            // Append (do not clobber) so we sit alongside any SLAS/session cookies.
            res.append('Set-Cookie', cookie)
        } catch (e) {
            // Attribution is best-effort; never let it break a shopper request.
            logger?.warn?.(`dw_attribution: skipping cookie write due to error: ${e?.message}`)
        }
        return next()
    }
}
