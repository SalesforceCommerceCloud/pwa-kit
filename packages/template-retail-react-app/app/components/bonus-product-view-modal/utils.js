/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Utility functions for the BonusProductViewModal component.
 * These functions handle bonus product quantity calculations and validation logic.
 */

/**
 * Creates a function to get the remaining bonus quantity for a specific product.
 * This is a factory function that creates the getRemainingBonusQuantity function with the necessary dependencies.
 *
 * For rule-based promotions, we use the promotionId directly from the basket to calculate remaining capacity.
 * This avoids issues with productSearch data that doesn't have productPromotions.
 *
 * @param {Object} basket - The current basket object
 * @param {Object} product - The product object
 * @param {Function} getRemainingAvailableBonusProductsForProduct - The utility function to get remaining bonus data
 * @param {string} promotionId - The promotion ID for this bonus product
 * @returns {Function} - Function that returns remaining bonus quantity or null
 */
export const createGetRemainingBonusQuantity = (
    basket,
    product,
    getRemainingAvailableBonusProductsForProduct,
    promotionId
) => {
    return () => {
        if (!basket || !product) {
            return null
        }

        // If we have a promotionId, use it directly to calculate remaining capacity
        // This works for both list-based and rule-based promotions
        // IMPORTANT: Sum up ALL bonusDiscountLineItems with this promotionId (one per qualifying product)
        if (promotionId && basket.bonusDiscountLineItems) {
            // Find all bonus discount line items for this promotion
            const promotionBonusItems = basket.bonusDiscountLineItems.filter(
                (item) => item.promotionId === promotionId
            )

            if (promotionBonusItems.length > 0) {
                // Sum up max items for this promotion (e.g., 3 qualifying products × 2 bonus each = 6 total)
                const maxBonusItems = promotionBonusItems.reduce(
                    (sum, item) => sum + (item.maxBonusItems || 0),
                    0
                )

                // Get IDs of all bonus discount line items for this promotion
                const promotionBonusLineItemIds = promotionBonusItems
                    .map((item) => item.id)
                    .filter(Boolean)

                // Count selected items for this promotion (all bonus items with this promotion's bonusDiscountLineItemIds)
                const selectedQuantity =
                    basket.productItems
                        ?.filter(
                            (cartItem) =>
                                cartItem.bonusProductLineItem &&
                                promotionBonusLineItemIds.includes(cartItem.bonusDiscountLineItemId)
                        )
                        .reduce((total, cartItem) => total + (cartItem.quantity || 0), 0) || 0

                return Math.max(0, maxBonusItems - selectedQuantity)
            }
        }

        // Fallback: use the discovery function (for legacy/list-based without promotionId)
        const bonusData = getRemainingAvailableBonusProductsForProduct(basket, product.id, {
            [product.id]: product
        })

        return Math.max(0, bonusData.aggregatedMaxBonusItems - bonusData.aggregatedSelectedItems)
    }
}

/**
 * Checks if there are remaining bonus products available in the basket.
 * This function examines the bonus discount line items to see if any still have capacity.
 *
 * @param {Object} updatedBasket - The updated basket object after adding items
 * @param {string} promotionId - Optional promotion ID to check only bonusDiscountLineItems for a specific promotion
 * @returns {boolean} - True if there are remaining bonus products available, false otherwise
 */
export const checkForRemainingBonusProducts = (updatedBasket, promotionId) => {
    if (!updatedBasket?.bonusDiscountLineItems) {
        return false
    }

    // Filter bonus discount line items by promotionId if provided
    const bonusItemsToCheck = promotionId
        ? updatedBasket.bonusDiscountLineItems.filter((item) => item.promotionId === promotionId)
        : updatedBasket.bonusDiscountLineItems

    // Check if any bonus discount line items still have available capacity
    return bonusItemsToCheck.some((discountItem) => {
        const maxBonusItems = discountItem.maxBonusItems || 0

        // Calculate how many bonus products are already in cart for this specific discount item
        const selectedQuantity =
            updatedBasket.productItems
                ?.filter(
                    (cartItem) =>
                        cartItem.bonusProductLineItem &&
                        cartItem.bonusDiscountLineItemId === discountItem.id
                )
                .reduce((total, cartItem) => total + (cartItem.quantity || 0), 0) || 0

        // Return true if there's still capacity available
        return selectedQuantity < maxBonusItems
    })
}
