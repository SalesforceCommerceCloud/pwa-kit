/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

export const renderPromoCallout = (product) => {
    // TODO: also test with other product types
    // TODO: find a variant that matches the representedProduct
    const variant = product.variants[0]

    if (!variant.productPromotions) {
        return
    }

    const promo =
        findPromoWithLowestPrice(variant.productPromotions) ??
        variant.productPromotions.find((promo) => promo.calloutMsg)

    // calloutMsg can be html string or just plain text
    return promo.calloutMsg && <div dangerouslySetInnerHTML={{__html: promo.calloutMsg}} />
}

const findPromoWithLowestPrice = (promotions) => {
    return promotions
        .filter((promo) => promo.promotionalPrice)
        .sort((a, b) => a.promotionalPrice - b.promotionalPrice)[0]
}
