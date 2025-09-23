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
 * @param {Object} basket - The current basket object
 * @param {Object} product - The product object
 * @param {Function} getRemainingAvailableBonusProductsForProduct - The utility function to get remaining bonus data
 * @returns {Function} - Function that returns remaining bonus quantity or null
 */
export const createGetRemainingBonusQuantity = (
    basket,
    product,
    getRemainingAvailableBonusProductsForProduct
) => {
    return () => {
        if (basket && product) {
            const bonusData = getRemainingAvailableBonusProductsForProduct(basket, product.id, {
                [product.id]: product
            })
            // Return remaining capacity: total allowed - already in cart
            return bonusData.aggregatedMaxBonusItems - bonusData.aggregatedSelectedItems
        }
        return null
    }
}

/**
 * Checks if there are remaining bonus products available in the basket.
 * This function examines the bonus discount line items to see if any still have capacity.
 *
 * @param {Object} updatedBasket - The updated basket object after adding items
 * @returns {boolean} - True if there are remaining bonus products available, false otherwise
 */
export const checkForRemainingBonusProducts = (updatedBasket) => {
    if (!updatedBasket?.bonusDiscountLineItems) {
        return false
    }

    // Check if any bonus discount line items still have available capacity
    return updatedBasket.bonusDiscountLineItems.some((discountItem) => {
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
