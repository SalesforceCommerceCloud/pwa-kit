/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as discoveryUtils from '@salesforce/retail-react-app/app/utils/bonus-product-discovery'

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
                    calloutMsg: 'Special bonus product available!'
                }
            ]
        },
        'bonus-456': {
            id: 'bonus-456',
            productPromotions: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
        },
        'bonus-789': {
            id: 'bonus-789',
            productPromotions: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
        }
    }

    describe('getQualifyingProductIdForBonusItem', () => {
        test('returns qualifying product IDs for a valid bonus discount line item', () => {
            const result = discoveryUtils.getQualifyingProductIdForBonusItem(
                mockBasket,
                'bonus-123'
            )
            expect(result).toEqual(['prod-123'])
        })

        test('returns empty array for non-existent bonus discount line item', () => {
            const result = discoveryUtils.getQualifyingProductIdForBonusItem(
                mockBasket,
                'non-existent'
            )
            expect(result).toEqual([])
        })

        test('returns empty array when basket is null', () => {
            const result = discoveryUtils.getQualifyingProductIdForBonusItem(null, 'bonus-123')
            expect(result).toEqual([])
        })
    })

    describe('getAvailableBonusItemsForProduct', () => {
        test('returns available bonus items using enhanced product data', () => {
            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toHaveLength(1)
            expect(result[0].promotionId).toBe('BonusProductOnOrderOfAmountAbove250')
        })

        test('returns empty array when no matching promotions', () => {
            const emptyPromotionsData = {
                'prod-123': {
                    id: 'prod-123',
                    promotions: [{promotionId: 'DifferentPromotion'}]
                }
            }

            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                mockBasket,
                'prod-123',
                emptyPromotionsData
            )
            expect(result).toEqual([])
        })
    })

    describe('getBonusProductsInCartForProduct', () => {
        const basketWithBonusInCart = {
            ...mockBasket,
            productItems: [
                ...mockBasket.productItems,
                {
                    productId: 'bonus-prod-456',
                    bonusProductLineItem: true,
                    quantity: 1
                }
            ]
        }

        test('returns bonus products in cart using enhanced data', () => {
            const result = discoveryUtils.getBonusProductsInCartForProduct(
                basketWithBonusInCart,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toHaveLength(1)
            expect(result[0].productId).toBe('bonus-prod-456')
            expect(result[0].bonusProductLineItem).toBe(true)
        })

        test('returns empty array when no bonus products in cart', () => {
            const result = discoveryUtils.getBonusProductsInCartForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toEqual([])
        })

        test('combines bonus products correctly: identical products aggregate quantities', () => {
            const basketWithMultipleBonusProducts = {
                ...mockBasket,
                productItems: [
                    ...mockBasket.productItems,
                    {
                        itemId: 'bonus-item-1',
                        productId: 'bonus-prod-456',
                        productName: 'Striped Silk Tie',
                        bonusProductLineItem: true,
                        quantity: 1
                    },
                    {
                        itemId: 'bonus-item-2',
                        productId: 'bonus-prod-456',
                        productName: 'Striped Silk Tie',
                        bonusProductLineItem: true,
                        quantity: 2
                    },
                    {
                        itemId: 'bonus-item-3',
                        productId: 'bonus-prod-456',
                        productName: 'Striped Silk Tie',
                        bonusProductLineItem: true,
                        quantity: 1
                    }
                ]
            }

            const result = discoveryUtils.getBonusProductsInCartForProduct(
                basketWithMultipleBonusProducts,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result).toHaveLength(1)
            expect(result[0].productId).toBe('bonus-prod-456')
            expect(result[0].quantity).toBe(4) // 1 + 2 + 1 = 4
            expect(result[0].bonusProductLineItem).toBe(true)
            expect(result[0].productName).toBe('Striped Silk Tie')
        })
    })

    describe('getQualifyingProductForBonusProductInCart', () => {
        const basketWithBonusInCart = {
            ...mockBasket,
            productItems: [
                ...mockBasket.productItems,
                {
                    productId: 'bonus-prod-456',
                    bonusProductLineItem: true,
                    quantity: 1
                }
            ]
        }

        test('returns qualifying product IDs for a bonus product in cart', () => {
            const result = discoveryUtils.getQualifyingProductForBonusProductInCart(
                basketWithBonusInCart,
                'bonus-prod-456',
                mockProductsWithPromotions
            )
            expect(result).toEqual(['prod-123'])
        })

        test('returns empty array for non-existent bonus product', () => {
            const result = discoveryUtils.getQualifyingProductForBonusProductInCart(
                basketWithBonusInCart,
                'non-existent',
                mockProductsWithPromotions
            )
            expect(result).toEqual([])
        })
    })

    describe('getRemainingAvailableBonusProductsForProduct', () => {
        test('calculates remaining bonus products correctly', () => {
            const basketWithPartialBonus = {
                bonusDiscountLineItems: [
                    {
                        id: 'bonus-123',
                        promotionId: 'BonusProductOnOrderOfAmountAbove250',
                        maxBonusItems: 3,
                        bonusProducts: [{productId: 'bonus-prod-456'}]
                    }
                ],
                productItems: [
                    {
                        productId: 'prod-123',
                        quantity: 1
                    },
                    {
                        productId: 'bonus-prod-456',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 1
                    }
                ]
            }

            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                basketWithPartialBonus,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.bonusItems).toHaveLength(1)
            expect(result.bonusItems[0].remainingBonusItemsCount).toBe(2) // 3 max - 1 in cart = 2 remaining
            expect(result.aggregatedMaxBonusItems).toBe(3)
            expect(result.aggregatedSelectedItems).toBe(1) // 1 bonus product in cart
            expect(result.hasRemainingCapacity).toBe(true) // 1 < 3, so there's remaining capacity
        })

        test('filters out bonus items with zero remaining count', () => {
            const basketWithMaxBonus = {
                bonusDiscountLineItems: [
                    {
                        id: 'bonus-123',
                        promotionId: 'BonusProductOnOrderOfAmountAbove250',
                        maxBonusItems: 1,
                        bonusProducts: [{productId: 'bonus-prod-456'}]
                    }
                ],
                productItems: [
                    {
                        productId: 'prod-123',
                        quantity: 1
                    },
                    {
                        productId: 'bonus-prod-456',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 1
                    }
                ]
            }

            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                basketWithMaxBonus,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.bonusItems).toEqual([]) // Should be empty since 1 max - 1 in cart = 0 remaining
            expect(result.aggregatedMaxBonusItems).toBe(1)
            expect(result.aggregatedSelectedItems).toBe(1) // 1 bonus product in cart
            expect(result.hasRemainingCapacity).toBe(false) // 1 = 1, so no remaining capacity
        })

        test('shows remaining capacity with no bonus products selected', () => {
            const basketWithNoBonus = {
                bonusDiscountLineItems: [
                    {
                        id: 'bonus-discount-1',
                        promotionId: 'BonusProductOnOrderOfAmountAbove250',
                        maxBonusItems: 4,
                        bonusProducts: [{productId: 'bonus-456'}]
                    }
                ],
                productItems: [
                    {productId: 'prod-123', itemId: 'item-123', quantity: 1}
                    // No bonus products in cart
                ]
            }

            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                basketWithNoBonus,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.aggregatedMaxBonusItems).toBe(4)
            expect(result.aggregatedSelectedItems).toBe(0) // No bonus products in cart
            expect(result.hasRemainingCapacity).toBe(true) // 0 < 4, so there's remaining capacity
            expect(result.bonusItems).toHaveLength(1) // Should have available bonus items
            expect(result.bonusItems[0].remainingBonusItemsCount).toBe(4) // All 4 should be available
        })
    })
})
