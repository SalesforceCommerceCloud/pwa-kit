/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getPromotionIdsForProduct} from '@salesforce/retail-react-app/app/utils/bonus-product/common'

/**
 * Cart state operations and product relationship utilities for bonus products.
 *
 * This module handles functions that query, inspect, and manipulate existing cart state.
 * It focuses on understanding relationships between products already in the cart,
 * finding qualifying products, and managing cart item operations.
 *
 * Functions in this file:
 * - Cart state queries (what's currently in cart)
 * - Product relationship lookups (which products triggered which bonus items)
 * - Cart item removal operations
 * - Existing cart state inspection
 *
 * Note: This is different from discovery.js which finds NEW items to add to cart.
 */

/**
 * Gets the qualifying product ID(s) for a bonus product from the bonusDiscountLineItems collection.
 * This function matches bonus discount line items with qualifying products in the cart
 * using the promotionId field.
 *
 * @param {Object} basket - The current basket/cart object
 * @param {string} bonusDiscountLineItemId - The ID of the bonus discount line item to find qualifying products for
 * @returns {Array<string>} - Array of qualifying product IDs that triggered this bonus item
 */
export const getQualifyingProductIdForBonusItem = (basket, bonusDiscountLineItemId) => {
    if (!basket?.bonusDiscountLineItems || !basket?.productItems || !bonusDiscountLineItemId) {
        return []
    }

    // Find the specific bonus discount line item
    const bonusDiscountLineItem = basket.bonusDiscountLineItems.find(
        (item) => item.id === bonusDiscountLineItemId
    )

    if (!bonusDiscountLineItem) {
        return []
    }

    const promotionId = bonusDiscountLineItem.promotionId

    // Find all products that have this promotion ID in their price adjustments
    const qualifyingProductIds = []
    basket.productItems.forEach((product) => {
        if (product.priceAdjustments) {
            const hasMatchingPromotion = product.priceAdjustments.some(
                (adjustment) => adjustment.promotionId === promotionId
            )
            if (hasMatchingPromotion) {
                qualifyingProductIds.push(product.productId)
            }
        }
    })

    return qualifyingProductIds
}

/**
 * Gets all bonus products that are already in the cart for a specific product.
 *
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find bonus products for
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Array<Object>} Array of bonus products in cart with aggregated quantities
 */
export const getBonusProductsInCartForProduct = (basket, productId, productsWithPromotions) => {
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

    if (matchingDiscountItems.length === 0) {
        return []
    }

    // Get the discount line item IDs
    const discountLineItemIds = matchingDiscountItems.map((item) => item.id)

    // Find bonus products in cart that match these discount line item IDs
    const bonusProductsInCart =
        basket.productItems?.filter((item) => {
            return (
                item.bonusProductLineItem &&
                discountLineItemIds.includes(item.bonusDiscountLineItemId)
            )
        }) || []

    // Aggregate quantities for products with the same productId
    const productQuantityMap = new Map()
    bonusProductsInCart.forEach((item) => {
        const existingQuantity = productQuantityMap.get(item.productId) || 0
        productQuantityMap.set(item.productId, existingQuantity + (item.quantity || 0))
    })

    // Convert back to array format with aggregated quantities
    const result = []
    productQuantityMap.forEach((quantity, productId) => {
        const sampleItem = bonusProductsInCart.find((item) => item.productId === productId)
        result.push({
            ...sampleItem,
            quantity: quantity
        })
    })

    return result
}

/**
 * Gets the qualifying product ID(s) for a bonus product that's already in the cart.
 *
 * @param {Object} basket - The current basket data
 * @param {string} bonusProductId - The product ID of the bonus product in the cart
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Array<string>} Array of qualifying product IDs that triggered this bonus product
 */
export const getQualifyingProductForBonusProductInCart = (
    basket,
    bonusProductId,
    productsWithPromotions
) => {
    // Validate inputs
    if (!basket?.productItems || !bonusProductId || !productsWithPromotions) {
        return []
    }

    // Find the bonus product in the cart
    const bonusProduct = basket.productItems.find(
        (item) => item.productId === bonusProductId && item.bonusProductLineItem === true
    )

    if (!bonusProduct) {
        return []
    }

    // Get promotion IDs from the bonus product using enhanced data
    const bonusPromotionIds = getPromotionIdsForProduct(
        basket,
        bonusProductId,
        productsWithPromotions
    )

    if (bonusPromotionIds.length === 0) {
        return []
    }

    // Find regular products (not bonus products) that have matching promotion IDs
    const qualifyingProducts = basket.productItems.filter((item) => {
        // Skip if this is a bonus product
        if (item.bonusProductLineItem === true) {
            return false
        }

        // Get promotion IDs for this product using enhanced data
        const productPromotionIds = getPromotionIdsForProduct(
            basket,
            item.productId,
            productsWithPromotions
        )

        return productPromotionIds.some((promotionId) => bonusPromotionIds.includes(promotionId))
    })

    return qualifyingProducts.map((product) => product.productId)
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
