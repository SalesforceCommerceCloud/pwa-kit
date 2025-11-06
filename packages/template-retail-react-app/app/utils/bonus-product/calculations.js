/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Mathematical calculations and counting operations for bonus products.
 *
 * This module contains pure mathematical operations and numerical calculations
 * related to bonus products. These functions perform counting, arithmetic,
 * and statistical calculations without side effects.
 *
 * Functions in this file:
 * - Numerical counting operations
 * - Mathematical calculations
 * - Statistical computations
 * - Pure arithmetic functions
 */

/**
 * Calculate bonus product counts for a specific promotion from basket data.
 *
 * @param {Object} basket - The current basket/cart object
 * @param {string} promotionId - The promotion ID to calculate counts for
 * @returns {Object} Object with selectedBonusItems and maxBonusItems counts
 */
export const getBonusProductCountsForPromotion = (basket, promotionId) => {
    if (!basket || !promotionId) {
        return {selectedBonusItems: 0, maxBonusItems: 0}
    }

    // Find all bonus discount line items for this promotion
    const promotionBonusItems =
        basket.bonusDiscountLineItems?.filter((item) => item.promotionId === promotionId) || []

    // Sum up max items for this promotion
    const maxBonusItems = promotionBonusItems.reduce(
        (sum, item) => sum + (item.maxBonusItems || 0),
        0
    )

    // Count selected items for this promotion (all bonus items with this promotion's bonusDiscountLineItemIds)
    const promotionBonusLineItemIds = promotionBonusItems.map((item) => item.id).filter(Boolean)

    const selectedBonusItems = (basket.productItems || [])
        .filter(
            (item) =>
                item.bonusProductLineItem &&
                promotionBonusLineItemIds.includes(item.bonusDiscountLineItemId)
        )
        .reduce((sum, item) => sum + (item.quantity || 0), 0)

    return {selectedBonusItems, maxBonusItems}
}
