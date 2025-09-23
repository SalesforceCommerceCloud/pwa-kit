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

    const uniqueBonusProducts = useMemo(() => {
        return bonusProducts
            .flatMap((item) => item.bonusProducts || [])
            .filter(
                (product, index, self) =>
                    index === self.findIndex((p) => p.productId === product.productId)
            )
    }, [bonusProducts])

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

        const candidates = bonusProducts.filter((bli) =>
            (bli.bonusProducts || []).some((p) => p.productId === bonusProduct.productId)
        )

        if (candidates.length > 0) {
            for (const candidate of candidates) {
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
                computedPromotionId = candidates[0].promotionId || null
                computedBonusDiscountLineItemId = candidates[0].id || null
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

    return {
        bonusProducts,
        bonusLineItemIds,
        maxBonusItems,
        selectedBonusItems,
        uniqueBonusProducts,
        productIds,
        productData,
        productById,
        isLoading,
        computeBonusMeta,
        normalizeProduct
    }
}
