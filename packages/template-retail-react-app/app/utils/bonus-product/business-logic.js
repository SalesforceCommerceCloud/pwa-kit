/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    isProductEligibleForBonusProducts,
    isProductAvailableAsBonus,
    getPromotionIdsForProduct
} from '@salesforce/retail-react-app/app/utils/bonus-product/common'

/**
 * High-level business logic for bonus products.
 *
 * This module contains complex business rules that orchestrate multiple utility functions
 * to make high-level decisions about bonus product behavior. These functions implement
 * the core business logic by combining multiple lower-level utilities.
 *
 * Functions in this file:
 * - Complex eligibility rules
 * - Business decision logic
 * - Multi-criteria evaluations
 * - UI behavior determination
 */

/**
 * Detects if a bonus discount line item is rule-based.
 * Rule-based promotions have empty bonusProducts arrays - products are
 * determined by dynamic rules and must be fetched via SCAPI product search.
 *
 * Examples of rule-based promotions:
 * - "Get choice of bonus where brand = 'Sony'"
 * - "Get choice of bonus where price < $50"
 * - "Get choice of bonus from 'Electronics' category"
 *
 * @param {Object} bonusDiscountLineItem - A single bonus discount line item from basket
 * @returns {boolean} True if rule-based (empty bonusProducts array), false if list-based
 *
 * @example
 * // Rule-based promotion (dynamic rules)
 * const ruleBasedItem = {
 *   promotionId: 'promo-123',
 *   bonusProducts: []  // Empty array indicates rule-based
 * }
 * isRuleBasedPromotion(ruleBasedItem) // true
 *
 * @example
 * // List-based promotion (static product list)
 * const listBasedItem = {
 *   promotionId: 'promo-456',
 *   bonusProducts: [
 *     { productId: 'p1', productName: 'Product 1' },
 *     { productId: 'p2', productName: 'Product 2' }
 *   ]
 * }
 * isRuleBasedPromotion(listBasedItem) // false
 */
export const isRuleBasedPromotion = (bonusDiscountLineItem) => {
    if (!bonusDiscountLineItem) {
        return false
    }

    // Rule-based indicator: has a valid promotionId AND bonusProducts array is empty or doesn't exist
    const hasPromotionId = Boolean(bonusDiscountLineItem.promotionId)
    const bonusProducts = bonusDiscountLineItem.bonusProducts || []
    const hasEmptyBonusProducts = bonusProducts.length === 0

    return hasPromotionId && hasEmptyBonusProducts
}

/**
 * Determines if a product's promotions are automatic (no choice) or manual (choice of bonus products).
 * Automatic promotions add bonus products directly to cart without user selection.
 * Choice promotions allow users to select which bonus products they want.
 *
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to check
 * @param {Object} productsWithPromotions - Object mapping productId to product data with promotions
 * @param {Object} [ruleBasedQualifyingProductsMap={}] - Map of promotionId to Set of qualifying productIds for rule-based promotions
 * @returns {boolean} True if product has automatic promotions only
 */
export const isAutomaticPromotion = (
    basket,
    productId,
    productsWithPromotions,
    ruleBasedQualifyingProductsMap = {}
) => {
    if (!basket || !productId || !productsWithPromotions) {
        return false
    }

    // Get promotion IDs for this product
    const promotionIds = getPromotionIdsForProduct(
        basket,
        productId,
        productsWithPromotions,
        ruleBasedQualifyingProductsMap
    )

    if (promotionIds.length === 0) {
        return false
    }

    // Check if ANY of this product's promotions have bonusDiscountLineItems (choice promotions)
    const hasChoicePromotions =
        basket.bonusDiscountLineItems?.some((item) => promotionIds.includes(item.promotionId)) ||
        false

    // Automatic if no choice promotions found
    return !hasChoicePromotions
}

/**
 * Enhanced check if a product should show bonus product selection.
 * A product is eligible if:
 * 1. It has promotions that can trigger bonus products
 * 2. It is NOT itself available as a bonus product in the current basket
 * 3. It is NOT an automatic promotion (which doesn't need selection UI)
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to check
 * @param {Object} productsWithPromotions - Object mapping productId to product data with promotions
 * @param {Object} [ruleBasedQualifyingProductsMap={}] - Map of promotionId to Set of qualifying productIds for rule-based promotions
 * @returns {boolean} Whether the product should show bonus product selection
 */
export const shouldShowBonusProductSelection = (
    basket,
    productId,
    productsWithPromotions,
    ruleBasedQualifyingProductsMap = {}
) => {
    // First check if the product is eligible for bonus products
    const isEligible = isProductEligibleForBonusProducts(productId, productsWithPromotions)
    if (!isEligible) {
        return false
    }

    // Then check if this product is itself available as a bonus product
    // If it is, it shouldn't show bonus product selection when added as a regular item
    const isAvailableAsBonus = isProductAvailableAsBonus(basket, productId)
    if (isAvailableAsBonus) {
        return false
    }

    // Finally check if this is an automatic promotion
    // Automatic promotions don't need selection UI since products are added automatically
    const isAutomatic = isAutomaticPromotion(
        basket,
        productId,
        productsWithPromotions,
        ruleBasedQualifyingProductsMap
    )
    if (isAutomatic) {
        return false
    }

    return true
}
