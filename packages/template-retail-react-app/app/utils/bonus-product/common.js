/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Core utilities for bonus products.
 *
 * This module contains foundational utility functions that are used across other bonus product modules.
 * These are pure functions that handle core operations like text processing, product eligibility checks,
 * and promotion data extraction. Other bonus product modules depend on these utilities.
 *
 * Functions in this file:
 * - Text processing (callout messages)
 * - Core product eligibility logic
 * - Promotion ID extraction
 * - Basic product availability checks
 */

/**
 * Helper function to get promotion callout message as plain text.
 * Strips HTML tags from the promotion callout message.
 *
 * @param {Object} product - Product object with productPromotions array
 * @param {string} promotionId - The promotion ID to find the callout text for
 * @returns {string} Plain text promotion callout message
 */
export const getPromotionCalloutText = (product, promotionId) => {
    if (!product?.productPromotions || !promotionId) return ''

    const promo = product.productPromotions.find((p) => p.promotionId === promotionId)
    if (!promo?.calloutMsg) return ''

    // Strip HTML tags and return plain text
    return promo.calloutMsg.replace(/<[^>]*>/g, '')
}

/**
 * Gets promotion IDs for a product from enhanced product promotion data.
 *
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find promotion IDs for
 * @param {Object} productsWithPromotions - Products data fetched with promotion info
 * @returns {Array<string>} Array of promotion IDs for the product
 */
export const getPromotionIdsForProduct = (basket, productId, productsWithPromotions) => {
    if (!basket || !productId || !productsWithPromotions) {
        return []
    }

    // Get promotion IDs from the enhanced product data (using productPromotions)
    const productWithPromotions = productsWithPromotions[productId]
    if (productWithPromotions?.productPromotions) {
        const promotionIds = productWithPromotions.productPromotions
            .map((promotion) => promotion.promotionId)
            .filter((id) => id != null)

        return promotionIds
    }

    // If no enhanced product data is available, return empty array
    return []
}

/**
 * Check if a product is available as a bonus product in any of the basket's bonus discount line items
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to check
 * @returns {boolean} Whether the product is available as a bonus product
 */
export const isProductAvailableAsBonus = (basket, productId) => {
    if (!basket?.bonusDiscountLineItems || !productId) {
        return false
    }

    return basket.bonusDiscountLineItems.some((discountItem) =>
        discountItem.bonusProducts?.some((bonusProduct) => bonusProduct.productId === productId)
    )
}

/**
 * Check if a product is eligible for bonus products based on its promotions
 * @param {string} productId - The product ID to check
 * @param {Object} productsWithPromotions - Object mapping productId to product data with promotions
 * @returns {boolean} Whether the product is eligible for bonus products
 */
export const isProductEligibleForBonusProducts = (productId, productsWithPromotions) => {
    if (!productId || !productsWithPromotions) {
        return false
    }

    const productWithPromotions = productsWithPromotions[productId]
    if (!productWithPromotions?.productPromotions) {
        return false
    }

    // Check if any of the product's promotions exist in the system
    // This indicates the product could potentially trigger bonus products
    return productWithPromotions.productPromotions.length > 0
}
