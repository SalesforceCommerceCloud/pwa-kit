/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as discoveryUtils from '@salesforce/retail-react-app/app/utils/bonus-product/discovery'

describe('Bonus Product Discovery', () => {
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
                    calloutMsg: 'Buy $250+ and get free bonus products!'
                }
            ]
        }
    }

    describe('getAvailableBonusItemsForProduct', () => {
        test('returns available bonus items using enhanced product data', () => {
            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                productId: 'bonus-prod-456',
                promotionId: 'BonusProductOnOrderOfAmountAbove250',
                discountLineItemId: 'bonus-123'
            })
        })

        test('returns empty array when no matching promotions', () => {
            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                mockBasket,
                'prod-nonexistent',
                mockProductsWithPromotions
            )

            expect(result).toEqual([])
        })
    })

    describe('getRemainingAvailableBonusProductsForProduct', () => {
        test('calculates remaining bonus products correctly', () => {
            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.bonusItems).toHaveLength(1)
            expect(result.aggregatedMaxBonusItems).toBe(2)
            expect(result.aggregatedSelectedItems).toBe(0)
            expect(result.hasRemainingCapacity).toBe(true)
        })

        test('filters out bonus items with zero remaining count', () => {
            const basketWithBonusItems = {
                ...mockBasket,
                productItems: [
                    ...mockBasket.productItems,
                    // Add bonus items that fill the capacity
                    {
                        productId: 'bonus-prod-456',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 2
                    }
                ]
            }

            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                basketWithBonusItems,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.bonusItems).toHaveLength(0)
            expect(result.hasRemainingCapacity).toBe(false)
        })

        test('shows remaining capacity with no bonus products selected', () => {
            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.hasRemainingCapacity).toBe(true)
            expect(result.aggregatedSelectedItems).toBe(0)
        })
    })

    describe('findAvailableBonusDiscountLineItemIds', () => {
        test('returns pairs with available capacity for matching promotion', () => {
            const result = discoveryUtils.findAvailableBonusDiscountLineItemIds(
                mockBasket,
                'BonusProductOnOrderOfAmountAbove250'
            )

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual(['bonus-123', 2])
        })

        test('excludes pairs with zero available capacity', () => {
            const basketWithFullCapacity = {
                ...mockBasket,
                productItems: [
                    ...mockBasket.productItems,
                    {
                        productId: 'bonus-prod-456',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 2
                    }
                ]
            }

            const result = discoveryUtils.findAvailableBonusDiscountLineItemIds(
                basketWithFullCapacity,
                'BonusProductOnOrderOfAmountAbove250'
            )

            expect(result).toEqual([])
        })

        test('returns empty array when no matching promotion found', () => {
            const result = discoveryUtils.findAvailableBonusDiscountLineItemIds(
                mockBasket,
                'NonexistentPromotion'
            )

            expect(result).toEqual([])
        })
    })
})
