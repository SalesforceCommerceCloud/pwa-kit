/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Enhanced bonus product utilities that fetch product promotion data from the products endpoint.
 * All functions now require product promotion data to ensure accuracy and currency.
 *
 * This is the main entry point that re-exports all bonus product utilities from their
 * specialized modules for backward compatibility.
 */

// Re-export promotion-related utilities
export {
    getPromotionCalloutText,
    getPromotionIdsForProduct,
    isProductAvailableAsBonus,
    isProductEligibleForBonusProducts,
    shouldShowBonusProductSelection
} from './bonus-product-promotions'

// Re-export discovery utilities
export {
    getQualifyingProductIdForBonusItem,
    getAvailableBonusItemsForProduct,
    getBonusProductsInCartForProduct,
    getQualifyingProductForBonusProductInCart,
    getRemainingAvailableBonusProductsForProduct
} from './bonus-product-discovery'

// Re-export calculation utilities
export {
    findAvailableBonusDiscountLineItemIds,
    getBonusProductCountsForPromotion,
    findAllBonusProductItemsToRemove
} from './bonus-product-calculations'

// Re-export React hooks
export {
    useProductPromotionIds,
    useBasketProductsWithPromotions,
    useAvailableBonusItemsForProduct,
    useRemainingAvailableBonusProductsForProduct
} from './bonus-product-hooks'
