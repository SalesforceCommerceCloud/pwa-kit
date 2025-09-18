/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getPromotionIdsForProduct} from '@salesforce/retail-react-app/app/utils/bonus-product/common'

/**
 * Discovery utilities for finding available bonus products.
 *
 * This module handles discovering and calculating what bonus products are available
 * for selection and addition to the cart. It focuses on finding NEW items that can
 * be added, calculating remaining capacity, and determining available discount line items.
 *
 * Functions in this file:
 * - Discovery of available bonus items to add
 * - Calculation of remaining capacity/availability
 * - Finding available discount line item IDs
 * - Determining what bonus products can still be selected
 *
 * Note: This is different from cart.js which deals with existing cart state.
 */

/**
 * Gets all available bonus discount line items that are triggered by a specific product.
 *
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find available bonus items for
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Array<Object>} Array of available bonus discount line items
 */
export const getAvailableBonusItemsForProduct = (basket, productId, productsWithPromotions) => {
    if (!basket || !productId || !productsWithPromotions) {
        return []
    }

    // Get promotion IDs using enhanced product data
    const productPromotionIds = getPromotionIdsForProduct(basket, productId, productsWithPromotions)

    if (productPromotionIds.length === 0) {
        return []
    }

    // Find bonus discount line items that match the promotion IDs
    const matchingDiscountItems =
        basket.bonusDiscountLineItems?.filter((bonusItem) => {
            return productPromotionIds.includes(bonusItem.promotionId)
        }) || []

    // Flatten the bonus products from all matching discount line items
    const availableBonusItems = []
    matchingDiscountItems.forEach((discountItem) => {
        discountItem.bonusProducts?.forEach((bonusProduct) => {
            availableBonusItems.push({
                ...bonusProduct,
                promotionId: discountItem.promotionId,
                discountLineItemId: discountItem.id
            })
        })
    })

    return availableBonusItems
}

/**
 * Gets the remaining available bonus products for a productId by considering quantities already in cart
 * and the maxBonusItems limits. Only returns bonus items with remainingBonusItemsCount > 0.
 * Also includes aggregated statistics for promotion tracking.
 *
 * Uses correct logic:
 * - Available items: aggregated maxBonusItems from bonusDiscountLineItems with same promotionId
 * - Selected items: sum of quantities of bonus products in cart matched by bonusDiscountLineItemId
 *
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find remaining bonus products for
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Object} Object containing bonusItems array and aggregated statistics
 */
export const getRemainingAvailableBonusProductsForProduct = (
    basket,
    productId,
    productsWithPromotions
) => {
    if (!basket || !productId || !productsWithPromotions) {
        return {
            bonusItems: [],
            aggregatedMaxBonusItems: 0,
            aggregatedSelectedItems: 0,
            hasRemainingCapacity: false
        }
    }

    // Get promotion IDs for this product
    const productPromotionIds = getPromotionIdsForProduct(basket, productId, productsWithPromotions)

    if (productPromotionIds.length === 0) {
        return {
            bonusItems: [],
            aggregatedMaxBonusItems: 0,
            aggregatedSelectedItems: 0,
            hasRemainingCapacity: false
        }
    }

    // Find bonus discount line items that match the promotion IDs
    const matchingDiscountItems =
        basket.bonusDiscountLineItems?.filter((bonusItem) => {
            return productPromotionIds.includes(bonusItem.promotionId)
        }) || []

    if (matchingDiscountItems.length === 0) {
        return {
            bonusItems: [],
            aggregatedMaxBonusItems: 0,
            aggregatedSelectedItems: 0,
            hasRemainingCapacity: false
        }
    }

    // Group by promotionId and calculate aggregated stats
    const promotionGroups = {}

    matchingDiscountItems.forEach((discountItem) => {
        const promotionId = discountItem.promotionId

        if (!promotionGroups[promotionId]) {
            promotionGroups[promotionId] = {
                promotionId,
                discountItems: [],
                aggregatedMaxBonusItems: 0,
                aggregatedSelectedItems: 0
            }
        }

        promotionGroups[promotionId].discountItems.push(discountItem)

        // Add maxBonusItems from the discount line item level (not from individual bonus products)
        const discountItemMaxBonusItems = discountItem.maxBonusItems || 0
        promotionGroups[promotionId].aggregatedMaxBonusItems += discountItemMaxBonusItems

        // Sum quantities of bonus products in cart that match this bonusDiscountLineItemId
        const selectedItemsForDiscount =
            basket.productItems?.filter(
                (cartItem) =>
                    cartItem.bonusProductLineItem &&
                    cartItem.bonusDiscountLineItemId === discountItem.id
            ) || []

        const selectedQuantity = selectedItemsForDiscount.reduce(
            (total, cartItem) => total + (cartItem.quantity || 0),
            0
        )

        promotionGroups[promotionId].aggregatedSelectedItems += selectedQuantity
    })

    // Calculate overall aggregated totals across all promotions
    let overallAggregatedMaxBonusItems = 0
    let overallAggregatedSelectedItems = 0

    Object.values(promotionGroups).forEach((group) => {
        overallAggregatedMaxBonusItems += group.aggregatedMaxBonusItems
        overallAggregatedSelectedItems += group.aggregatedSelectedItems
    })

    // Create remaining bonus items for display (flattened from all discount items)
    const remainingBonusItems = []

    matchingDiscountItems.forEach((discountItem) => {
        const discountItemMaxBonusItems = discountItem.maxBonusItems || 0

        // Calculate how many bonus products from this discount item are already in cart
        const selectedQuantityForDiscountItem =
            basket.productItems
                ?.filter(
                    (cartItem) =>
                        cartItem.bonusProductLineItem &&
                        cartItem.bonusDiscountLineItemId === discountItem.id
                )
                .reduce((total, cartItem) => total + (cartItem.quantity || 0), 0) || 0

        const remainingBonusItemsCount = Math.max(
            0,
            discountItemMaxBonusItems - selectedQuantityForDiscountItem
        )

        // If there are remaining slots, add all bonus products from this discount item
        if (remainingBonusItemsCount > 0) {
            discountItem.bonusProducts?.forEach((bonusProduct) => {
                remainingBonusItems.push({
                    ...bonusProduct,
                    promotionId: discountItem.promotionId,
                    bonusDiscountLineItemId: discountItem.id,
                    remainingBonusItemsCount: remainingBonusItemsCount // All products share the same remaining count for this discount item
                })
            })
        }
    })

    return {
        bonusItems: remainingBonusItems,
        aggregatedMaxBonusItems: overallAggregatedMaxBonusItems,
        aggregatedSelectedItems: overallAggregatedSelectedItems,
        hasRemainingCapacity: overallAggregatedSelectedItems < overallAggregatedMaxBonusItems
    }
}

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
