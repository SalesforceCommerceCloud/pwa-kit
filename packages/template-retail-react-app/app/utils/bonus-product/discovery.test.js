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

    describe('Rule-Based Promotions Support', () => {
        const mockRuleBasedBasket = {
            bonusDiscountLineItems: [
                {
                    id: 'rule-based-123',
                    promotionId: 'rule-based-promo',
                    maxBonusItems: 3,
                    bonusProducts: [] // Empty array indicates rule-based
                }
            ],
            productItems: [
                {
                    productId: 'prod-456',
                    priceAdjustments: [{promotionId: 'rule-based-promo', price: -15}]
                }
            ]
        }

        const mockProductsForRuleBased = {
            'prod-456': {
                id: 'prod-456',
                productPromotions: [
                    {
                        promotionId: 'rule-based-promo',
                        calloutMsg: 'Get choice of bonus from Electronics category!'
                    }
                ]
            }
        }

        const mockRuleBasedProductsMap = {
            'rule-based-promo': [
                {productId: 'rule-product-1', productName: 'Rule Product 1'},
                {productId: 'rule-product-2', productName: 'Rule Product 2'},
                {productId: 'rule-product-3', productName: 'Rule Product 3'}
            ]
        }

        describe('getAvailableBonusItemsForProduct with rule-based products', () => {
            test('returns rule-based products from ruleBasedProductsMap', () => {
                const result = discoveryUtils.getAvailableBonusItemsForProduct(
                    mockRuleBasedBasket,
                    'prod-456',
                    mockProductsForRuleBased,
                    mockRuleBasedProductsMap
                )

                expect(result).toHaveLength(3)
                expect(result[0]).toEqual({
                    productId: 'rule-product-1',
                    productName: 'Rule Product 1',
                    promotionId: 'rule-based-promo',
                    discountLineItemId: 'rule-based-123'
                })
                expect(result[1].productId).toBe('rule-product-2')
                expect(result[2].productId).toBe('rule-product-3')
            })

            test('returns empty array when ruleBasedProductsMap is not provided', () => {
                const result = discoveryUtils.getAvailableBonusItemsForProduct(
                    mockRuleBasedBasket,
                    'prod-456',
                    mockProductsForRuleBased
                    // No ruleBasedProductsMap provided
                )

                expect(result).toEqual([])
            })

            test('handles mixed list-based and rule-based promotions', () => {
                const mixedBasket = {
                    bonusDiscountLineItems: [
                        {
                            id: 'list-based-123',
                            promotionId: 'list-based-promo',
                            maxBonusItems: 1,
                            bonusProducts: [{productId: 'list-product-1'}]
                        },
                        {
                            id: 'rule-based-456',
                            promotionId: 'rule-based-promo',
                            maxBonusItems: 2,
                            bonusProducts: [] // Rule-based
                        }
                    ],
                    productItems: []
                }

                const mixedProducts = {
                    'prod-789': {
                        id: 'prod-789',
                        productPromotions: [
                            {promotionId: 'list-based-promo'},
                            {promotionId: 'rule-based-promo'}
                        ]
                    }
                }

                const result = discoveryUtils.getAvailableBonusItemsForProduct(
                    mixedBasket,
                    'prod-789',
                    mixedProducts,
                    mockRuleBasedProductsMap
                )

                expect(result).toHaveLength(4) // 1 list-based + 3 rule-based
                expect(result[0].productId).toBe('list-product-1')
                expect(result[1].productId).toBe('rule-product-1')
                expect(result[2].productId).toBe('rule-product-2')
                expect(result[3].productId).toBe('rule-product-3')
            })
        })

        describe('getRemainingAvailableBonusProductsForProduct with rule-based products', () => {
            test('calculates remaining count for rule-based products', () => {
                const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                    mockRuleBasedBasket,
                    'prod-456',
                    mockProductsForRuleBased,
                    mockRuleBasedProductsMap
                )

                expect(result.bonusItems).toHaveLength(3)
                expect(result.aggregatedMaxBonusItems).toBe(3)
                expect(result.aggregatedSelectedItems).toBe(0)
                expect(result.hasRemainingCapacity).toBe(true)
                expect(result.bonusItems[0].remainingBonusItemsCount).toBe(3)
            })

            test('filters out rule-based products when capacity is full', () => {
                const basketWithBonusItems = {
                    ...mockRuleBasedBasket,
                    productItems: [
                        ...mockRuleBasedBasket.productItems,
                        {
                            productId: 'rule-product-1',
                            bonusProductLineItem: true,
                            bonusDiscountLineItemId: 'rule-based-123',
                            quantity: 3 // Fill the capacity
                        }
                    ]
                }

                const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                    basketWithBonusItems,
                    'prod-456',
                    mockProductsForRuleBased,
                    mockRuleBasedProductsMap
                )

                expect(result.bonusItems).toEqual([])
                expect(result.aggregatedMaxBonusItems).toBe(3)
                expect(result.aggregatedSelectedItems).toBe(3)
                expect(result.hasRemainingCapacity).toBe(false)
            })

            test('handles mixed promotions with different remaining counts', () => {
                const mixedBasket = {
                    bonusDiscountLineItems: [
                        {
                            id: 'list-based-123',
                            promotionId: 'list-based-promo',
                            maxBonusItems: 2,
                            bonusProducts: [{productId: 'list-product-1'}]
                        },
                        {
                            id: 'rule-based-456',
                            promotionId: 'rule-based-promo',
                            maxBonusItems: 3,
                            bonusProducts: []
                        }
                    ],
                    productItems: [
                        {
                            productId: 'list-product-1',
                            bonusProductLineItem: true,
                            bonusDiscountLineItemId: 'list-based-123',
                            quantity: 1 // 1 of 2 used
                        }
                    ]
                }

                const mixedProducts = {
                    'prod-789': {
                        id: 'prod-789',
                        productPromotions: [
                            {promotionId: 'list-based-promo'},
                            {promotionId: 'rule-based-promo'}
                        ]
                    }
                }

                const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                    mixedBasket,
                    'prod-789',
                    mixedProducts,
                    mockRuleBasedProductsMap
                )

                // List-based has 1 remaining, rule-based has 3 remaining
                expect(result.bonusItems).toHaveLength(4)
                expect(result.aggregatedMaxBonusItems).toBe(5)
                expect(result.aggregatedSelectedItems).toBe(1)
                expect(result.hasRemainingCapacity).toBe(true)

                // Check that list-based product has remainingCount of 1
                const listBasedItem = result.bonusItems.find(
                    (item) => item.productId === 'list-product-1'
                )
                expect(listBasedItem.remainingBonusItemsCount).toBe(1)

                // Check that rule-based products have remainingCount of 3
                const ruleBasedItem = result.bonusItems.find(
                    (item) => item.productId === 'rule-product-1'
                )
                expect(ruleBasedItem.remainingBonusItemsCount).toBe(3)
            })
        })
    })
})
