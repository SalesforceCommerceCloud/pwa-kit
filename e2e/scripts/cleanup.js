/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const config = require('../config.js')

// commerce-sdk-react stores tokens in localStorage with the siteId as suffix:
// e.g. `access_token_RefArch`, `customer_id_RefArch`. Match by prefix so the
// helper works regardless of the active siteId.
//
// NOTE: When SLAS tokens migrate from localStorage to httpOnly cookies, this
// helper will silently no-op (no access_token/customer_id in localStorage →
// readSession returns null → cleanup skips). Follow-up: switch to reading
// the session from cookies, or call cookie-authed /mobify/slas/private/*
// endpoints. Tracked separately from this PR.
const readSession = (page) =>
    page.evaluate(() => {
        const entries = Object.entries(window.localStorage)
        const accessToken = entries.find(([k]) => k.startsWith('access_token'))?.[1]
        const customerId = entries.find(([k]) => k.startsWith('customer_id'))?.[1]
        return accessToken && customerId ? {accessToken, customerId} : null
    })

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
 * Reads the session from localStorage and calls SCAPI directly via the
 * storefront's /mobify/proxy/api path, so cookies/SLAS auth match the test
 * browser's existing session.
 *
 * Always best-effort: a missing session, a failed call, or a missing
 * wishlist must never fail the test that just ran.
 */
async function clearCartAndWishlist(page) {
    const session = await safeRequest('readSession', () => readSession(page))
    if (!session) return

    const baseUrl = `${config.RETAIL_APP_HOME}/mobify/proxy/api`
    const siteId = config.RETAIL_APP_HOME_SITE
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
