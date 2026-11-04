/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Thresholds are merchant configuration, not inferred promotion eligibility.
export function getFreeShippingNudge(basket, config, locale = 'en-US') {
    if (config?.enabled !== true && config?.enabled !== 'true') return null
    if (!basket?.basketId || !basket.productItems?.length || basket.currency !== config.currency) {
        return null
    }
    const {threshold, maxGap = threshold, priceBuffer = 5} = config
    const total = basket.productTotal
    if (![threshold, maxGap, priceBuffer, total].every(Number.isFinite)) return null
    if (threshold <= 0 || total <= 0 || maxGap <= 0 || priceBuffer < 0) return null
    // Do not offer a shipping incentive when a selected method is already free.
    if (basket.shippingTotal === 0 && basket.shipments?.some((s) => s.shippingMethod)) return null

    let money
    try {
        money = new Intl.NumberFormat(locale, {style: 'currency', currency: basket.currency})
    } catch {
        return null
    }
    const scale = 10 ** money.resolvedOptions().maximumFractionDigits
    const gapMinor = Math.round(threshold * scale) - Math.round(total * scale)
    if (gapMinor <= 0 || gapMinor > Math.round(maxGap * scale)) return null
    const minPrice = gapMinor / scale
    const maxPrice = (gapMinor + Math.round(priceBuffer * scale)) / scale
    const products = basket.productItems.slice(0, 5).map((item) => ({
        id: item.productId,
        name: item.productName || item.itemText || item.productId,
        quantity: item.quantity
    }))
    const productName = products[0]?.name || 'the items in your cart'
    return {
        key: `${basket.basketId}:${basket.currency}:${Math.round(total * scale)}:${Math.round(
            threshold * scale
        )}`,
        gap: money.format(minPrice),
        productName,
        minPrice,
        maxPrice,
        query:
            `Find complementary products to go with the items in my storefront cart: ${JSON.stringify(
                products
            )}. ` +
            `Look for in-stock add-ons priced between ${money.format(minPrice)} and ${money.format(
                maxPrice
            )} (${basket.currency}). ` +
            `My merchandise total is ${money.format(
                total
            )} and this storefront's configured free-shipping target is ${money.format(
                threshold
            )}. ` +
            'Show actual products and prices from the catalog. Check shipping eligibility before claiming an item unlocks free shipping.'
    }
}

export async function openFreeShippingSearch(query) {
    const sdk = window.CimulateMessaging
    const send = typeof sdk?.sendMessage === 'function' ? sdk : sdk?.eventHandlers?.session
    const components = sdk?.eventHandlers?.components
    if (
        typeof send?.sendMessage !== 'function' ||
        typeof components?.toggleWidgetOpen !== 'function'
    ) {
        throw new Error('The shopping agent is not ready to search.')
    }
    // The widget queues the message until it is connected and its greeting arrives.
    components.toggleWidgetOpen(true)
    const result = await send.sendMessage(query)
    if (result?.outcome === 'failure')
        throw new Error('The shopping agent could not send the search.')
    return result
}
