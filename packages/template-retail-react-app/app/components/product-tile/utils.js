/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

// TODO: should this be a component `PromoCallout` instead?
// - partial component
// - customizable only at the component level -> global
export const renderPromoCallout = (variantWithLowestPrice = {}) => {
    const {minPrice, variant} = variantWithLowestPrice
    if (!variant?.productPromotions) {
        return
    }

    const promo =
        variant.productPromotions.find((promo) => promo.promotionalPrice === minPrice) ??
        variant.productPromotions[0]
    // calloutMsg can be html string or just plain text
    return promo.calloutMsg && <div dangerouslySetInnerHTML={{__html: promo.calloutMsg}} />
}
