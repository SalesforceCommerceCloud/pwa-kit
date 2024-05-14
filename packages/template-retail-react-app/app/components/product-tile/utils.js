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
export const renderPromoCallout = ({activeVariants}) => {
    // TODO: also test with other product types

    const promos = activeVariants.map((variant) => {
        if (!variant.productPromotions) {
            return
        }

        return (
            findPromoWithLowestPrice(variant.productPromotions) ??
            variant.productPromotions.find((promo) => promo.calloutMsg)
        )
    })
    const promo = promos.sort((a, b) => (a?.promotionalPrice ?? 0) - (b?.promotionalPrice ?? 0))[0]

    // calloutMsg can be html string or just plain text
    return promo?.calloutMsg && <div dangerouslySetInnerHTML={{__html: promo.calloutMsg}} />
}

// TODO: any other helpers to export? devs can override renderPromoCallout but they may still want to reuse our helpers.
export const findPromoWithLowestPrice = (promotions) => {
    return promotions
        .filter((promo) => promo.promotionalPrice)
        .sort((a, b) => a.promotionalPrice - b.promotionalPrice)[0]
}
