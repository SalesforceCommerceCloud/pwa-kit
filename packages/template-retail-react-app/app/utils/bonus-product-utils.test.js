/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as bonusProductUtils from './bonus-product-utils'

describe('Enhanced Bonus Product Utilities', () => {
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

    describe('getPromotionCalloutText', () => {
        test('returns plain text callout message for valid promotion', () => {
            const result = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('Buy $250+ and get free bonus products!')
        })

        test('strips HTML tags from callout message', () => {
            const result = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['bonus-prod-456'],
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('Special bonus product available!')
        })

        test('returns different promotion callout when specified', () => {
            const result = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'FreeShippingPromotion'
            )
            expect(result).toBe('Free shipping on orders over $50')
        })

        test('returns empty string for non-existent promotion ID', () => {
            const result = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'NonExistentPromotion'
            )
            expect(result).toBe('')
        })

        test('returns empty string when promotion has no calloutMsg', () => {
            const result = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['bonus-456'],
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('')
        })

        test('returns empty string when product is null', () => {
            const result = bonusProductUtils.getPromotionCalloutText(
                null,
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('')
        })

        test('returns empty string when product has no productPromotions', () => {
            const productWithoutPromotions = {id: 'test-product'}
            const result = bonusProductUtils.getPromotionCalloutText(
                productWithoutPromotions,
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('')
        })

        test('returns empty string when promotionId is null or undefined', () => {
            const result1 = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                null
            )
            expect(result1).toBe('')

            const result2 = bonusProductUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                undefined
            )
            expect(result2).toBe('')
        })

        test('handles complex HTML tags correctly', () => {
            const productWithComplexHTML = {
                productPromotions: [
                    {
                        promotionId: 'ComplexHTMLPromo',
                        calloutMsg:
                            '<div class="promo"><p>Get <span style="color: red;">20% off</span> with <a href="/terms">terms</a></p></div>'
                    }
                ]
            }
            const result = bonusProductUtils.getPromotionCalloutText(
                productWithComplexHTML,
                'ComplexHTMLPromo'
            )
            expect(result).toBe('Get 20% off with terms')
        })
    })

    describe('getQualifyingProductIdForBonusItem', () => {
        test('returns qualifying product IDs for a valid bonus discount line item', () => {
            const result = bonusProductUtils.getQualifyingProductIdForBonusItem(
                mockBasket,
                'bonus-123'
            )
            expect(result).toEqual(['prod-123'])
        })

        test('returns empty array for non-existent bonus discount line item', () => {
            const result = bonusProductUtils.getQualifyingProductIdForBonusItem(
                mockBasket,
                'non-existent'
            )
            expect(result).toEqual([])
        })

        test('returns empty array when basket is null', () => {
            const result = bonusProductUtils.getQualifyingProductIdForBonusItem(null, 'bonus-123')
            expect(result).toEqual([])
        })
    })

    describe('getPromotionIdsForProduct', () => {
        test('returns promotion IDs from enhanced product data', () => {
            const result = bonusProductUtils.getPromotionIdsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toEqual(['BonusProductOnOrderOfAmountAbove250', 'FreeShippingPromotion'])
        })

        test('returns empty array when no enhanced product data available', () => {
            const result = bonusProductUtils.getPromotionIdsForProduct(mockBasket, 'prod-123', {})
            expect(result).toEqual([])
        })

        test('returns empty array when product not found in enhanced data', () => {
            const result = bonusProductUtils.getPromotionIdsForProduct(
                mockBasket,
                'nonexistent-product',
                mockProductsWithPromotions
            )
            expect(result).toEqual([])
        })
    })

    describe('getAvailableBonusItemsForProduct', () => {
        test('returns available bonus items using enhanced product data', () => {
            const result = bonusProductUtils.getAvailableBonusItemsForProduct(
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

            const result = bonusProductUtils.getAvailableBonusItemsForProduct(
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
            const result = bonusProductUtils.getBonusProductsInCartForProduct(
                basketWithBonusInCart,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toHaveLength(1)
            expect(result[0].productId).toBe('bonus-prod-456')
            expect(result[0].bonusProductLineItem).toBe(true)
        })

        test('returns empty array when no bonus products in cart', () => {
            const result = bonusProductUtils.getBonusProductsInCartForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toEqual([])
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
            const result = bonusProductUtils.getQualifyingProductForBonusProductInCart(
                basketWithBonusInCart,
                'bonus-prod-456',
                mockProductsWithPromotions
            )
            expect(result).toEqual(['prod-123'])
        })

        test('returns empty array for non-existent bonus product', () => {
            const result = bonusProductUtils.getQualifyingProductForBonusProductInCart(
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

            const result = bonusProductUtils.getRemainingAvailableBonusProductsForProduct(
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

            const result = bonusProductUtils.getRemainingAvailableBonusProductsForProduct(
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

            const result = bonusProductUtils.getRemainingAvailableBonusProductsForProduct(
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

        test('checks product eligibility for bonus products', () => {
            // Test with eligible product
            const isEligible = bonusProductUtils.isProductEligibleForBonusProducts(
                'prod-123',
                mockProductsWithPromotions
            )
            expect(isEligible).toBe(true)

            // Test with non-existent product
            const isNotEligible = bonusProductUtils.isProductEligibleForBonusProducts(
                'non-existent',
                mockProductsWithPromotions
            )
            expect(isNotEligible).toBe(false)

            // Test with null data
            const isNotEligibleNull = bonusProductUtils.isProductEligibleForBonusProducts(
                'prod-123',
                null
            )
            expect(isNotEligibleNull).toBe(false)
        })
    })

    describe('findAvailableBonusDiscountLineItemId', () => {
        test('finds first discount line item with available capacity', () => {
            const basketWithMultipleDiscountItems = {
                bonusDiscountLineItems: [
                    {
                        id: 'discount-1',
                        promotionId: 'BonusProductOnOrderOfAmountAbove250',
                        maxBonusItems: 2
                    },
                    {
                        id: 'discount-2',
                        promotionId: 'BonusProductOnOrderOfAmountAbove250',
                        maxBonusItems: 3
                    }
                ],
                productItems: [
                    {productId: 'prod-123', quantity: 1},
                    // discount-1 is full (2 items)
                    {
                        productId: 'bonus-1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'discount-1'
                    },
                    {
                        productId: 'bonus-2',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'discount-1'
                    },
                    // discount-2 has 1 item (capacity for 2 more)
                    {
                        productId: 'bonus-3',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'discount-2'
                    }
                ]
            }

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemId(
                basketWithMultipleDiscountItems,
                'BonusProductOnOrderOfAmountAbove250',
                1,
                'fallback-id'
            )

            expect(result).toBe('discount-2') // Should return discount-2 since discount-1 is full
        })

        test('returns fallback when no capacity available', () => {
            const basketWithFullDiscountItems = {
                bonusDiscountLineItems: [
                    {
                        id: 'discount-1',
                        promotionId: 'BonusProductOnOrderOfAmountAbove250',
                        maxBonusItems: 1
                    }
                ],
                productItems: [
                    {productId: 'prod-123', quantity: 1},
                    {
                        productId: 'bonus-1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'discount-1'
                    }
                ]
            }

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemId(
                basketWithFullDiscountItems,
                'BonusProductOnOrderOfAmountAbove250',
                1,
                'fallback-id'
            )

            expect(result).toBe('discount-1') // Should return first matching item as fallback
        })

        test('returns fallback when no matching promotion found', () => {
            const basketWithDifferentPromotion = {
                bonusDiscountLineItems: [
                    {
                        id: 'discount-1',
                        promotionId: 'DifferentPromotion',
                        maxBonusItems: 2
                    }
                ],
                productItems: []
            }

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemId(
                basketWithDifferentPromotion,
                'BonusProductOnOrderOfAmountAbove250',
                1,
                'fallback-id'
            )

            expect(result).toBe('fallback-id') // Should return fallback when no matching promotion
        })

        test('returns fallback when basket is null or empty', () => {
            const result1 = bonusProductUtils.findAvailableBonusDiscountLineItemId(
                null,
                'BonusProductOnOrderOfAmountAbove250',
                1,
                'fallback-id'
            )
            expect(result1).toBe('fallback-id')

            const result2 = bonusProductUtils.findAvailableBonusDiscountLineItemId(
                {},
                'BonusProductOnOrderOfAmountAbove250',
                1,
                'fallback-id'
            )
            expect(result2).toBe('fallback-id')
        })
    })

    // Test hook functions exports (can't test actual React hooks in Jest environment)
    describe('React Hooks', () => {
        test('hook utilities are exported and are functions', () => {
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
})

