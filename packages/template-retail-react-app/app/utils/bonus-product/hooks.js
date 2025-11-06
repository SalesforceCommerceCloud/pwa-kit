/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useProduct, useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    getAvailableBonusItemsForProduct,
    getRemainingAvailableBonusProductsForProduct
} from '@salesforce/retail-react-app/app/utils/bonus-product/discovery'
import {getBonusProductCountsForPromotion} from '@salesforce/retail-react-app/app/utils/bonus-product/calculations'
import {isRuleBasedPromotion} from '@salesforce/retail-react-app/app/utils/bonus-product/business-logic'
import {
    useRuleBasedBonusProducts,
    useRuleBasedQualifyingProducts
} from '@salesforce/retail-react-app/app/hooks/use-rule-based-bonus-products'

/**
 * Maximum number of rule-based bonus products to fetch from the API.
 * This is the API limit for the productSearch endpoint.
 */
const RULE_BASED_BONUS_PRODUCTS_API_LIMIT = 50

/**
 * React hooks for bonus product data fetching and state management.
 *
 * This module provides React hooks that integrate with the Commerce SDK and other
 * bonus product utilities to fetch and manage bonus product data. These hooks
 * handle data fetching, loading states, and provide a React-friendly interface
 * to the underlying bonus product utility functions.
 *
 * Functions in this file:
 * - React hooks for data fetching
 * - State management hooks
 * - Commerce SDK integration hooks
 * - Loading state management
 */

/**
 * Hook to get promotion IDs for a single product by fetching from the products endpoint.
 *
 * @param {string} productId - The product ID to fetch promotion data for
 * @returns {Object} Object containing promotion IDs, loading state, and product data
 */
export const useProductPromotionIds = (productId) => {
    const {data: product, isPending} = useProduct(
        {
            parameters: {
                id: productId,
                expand: ['promotions', 'prices'],
                perPricebook: true
            }
        },
        {
            enabled: Boolean(productId)
        }
    )

    // Extract promotion IDs from the product promotions data (using productPromotions)
    const promotionIds =
        product?.productPromotions
            ?.map((promotion) => promotion.promotionId)
            .filter((id) => id != null) || []

    return {
        data: promotionIds,
        isLoading: isPending,
        productData: product,
        hasPromotionData: Boolean(
            product?.productPromotions && product.productPromotions.length > 0
        )
    }
}

/**
 * Hook to get multiple products with promotion data for basket items.
 * This fetches all products in the basket with their promotion data in a single request.
 * Also fetches qualifying products for rule-based promotions to determine variant eligibility.
 *
 * @param {Object} basket - The current basket data
 * @returns {Object} Object containing products with promotion data, qualifying products map, and loading state
 */
export const useBasketProductsWithPromotions = (basket) => {
    // Get all unique product IDs from basket
    const productIds = basket?.productItems?.map((item) => item.productId) || []
    const uniqueProductIds = [...new Set(productIds)].join(',')

    const {data: productsResult, isPending} = useProducts(
        {
            parameters: {
                ids: uniqueProductIds,
                expand: ['promotions', 'prices', 'variations'],
                perPricebook: true,
                allImages: false // We don't need images for promotion data
            }
        },
        {
            enabled: Boolean(uniqueProductIds),
            select: (result) => {
                // Convert to object keyed by product ID for easy lookup
                return (
                    result?.data?.reduce((acc, product) => {
                        acc[product.id] = product
                        return acc
                    }, {}) || {}
                )
            }
        }
    )

    // Identify rule-based promotions in the basket
    const ruleBasedPromotionIds = useMemo(() => {
        return (
            basket?.bonusDiscountLineItems
                ?.filter((bli) => isRuleBasedPromotion(bli))
                .map((bli) => bli.promotionId)
                .filter(Boolean) || []
        )
    }, [basket?.bonusDiscountLineItems])

    // Fetch qualifying products for each rule-based promotion
    // Note: For simplicity, we're fetching for the first rule-based promotion
    // In a production scenario, you might want to fetch for all rule-based promotions
    const firstRuleBasedPromotionId = ruleBasedPromotionIds[0] || null

    const {qualifyingProductIds: ruleBasedQualifyingIds, isLoading: isLoadingQualifying} =
        useRuleBasedQualifyingProducts(firstRuleBasedPromotionId, {
            enabled: Boolean(firstRuleBasedPromotionId)
        })

    // Build a map of promotionId -> Set of qualifying product IDs
    const ruleBasedQualifyingProductsMap = useMemo(() => {
        if (!firstRuleBasedPromotionId || !ruleBasedQualifyingIds) {
            return {}
        }
        return {
            [firstRuleBasedPromotionId]: ruleBasedQualifyingIds
        }
    }, [firstRuleBasedPromotionId, ruleBasedQualifyingIds])

    // Only consider isLoadingQualifying if there are actually rule-based promotions
    const hasRuleBasedPromotions = ruleBasedPromotionIds.length > 0
    const finalIsLoading = isPending || (hasRuleBasedPromotions && isLoadingQualifying)

    return {
        data: productsResult || {},
        ruleBasedQualifyingProductsMap,
        isLoading: finalIsLoading,
        hasPromotionData: Object.values(productsResult || {}).some(
            (product) => product.productPromotions && product.productPromotions.length > 0
        )
    }
}

/**
 * Hook to extract rule-based promotion IDs from bonus discount line items.
 *
 * @param {Array} bonusDiscountLineItems - Array of bonus discount line items
 * @returns {Array} Array of rule-based promotion IDs
 */
export const useRuleBasedPromotionIds = (bonusDiscountLineItems) => {
    return useMemo(() => {
        return (
            bonusDiscountLineItems
                ?.filter((bli) => isRuleBasedPromotion(bli))
                .map((bli) => bli.promotionId)
                .filter(Boolean) || []
        )
    }, [bonusDiscountLineItems])
}

/**
 * Hook to get available bonus items for a product using enhanced promotion data.
 *
 * @param {string} productId - The product ID to find available bonus items for
 * @returns {Object} Object containing available bonus items and loading state
 */
export const useAvailableBonusItemsForProduct = (productId) => {
    const {data: basket} = useCurrentBasket()

    const {
        data: productsWithPromotions,
        ruleBasedQualifyingProductsMap,
        isLoading
    } = useBasketProductsWithPromotions(basket)

    // Identify rule-based promotions and fetch their products
    const ruleBasedPromotions = useRuleBasedPromotionIds(basket?.bonusDiscountLineItems)

    // Fetch rule-based products for the first rule-based promotion
    // Note: Currently only supports one rule-based promotion at a time
    const {products: ruleBasedProducts, isLoading: isLoadingRuleBased} = useRuleBasedBonusProducts(
        ruleBasedPromotions[0] || '',
        {
            enabled: ruleBasedPromotions.length > 0,
            limit: RULE_BASED_BONUS_PRODUCTS_API_LIMIT
        }
    )

    // Build ruleBasedProductsMap for discovery functions
    const ruleBasedProductsMap = useMemo(() => {
        if (!ruleBasedProducts || ruleBasedProducts.length === 0 || !ruleBasedPromotions[0]) {
            return {}
        }
        return {
            [ruleBasedPromotions[0]]: ruleBasedProducts
        }
    }, [ruleBasedProducts, ruleBasedPromotions])

    const availableBonusItems =
        basket && productsWithPromotions
            ? getAvailableBonusItemsForProduct(
                  basket,
                  productId,
                  productsWithPromotions,
                  ruleBasedProductsMap,
                  ruleBasedQualifyingProductsMap
              )
            : []

    // Only include rule-based loading state if we're actually fetching rule-based products
    const finalIsLoading = isLoading || (ruleBasedPromotions.length > 0 && isLoadingRuleBased)

    return {
        data: availableBonusItems,
        isLoading: finalIsLoading,
        hasPromotionData: Object.keys(productsWithPromotions || {}).length > 0
    }
}

/**
 * Hook to get remaining available bonus products using enhanced promotion data.
 *
 * @param {string} productId - The product ID to find remaining bonus products for
 * @returns {Object} Object containing remaining bonus products and loading state
 */
export const useRemainingAvailableBonusProductsForProduct = (productId) => {
    const {data: basket} = useCurrentBasket()

    const {
        data: productsWithPromotions,
        ruleBasedQualifyingProductsMap,
        isLoading
    } = useBasketProductsWithPromotions(basket)

    // Identify rule-based promotions and fetch their products
    const ruleBasedPromotions = useRuleBasedPromotionIds(basket?.bonusDiscountLineItems)

    // Fetch rule-based products for the first rule-based promotion
    // Note: Currently only supports one rule-based promotion at a time
    const {products: ruleBasedProducts, isLoading: isLoadingRuleBased} = useRuleBasedBonusProducts(
        ruleBasedPromotions[0] || '',
        {
            enabled: ruleBasedPromotions.length > 0,
            limit: RULE_BASED_BONUS_PRODUCTS_API_LIMIT
        }
    )

    // Build ruleBasedProductsMap for discovery functions
    const ruleBasedProductsMap = useMemo(() => {
        if (!ruleBasedProducts || ruleBasedProducts.length === 0 || !ruleBasedPromotions[0]) {
            return {}
        }
        return {
            [ruleBasedPromotions[0]]: ruleBasedProducts
        }
    }, [ruleBasedProducts, ruleBasedPromotions])

    const remainingBonusProducts =
        basket && productsWithPromotions
            ? getRemainingAvailableBonusProductsForProduct(
                  basket,
                  productId,
                  productsWithPromotions,
                  ruleBasedProductsMap,
                  ruleBasedQualifyingProductsMap
              )
            : []

    // Only include rule-based loading state if we're actually fetching rule-based products
    const finalIsLoading = isLoading || (ruleBasedPromotions.length > 0 && isLoadingRuleBased)

    return {
        data: remainingBonusProducts,
        isLoading: finalIsLoading,
        hasPromotionData: Object.keys(productsWithPromotions || {}).length > 0
    }
}

/**
 * Hook to get bonus product counts for a specific promotion.
 * This hook memoizes the calculation to prevent unnecessary re-computations.
 *
 * @param {Object} basket - The current basket data
 * @param {string} promotionId - The promotion ID to calculate counts for
 * @returns {Object} Object containing finalSelectedBonusItems and finalMaxBonusItems
 */
export const useBonusProductCounts = (basket, promotionId) => {
    const {selectedBonusItems: finalSelectedBonusItems, maxBonusItems: finalMaxBonusItems} =
        useMemo(() => {
            return getBonusProductCountsForPromotion(basket, promotionId)
        }, [basket, promotionId])

    return {
        finalSelectedBonusItems,
        finalMaxBonusItems
    }
}
