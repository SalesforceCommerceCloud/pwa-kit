/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    isProductEligibleForBonusProducts,
    isProductAvailableAsBonus
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
 * Enhanced check if a product should show bonus product selection.
 * A product is eligible if:
 * 1. It has promotions that can trigger bonus products
 * 2. It is NOT itself available as a bonus product in the current basket
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to check
 * @param {Object} productsWithPromotions - Object mapping productId to product data with promotions
 * @returns {boolean} Whether the product should show bonus product selection
 */
export const shouldShowBonusProductSelection = (basket, productId, productsWithPromotions) => {
    // First check if the product is eligible for bonus products
    const isEligible = isProductEligibleForBonusProducts(productId, productsWithPromotions)
    if (!isEligible) {
        return false
    }

    // Then check if this product is itself available as a bonus product
    // If it is, it shouldn't show bonus product selection when added as a regular item
    const isAvailableAsBonus = isProductAvailableAsBonus(basket, productId)

    return !isAvailableAsBonus
}
