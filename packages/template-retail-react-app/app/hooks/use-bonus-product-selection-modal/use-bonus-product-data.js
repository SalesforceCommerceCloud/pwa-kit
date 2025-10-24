/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {findAvailableBonusDiscountLineItemIds} from '@salesforce/retail-react-app/app/utils/bonus-product'
import {isRuleBasedPromotion} from '@salesforce/retail-react-app/app/utils/bonus-product/business-logic'
import {useRuleBasedBonusProducts} from '@salesforce/retail-react-app/app/hooks/use-rule-based-bonus-products'
import {useRuleBasedPromotionIds} from '@salesforce/retail-react-app/app/utils/bonus-product/hooks'

export const useBonusProductData = (modalData) => {
    const {data: basket} = useCurrentBasket()

    const bonusProducts = modalData?.bonusDiscountLineItems || []

    const bonusLineItemIds = useMemo(
        () => bonusProducts.map((bli) => bli.id).filter(Boolean),
        [bonusProducts]
    )

    const maxBonusItems = useMemo(
        () => bonusProducts.reduce((sum, bli) => sum + (bli.maxBonusItems || 0), 0),
        [bonusProducts]
    )

    const selectedBonusItems = useMemo(() => {
        const items = basket?.productItems || []
        return items
            .filter(
                (it) =>
                    it?.bonusProductLineItem &&
                    bonusLineItemIds.includes(it?.bonusDiscountLineItemId)
            )
            .reduce((acc, it) => acc + (it?.quantity || 0), 0)
    }, [basket, bonusLineItemIds])

    // Identify rule-based promotions and fetch their products
    const ruleBasedPromotions = useRuleBasedPromotionIds(bonusProducts)

    // Fetch rule-based products for all rule-based promotions
    // Note: This fetches for the first promotion. If multiple rule-based promotions exist,
    // we'd need to call the hook multiple times or aggregate the promotionIds
    const {products: ruleBasedProducts, isLoading: isLoadingRuleBased} = useRuleBasedBonusProducts(
        ruleBasedPromotions[0] || '',
        {
            enabled: ruleBasedPromotions.length > 0,
            limit: 50
        }
    )

    // Convert rule-based products to the same format as list-based bonusProducts
    // Keep the full product data including image information from productSearch
    const ruleBasedBonusProducts = useMemo(() => {
        if (!ruleBasedProducts || ruleBasedProducts.length === 0) {
            return []
        }
        return ruleBasedProducts.map((product) => ({
            productId: product.productId,
            productName: product.productName,
            // Keep the full product data for image rendering
            _searchData: product
        }))
    }, [ruleBasedProducts])

    const uniqueBonusProducts = useMemo(() => {
        // Get list-based products
        const listBasedProducts = bonusProducts
            .filter((item) => !isRuleBasedPromotion(item))
            .flatMap((item) => item.bonusProducts || [])

        // Merge list-based and rule-based products
        const allProducts = [...listBasedProducts, ...ruleBasedBonusProducts]

        // Deduplicate by productId
        return allProducts.filter(
            (product, index, self) =>
                index === self.findIndex((p) => p.productId === product.productId)
        )
    }, [bonusProducts, ruleBasedBonusProducts])

    const productIds = useMemo(() => {
        return uniqueBonusProducts
            .map((product) => product.productId)
            .filter(Boolean)
            .join(',')
    }, [uniqueBonusProducts])

    const {data: productData, isLoading} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(productIds),
            placeholderData: null
        }
    )

    const productById = useMemo(() => {
        const map = new Map()
        productData?.data?.forEach((p) => map.set(p.id, p))
        return map
    }, [productData])

    const computeBonusMeta = (bonusProduct) => {
        let computedPromotionId = null
        let computedBonusDiscountLineItemId = null

        // First, check if this product is in any list-based promotion
        const listBasedCandidates = bonusProducts
            .filter((bli) => !isRuleBasedPromotion(bli))
            .filter((bli) =>
                (bli.bonusProducts || []).some((p) => p.productId === bonusProduct.productId)
            )

        if (listBasedCandidates.length > 0) {
            for (const candidate of listBasedCandidates) {
                const availablePairs = findAvailableBonusDiscountLineItemIds(
                    basket,
                    candidate.promotionId
                )
                if (availablePairs.length > 0) {
                    computedPromotionId = candidate.promotionId
                    computedBonusDiscountLineItemId = availablePairs[0][0]
                    break
                }
            }

            if (!computedBonusDiscountLineItemId) {
                computedPromotionId = listBasedCandidates[0].promotionId || null
                computedBonusDiscountLineItemId = listBasedCandidates[0].id || null
            }
        } else {
            // If not in list-based, check if it's from a rule-based promotion
            const ruleBasedCandidates = bonusProducts.filter((bli) => isRuleBasedPromotion(bli))

            if (ruleBasedCandidates.length > 0) {
                for (const candidate of ruleBasedCandidates) {
                    const availablePairs = findAvailableBonusDiscountLineItemIds(
                        basket,
                        candidate.promotionId
                    )
                    if (availablePairs.length > 0) {
                        computedPromotionId = candidate.promotionId
                        computedBonusDiscountLineItemId = availablePairs[0][0]
                        break
                    }
                }

                if (!computedBonusDiscountLineItemId && ruleBasedCandidates[0]) {
                    computedPromotionId = ruleBasedCandidates[0].promotionId || null
                    computedBonusDiscountLineItemId = ruleBasedCandidates[0].id || null
                }
            }
        }

        return {
            promotionId: computedPromotionId,
            bonusDiscountLineItemId: computedBonusDiscountLineItemId
        }
    }

    const normalizeProduct = (bonusProduct, foundProductData) => {
        const initial = foundProductData || productById.get(bonusProduct?.productId)

        if (!initial) {
            return {
                productId: bonusProduct?.productId,
                imageGroups: [],
                variants: [],
                variationAttributes: [],
                type: {set: false, bundle: false}
            }
        }

        // Find the specific variant if the bonusProduct.productId is a variant
        const variant = initial.variants?.find((v) => v.productId === bonusProduct?.productId)

        return {
            productId: initial.id,
            ...initial,
            imageGroups: initial.imageGroups || [],
            variants: initial.variants || [],
            variationAttributes: initial.variationAttributes || [],
            type: initial.type || {set: false, bundle: false},
            // Include variant information if this is a specific variant
            selectedVariant: variant || null,
            variationValues: variant?.variationValues || {}
        }
    }

    // Only include rule-based loading state if we're actually fetching rule-based products
    const finalIsLoading = isLoading || (ruleBasedPromotions.length > 0 && isLoadingRuleBased)

    return {
        bonusProducts,
        bonusLineItemIds,
        maxBonusItems,
        selectedBonusItems,
        uniqueBonusProducts,
        productIds,
        productData,
        productById,
        isLoading: finalIsLoading,
        computeBonusMeta,
        normalizeProduct,
        ruleBasedPromotions,
        ruleBasedProducts
    }
}
