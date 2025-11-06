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

// Re-export common utilities
export {
    getPromotionCalloutText,
    getPromotionIdsForProduct,
    isProductAvailableAsBonus,
    isProductEligibleForBonusProducts
} from '@salesforce/retail-react-app/app/utils/bonus-product/common'

// Re-export cart state utilities
export {
    getQualifyingProductIdForBonusItem,
    getBonusProductsInCartForProduct,
    getBonusProductsForSpecificCartItem,
    getQualifyingProductForBonusProductInCart,
    findAllBonusProductItemsToRemove
} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'

// Re-export discovery utilities
export {
    getAvailableBonusItemsForProduct,
    getRemainingAvailableBonusProductsForProduct,
    findAvailableBonusDiscountLineItemIds
} from '@salesforce/retail-react-app/app/utils/bonus-product/discovery'

// Re-export calculation utilities
export {getBonusProductCountsForPromotion} from '@salesforce/retail-react-app/app/utils/bonus-product/calculations'

// Re-export business logic utilities
export {
    shouldShowBonusProductSelection,
    isAutomaticPromotion,
    isRuleBasedPromotion
} from '@salesforce/retail-react-app/app/utils/bonus-product/business-logic'

// Re-export React hooks
export {
    useProductPromotionIds,
    useBasketProductsWithPromotions,
    useAvailableBonusItemsForProduct,
    useRemainingAvailableBonusProductsForProduct
} from '@salesforce/retail-react-app/app/utils/bonus-product/hooks'
