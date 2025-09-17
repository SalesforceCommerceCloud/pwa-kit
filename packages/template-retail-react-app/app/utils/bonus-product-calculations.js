/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Calculation and item management utilities for bonus products.
 * This module handles counting, calculations, and item removal operations.
 */

/**
 * Finds all available bonus discount line item IDs with their available capacity.
 * Returns a list of pairs where each pair contains [bonusDiscountLineItemId, availableQuantity].
 * Only includes pairs where availableQuantity > 0.
 *
 * @param {Object} basket - The current basket data
 * @param {string} promotionId - The promotion ID to match
 * @returns {Array<Array>} Array of pairs [bonusDiscountLineItemId, availableQuantity]
 */
export const findAvailableBonusDiscountLineItemIds = (basket, promotionId) => {
    if (!basket?.bonusDiscountLineItems || !promotionId) {
        return []
    }

    // Find all bonus discount line items with the same promotionId
    const matchingDiscountItems = basket.bonusDiscountLineItems.filter(
        (item) => item.promotionId === promotionId
    )

    if (matchingDiscountItems.length === 0) {
        return []
    }

    const availablePairs = []

    // Check each discount item and calculate available capacity
    for (const discountItem of matchingDiscountItems) {
        const maxBonusItems = discountItem.maxBonusItems || 0

        // Calculate how many bonus products are already in cart for this specific discount item
        const selectedQuantity =
            basket.productItems
                ?.filter(
                    (cartItem) =>
                        cartItem.bonusProductLineItem &&
                        cartItem.bonusDiscountLineItemId === discountItem.id
                )
                .reduce((total, cartItem) => total + (cartItem.quantity || 0), 0) || 0

        const availableQuantity = Math.max(0, maxBonusItems - selectedQuantity)

        // Only include pairs where availableQuantity > 0
        if (availableQuantity > 0) {
            availablePairs.push([discountItem.id, availableQuantity])
        }
    }

    return availablePairs
}

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

/**
 * Finds all bonus product items in the basket that should be removed when a user clicks "Remove"
 * on a specific bonus product. This includes all items with the same productId and from the same promotion,
 * across all bonusDiscountLineItemIds.
 *
 * @param {Object} basket - The current basket data
 * @param {Object} targetBonusProduct - The bonus product item that the user clicked "Remove" on
 * @returns {Array} Array of bonus product items to remove (including the target item)
 */
export const findAllBonusProductItemsToRemove = (basket, targetBonusProduct) => {
    if (!basket?.productItems || !targetBonusProduct || !targetBonusProduct.bonusProductLineItem) {
        return []
    }

    // Find the bonusDiscountLineItem associated with the target product to get the promotionId
    const targetBonusDiscountLineItem = basket.bonusDiscountLineItems?.find(
        (item) => item.id === targetBonusProduct.bonusDiscountLineItemId
    )

    if (!targetBonusDiscountLineItem) {
        // If we can't find the promotion, fall back to removing just this single item
        return [targetBonusProduct]
    }

    const promotionId = targetBonusDiscountLineItem.promotionId
    const productId = targetBonusProduct.productId

    // Find all bonusDiscountLineItemIds for this promotion
    const promotionBonusDiscountLineItemIds = (basket.bonusDiscountLineItems || [])
        .filter((item) => item.promotionId === promotionId)
        .map((item) => item.id)

    // Find all bonus product items with the same productId and from the same promotion
    const itemsToRemove = basket.productItems.filter((item) => {
        return (
            item.bonusProductLineItem &&
            item.productId === productId &&
            promotionBonusDiscountLineItemIds.includes(item.bonusDiscountLineItemId)
        )
    })

    return itemsToRemove
}
