/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as bonusProductUtils from '@salesforce/retail-react-app/app/utils/bonus-product/utils'

describe('Bonus Product Utilities - Integration Tests', () => {
    // Mock basket data
    const mockBasket = {
        bonusDiscountLineItems: [
            {
                id: 'bonus-123',
                promotionId: 'BonusProductOnOrderOfAmountAbove250',
                maxBonusItems: 2,
                bonusProducts: [{productId: 'bonus-prod-456'}]
            }
        ],
        productItems: [
            {
                productId: 'prod-123',
                priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250', price: -10}]
            }
        ]
    }

    // Mock products with promotion data
    const mockProductsWithPromotions = {
        'prod-123': {
            id: 'prod-123',
            productPromotions: [
                {
                    promotionId: 'BonusProductOnOrderOfAmountAbove250',
                    calloutMsg: 'Buy $250+ and get <strong>free bonus products</strong>!'
                },
                {
                    promotionId: 'FreeShippingPromotion',
                    calloutMsg: 'Free shipping on orders over $50'
                }
            ]
        },
        'bonus-prod-456': {
            id: 'bonus-prod-456',
            productPromotions: [
                {
                    promotionId: 'BonusProductOnOrderOfAmountAbove250',
                    calloutMsg: 'Special <em>bonus</em> product available!'
                }
            ]
        }
    }

    describe('Module Exports - All functions should be available', () => {
        // Test that all expected functions are exported
        const expectedExports = [
            // Promotion utilities
            'getPromotionCalloutText',
            'getPromotionIdsForProduct',
            'isProductAvailableAsBonus',
            'isProductEligibleForBonusProducts',
            'shouldShowBonusProductSelection',

            // Discovery utilities
            'getQualifyingProductIdForBonusItem',
            'getAvailableBonusItemsForProduct',
            'getBonusProductsInCartForProduct',
            'getQualifyingProductForBonusProductInCart',
            'getRemainingAvailableBonusProductsForProduct',

            // Calculation utilities
            'findAvailableBonusDiscountLineItemIds',
            'getBonusProductCountsForPromotion',
            'findAllBonusProductItemsToRemove',

            // React hooks
            'useProductPromotionIds',
            'useBasketProductsWithPromotions',
            'useAvailableBonusItemsForProduct',
            'useRemainingAvailableBonusProductsForProduct'
        ]

        expectedExports.forEach((exportName) => {
            test(`exports ${exportName} function`, () => {
                expect(bonusProductUtils[exportName]).toBeDefined()
                expect(typeof bonusProductUtils[exportName]).toBe('function')
            })
        })
    })

    describe('Integration Tests - Functions working together', () => {
        test('complete workflow: product eligibility -> available bonus items -> remaining items', () => {
            // 1. Check if product is eligible for bonus products
            const isEligible = bonusProductUtils.isProductEligibleForBonusProducts(
                'prod-123',
                mockProductsWithPromotions
            )
            expect(isEligible).toBe(true)

            // 2. Check if product should show bonus selection
            const shouldShow = bonusProductUtils.shouldShowBonusProductSelection(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(shouldShow).toBe(true)

            // 3. Get available bonus items
            const availableItems = bonusProductUtils.getAvailableBonusItemsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(availableItems).toHaveLength(1)
            expect(availableItems[0].productId).toBe('bonus-prod-456')

            // 4. Get remaining available bonus items
            const remainingItems = bonusProductUtils.getRemainingAvailableBonusProductsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(remainingItems.bonusItems).toHaveLength(1)
            expect(remainingItems.hasRemainingCapacity).toBe(true)
            expect(remainingItems.aggregatedMaxBonusItems).toBe(2)
            expect(remainingItems.aggregatedSelectedItems).toBe(0)
        })

        test('promotion callout text and IDs work together', () => {
            // Get promotion IDs for a product
            const promotionIds = bonusProductUtils.getPromotionIdsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            // Only BonusProductOnOrderOfAmountAbove250 should be returned because it's in bonusDiscountLineItems
            expect(promotionIds).toContain('BonusProductOnOrderOfAmountAbove250')
            expect(promotionIds).toHaveLength(1) // FreeShippingPromotion is not a bonus promotion

            // Get callout text for the bonus promotion
            const bonusCallout = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(bonusCallout).toBe('Buy $250+ and get free bonus products!')

            // FreeShippingPromotion callout text can still be retrieved (it's just not a bonus promotion)
            const shippingCallout = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'FreeShippingPromotion'
            )
            expect(shippingCallout).toBe('Free shipping on orders over $50')
        })

        test('basket state calculations work correctly', () => {
            // Test finding available discount line item IDs
            const availablePairs = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
                mockBasket,
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(availablePairs).toEqual([['bonus-123', 2]]) // ID and available capacity

            // Test promotion counts
            const counts = bonusProductUtils.getBonusProductCountsForPromotion(
                mockBasket,
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(counts.maxBonusItems).toBe(2)
            expect(counts.selectedBonusItems).toBe(0)
        })
    })

    describe('React Hooks Exports', () => {
        test('all React hooks are exported and are functions', () => {
            expect(bonusProductUtils.useProductPromotionIds).toBeDefined()
            expect(typeof bonusProductUtils.useProductPromotionIds).toBe('function')

            expect(bonusProductUtils.useBasketProductsWithPromotions).toBeDefined()
            expect(typeof bonusProductUtils.useBasketProductsWithPromotions).toBe('function')

            expect(bonusProductUtils.useAvailableBonusItemsForProduct).toBeDefined()
            expect(typeof bonusProductUtils.useAvailableBonusItemsForProduct).toBe('function')

            expect(bonusProductUtils.useRemainingAvailableBonusProductsForProduct).toBeDefined()
            expect(typeof bonusProductUtils.useRemainingAvailableBonusProductsForProduct).toBe(
                'function'
            )
        })
    })

    describe('Backward Compatibility', () => {
        test('maintains same API as original single-file implementation', () => {
            // Test a sampling of functions to ensure they work the same way

            // Test getQualifyingProductIdForBonusItem
            const qualifyingIds = bonusProductUtils.getQualifyingProductIdForBonusItem(
                mockBasket,
                'bonus-123'
            )
            expect(qualifyingIds).toEqual(['prod-123'])

            // Test getBonusProductsInCartForProduct with empty cart
            const bonusInCart = bonusProductUtils.getBonusProductsInCartForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(bonusInCart).toEqual([])

            // Test isProductAvailableAsBonus
            const isAvailableAsBonus = bonusProductUtils.isProductAvailableAsBonus(
                mockBasket,
                'bonus-prod-456'
            )
            expect(isAvailableAsBonus).toBe(true)

            const isNotAvailableAsBonus = bonusProductUtils.isProductAvailableAsBonus(
                mockBasket,
                'prod-123'
            )
            expect(isNotAvailableAsBonus).toBe(false)
        })
    })
})
