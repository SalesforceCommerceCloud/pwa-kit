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
 * This function handles both list-based and rule-based bonus product promotions:
 * - List-based: Uses priceAdjustments on cart items to verify eligibility
 * - Rule-based: Uses ruleBasedQualifyingProductsMap to check if variant qualifies
 *
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find promotion IDs for
 * @param {Object} productsWithPromotions - Products data fetched with promotion info
 * @param {Object} [ruleBasedQualifyingProductsMap={}] - Map of promotionId -> Set of qualifying productIds for rule-based promotions
 * @returns {Array<string>} Array of promotion IDs that this product actually qualifies for
 */
export const getPromotionIdsForProduct = (
    basket,
    productId,
    productsWithPromotions,
    ruleBasedQualifyingProductsMap = {}
) => {
    if (!basket || !productId || !productsWithPromotions) {
        return []
    }

    // Get potential promotion IDs from the enhanced product data (using productPromotions)
    const productWithPromotions = productsWithPromotions[productId]
    if (!productWithPromotions?.productPromotions) {
        return []
    }

    const potentialPromotionIds = productWithPromotions.productPromotions
        .map((promotion) => promotion.promotionId)
        .filter((id) => id != null)

    // Filter promotion IDs based on actual eligibility
    return potentialPromotionIds.filter((promotionId) => {
        // Find the bonus discount line item for this promotion
        const bonusDiscountItem = basket.bonusDiscountLineItems?.find(
            (item) => item.promotionId === promotionId
        )

        if (!bonusDiscountItem) {
            return false
        }

        // Determine if this is a rule-based promotion (empty bonusProducts array)
        const isRuleBased =
            !bonusDiscountItem.bonusProducts || bonusDiscountItem.bonusProducts.length === 0

        if (isRuleBased) {
            // For rule-based promotions: Check if this productId is in the qualifying products set
            const qualifyingProductIds = ruleBasedQualifyingProductsMap[promotionId]

            if (qualifyingProductIds) {
                // First, check if the variant ID itself qualifies
                let qualifies = qualifyingProductIds.has(productId)

                // If not, check if the master product qualifies (fallback for variants)
                if (!qualifies && productWithPromotions) {
                    const masterProductId = productWithPromotions.master?.masterId

                    if (masterProductId && masterProductId !== productId) {
                        qualifies = qualifyingProductIds.has(masterProductId)
                    }
                }

                return qualifies
            }
            // If we don't have qualifying products data yet, return false to be safe
            return false
        } else {
            // For list-based promotions: Check if cart item has priceAdjustment with this promotionId
            const cartItem = basket.productItems?.find((item) => item.productId === productId)
            if (cartItem?.priceAdjustments) {
                return cartItem.priceAdjustments.some((adj) => adj.promotionId === promotionId)
            }
            // If no priceAdjustments, assume it qualifies (backward compatibility)
            return true
        }
    })
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
