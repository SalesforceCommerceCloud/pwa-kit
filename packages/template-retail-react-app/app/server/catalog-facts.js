/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Match product tiles: use the lowest returned variant/promotion price, not the list price.
export const overviewPrice = (hit) => {
    const master = hit.hitType === 'master' || hit.type?.master
    const variants = master && hit.variants?.length ? hit.variants : [hit]
    const prices = variants
        .flatMap((variant) => [
            variant.price,
            ...(variant.productPromotions || []).map((promotion) => promotion.promotionalPrice)
        ])
        .filter(Number.isFinite)
    const price = prices.length ? Math.min(...prices) : undefined
    const range = (master && variants.length > 1) || hit.hitType === 'set' || hit.type?.set
    return range && price != null ? `from ${price}` : price
}

export const textOnly = (value, max = 1200) =>
    String(value || '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&#160;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)

export function productFact(product, previous = {}) {
    const image =
        product.image?.link ||
        product.imageGroups?.find((g) => g.images?.length)?.images?.[0]?.link ||
        previous.image
    const attributes = Object.entries(product)
        .filter(([key]) => /material|fabric|care|wash|specification|apparelFeatures/i.test(key))
        .slice(0, 8)
    const fact = {
        ...previous,
        id: String(product.productId || product.id || previous.id),
        name: textOnly(product.productName || product.name || previous.name, 180),
        price: previous.price ?? overviewPrice(product),
        image: typeof image === 'string' && image.startsWith('https://') ? image : undefined
    }
    const description = textOnly(
        [product.shortDescription, product.longDescription].filter(Boolean).join(' '),
        1400
    )
    if (description) fact.description = description
    if (attributes.length)
        fact.attributes = Object.fromEntries(
            attributes.map(([key, value]) => [
                key,
                textOnly(typeof value === 'object' ? JSON.stringify(value) : value, 1800)
            ])
        )
    return fact
}

export const topPicks = (entry) => Array.from(entry.products.values()).slice(0, 3)
