/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as promotionUtils from '@salesforce/retail-react-app/app/utils/bonus-product-promotions'

describe('Bonus Product Promotions', () => {
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
        }
    }

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

    describe('getPromotionCalloutText', () => {
        test('returns plain text callout message for valid promotion', () => {
            const result = promotionUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('Buy $250+ and get free bonus products!')
        })

        test('strips HTML tags from callout message', () => {
            const result = promotionUtils.getPromotionCalloutText(
                mockProductsWithPromotions['bonus-prod-456'],
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('Special bonus product available!')
        })

        test('returns different promotion callout when specified', () => {
            const result = promotionUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'FreeShippingPromotion'
            )
            expect(result).toBe('Free shipping on orders over $50')
        })

        test('returns empty string for non-existent promotion ID', () => {
            const result = promotionUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                'NonExistentPromotion'
            )
            expect(result).toBe('')
        })

        test('returns empty string when promotion has no calloutMsg', () => {
            const result = promotionUtils.getPromotionCalloutText(
                mockProductsWithPromotions['bonus-456'],
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('')
        })

        test('returns empty string when product is null', () => {
            const result = promotionUtils.getPromotionCalloutText(
                null,
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('')
        })

        test('returns empty string when product has no productPromotions', () => {
            const productWithoutPromotions = {id: 'test-product'}
            const result = promotionUtils.getPromotionCalloutText(
                productWithoutPromotions,
                'BonusProductOnOrderOfAmountAbove250'
            )
            expect(result).toBe('')
        })

        test('returns empty string when promotionId is null or undefined', () => {
            const result1 = promotionUtils.getPromotionCalloutText(
                mockProductsWithPromotions['prod-123'],
                null
            )
            expect(result1).toBe('')

            const result2 = promotionUtils.getPromotionCalloutText(
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
            const result = promotionUtils.getPromotionCalloutText(
                productWithComplexHTML,
                'ComplexHTMLPromo'
            )
            expect(result).toBe('Get 20% off with terms')
        })
    })

    describe('getPromotionIdsForProduct', () => {
        test('returns promotion IDs from enhanced product data', () => {
            const result = promotionUtils.getPromotionIdsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toEqual(['BonusProductOnOrderOfAmountAbove250', 'FreeShippingPromotion'])
        })

        test('returns empty array when no enhanced product data available', () => {
            const result = promotionUtils.getPromotionIdsForProduct(mockBasket, 'prod-123', {})
            expect(result).toEqual([])
        })

        test('returns empty array when product not found in enhanced data', () => {
            const result = promotionUtils.getPromotionIdsForProduct(
                mockBasket,
                'nonexistent-product',
                mockProductsWithPromotions
            )
            expect(result).toEqual([])
        })
    })

    describe('isProductAvailableAsBonus', () => {
        test('returns true when product is available as bonus', () => {
            const result = promotionUtils.isProductAvailableAsBonus(mockBasket, 'bonus-prod-456')
            expect(result).toBe(true)
        })

        test('returns false when product is not available as bonus', () => {
            const result = promotionUtils.isProductAvailableAsBonus(mockBasket, 'prod-123')
            expect(result).toBe(false)
        })

        test('returns false when basket is null', () => {
            const result = promotionUtils.isProductAvailableAsBonus(null, 'bonus-prod-456')
            expect(result).toBe(false)
        })
    })

    describe('isProductEligibleForBonusProducts', () => {
        test('returns true for eligible product', () => {
            const result = promotionUtils.isProductEligibleForBonusProducts(
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toBe(true)
        })

        test('returns false for non-existent product', () => {
            const result = promotionUtils.isProductEligibleForBonusProducts(
                'non-existent',
                mockProductsWithPromotions
            )
            expect(result).toBe(false)
        })

        test('returns false with null data', () => {
            const result = promotionUtils.isProductEligibleForBonusProducts('prod-123', null)
            expect(result).toBe(false)
        })
    })

    describe('shouldShowBonusProductSelection', () => {
        test('returns true for qualifying product (has promotions but not available as bonus)', () => {
            const result = promotionUtils.shouldShowBonusProductSelection(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(result).toBe(true)
        })

        test('returns false for bonus product (has promotions and is available as bonus)', () => {
            const result = promotionUtils.shouldShowBonusProductSelection(
                mockBasket,
                'bonus-prod-456',
                mockProductsWithPromotions
            )
            expect(result).toBe(false)
        })

        test('returns false for product that has no promotions', () => {
            const result = promotionUtils.shouldShowBonusProductSelection(
                mockBasket,
                'non-existent',
                mockProductsWithPromotions
            )
            expect(result).toBe(false)
        })
    })
})
