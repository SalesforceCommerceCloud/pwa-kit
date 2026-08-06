/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const config = require('../config.js')

const SITE_ID = config.RETAIL_APP_HOME_SITE

// The cleanup helper authenticates SCAPI calls with the active shopper session.
// Where that session lives depends on whether the target environment has
// HttpOnly session cookies enabled (MRT_ENABLE_HTTPONLY_SESSION_COOKIES):
//
//   - HttpOnly OFF (legacy): commerce-sdk-react keeps the tokens in
//     localStorage, suffixed by siteId (e.g. `access_token_RefArch`).
//   - HttpOnly ON: the access token moves into the `cc-at_<siteId>` cookie and
//     `customer_id` into the `customer_id_<siteId>` cookie; both are stripped
//     from the SLAS response body, so localStorage no longer carries them.
//
// readSession is dual-mode: prefer cookies, fall back to localStorage. The
// `cc-at` cookie only exists when HttpOnly is enabled, so legacy environments
// cleanly fall through to the localStorage path. This keeps cleanup working in
// both modes, and no change is needed when HttpOnly becomes the default.
//
// Note: `cc-at_<siteId>` is HttpOnly, so page JS (`document.cookie`) can't read
// it — but `page.context().cookies()` reads the browser cookie store over the
// DevTools protocol, which is not gated by the HttpOnly flag.
const readSessionFromCookies = async (page) => {
    const cookies = await page.context().cookies()
    const valueOf = (name) => cookies.find((c) => c.name === name)?.value
    // Names mirror pwa-kit-runtime SESSION_COOKIE_CONFIG (`${key}_${siteId}`).
    // Exact match avoids matching the `cc-at-expires_`/`cc-at-dnt_` siblings.
    const accessToken = valueOf(`cc-at_${SITE_ID}`)
    const customerId = valueOf(`customer_id_${SITE_ID}`)
    // `cc-at-expires` is the JWT `exp` (epoch seconds, non-HttpOnly). Skip a
    // present-but-expired access token so we don't fire a doomed SCAPI 401 that
    // safeRequest would swallow into a silent no-op. A missing/unparseable
    // expiry cookie is treated as not-expired (best-effort, don't block).
    const expiresAt = Number(valueOf(`cc-at-expires_${SITE_ID}`))
    const expired = Number.isFinite(expiresAt) && expiresAt * 1000 < Date.now()
    return accessToken && customerId && !expired ? {accessToken, customerId} : null
}

// Match by prefix so the helper works regardless of the active siteId.
const readSessionFromLocalStorage = (page) =>
    page.evaluate(() => {
        const entries = Object.entries(window.localStorage)
        const accessToken = entries.find(([k]) => k.startsWith('access_token_'))?.[1]
        const customerId = entries.find(([k]) => k.startsWith('customer_id_'))?.[1]
        return accessToken && customerId ? {accessToken, customerId} : null
    })

const readSession = async (page) =>
    (await readSessionFromCookies(page)) ?? (await readSessionFromLocalStorage(page))

const safeRequest = async (label, fn) => {
    try {
        return await fn()
    } catch (error) {
        console.warn(`[e2e cleanup] ${label} failed: ${error.message}`)
        return null
    }
}

/**
 * Empty the active basket and wishlist for the currently logged-in shopper.
 * Reads the session (HttpOnly cookies or localStorage — see readSession) and
 * calls SCAPI directly via the storefront's /mobify/proxy/api path, so
 * cookies/SLAS auth match the test browser's existing session.
 *
 * Always best-effort: a missing session, a failed call, or a missing
 * wishlist must never fail the test that just ran.
 */
async function clearCartAndWishlist(page) {
    const session = await safeRequest('readSession', () => readSession(page))
    if (!session) return

    const baseUrl = `${config.RETAIL_APP_HOME}/mobify/proxy/api`
    const siteId = SITE_ID
    const orgId = config.RETAIL_APP_HOME_ORGANIZATION_ID
    const headers = {Authorization: `Bearer ${session.accessToken}`}

    // 1. Active baskets -> delete
    // shopper-baskets has no list endpoint, so list via shopper-customers
    // (works for guest and registered customers since SLAS issues a
    // customer_id for both).
    const basketsRes = await safeRequest('GET customer baskets', () =>
        page.request.get(
            `${baseUrl}/customer/shopper-customers/v1/organizations/${orgId}/customers/${session.customerId}/baskets?siteId=${siteId}`,
            {headers}
        )
    )
    if (basketsRes?.ok()) {
        const body = await safeRequest('parse customer baskets', () => basketsRes.json())
        const basketIds = (body?.baskets ?? []).map((b) => b?.basketId).filter(Boolean)
        await Promise.all(
            basketIds.map((basketId) =>
                safeRequest(`DELETE basket ${basketId}`, () =>
                    page.request.delete(
                        `${baseUrl}/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}?siteId=${siteId}`,
                        {headers}
                    )
                )
            )
        )
    }

    // 2. Wishlist items -> delete each
    const listsRes = await safeRequest('GET customer-product-lists', () =>
        page.request.get(
            `${baseUrl}/customer/shopper-customers/v1/organizations/${orgId}/customers/${session.customerId}/customer-product-lists?siteId=${siteId}`,
            {headers}
        )
    )
    if (!listsRes?.ok()) return
    const body = await safeRequest('parse customer-product-lists', () => listsRes.json())
    const wishlist = body?.data?.find((l) => l.type === 'wish_list')
    const items = wishlist?.customerProductListItems
    if (!items?.length) return

    await Promise.all(
        items.map((item) =>
            safeRequest(`DELETE wishlist item ${item.id}`, () =>
                page.request.delete(
                    `${baseUrl}/customer/shopper-customers/v1/organizations/${orgId}/customers/${session.customerId}/customer-product-lists/${wishlist.id}/items/${item.id}?siteId=${siteId}`,
                    {headers}
                )
            )
        )
    )
}

module.exports = {clearCartAndWishlist}
