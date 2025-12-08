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
import {getBonusProductCountsForPromotion} from '@salesforce/retail-react-app/app/utils/bonus-product'

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
 *
 * @param {Object} basket - The current basket data
 * @returns {Object} Object containing products with promotion data and loading state
 */
export const useBasketProductsWithPromotions = (basket) => {
    // Get all unique product IDs from basket
    const productIds = basket?.productItems?.map((item) => item.productId) || []
    const uniqueProductIds = [...new Set(productIds)].join(',')

    const {data: productsResult, isPending} = useProducts(
        {
            parameters: {
                ids: uniqueProductIds,
                expand: ['promotions', 'prices'],
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

    return {
        data: productsResult || {},
        isLoading: isPending,
        hasPromotionData: Object.values(productsResult || {}).some(
            (product) => product.productPromotions && product.productPromotions.length > 0
        )
    }
}

/**
 * Hook to get available bonus items for a product using enhanced promotion data.
 *
 * @param {string} productId - The product ID to find available bonus items for
 * @returns {Object} Object containing available bonus items and loading state
 */
export const useAvailableBonusItemsForProduct = (productId) => {
    const {data: basket} = useCurrentBasket()
    const {data: productsWithPromotions, isLoading} = useBasketProductsWithPromotions(basket)

    const availableBonusItems =
        basket && productsWithPromotions
            ? getAvailableBonusItemsForProduct(basket, productId, productsWithPromotions)
            : []

    return {
        data: availableBonusItems,
        isLoading,
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
    const {data: productsWithPromotions, isLoading} = useBasketProductsWithPromotions(basket)

    const remainingBonusProducts =
        basket && productsWithPromotions
            ? getRemainingAvailableBonusProductsForProduct(
                  basket,
                  productId,
                  productsWithPromotions
              )
            : []

    return {
        data: remainingBonusProducts,
        isLoading,
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
