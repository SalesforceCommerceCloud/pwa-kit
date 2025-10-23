/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as businessLogicUtils from '@salesforce/retail-react-app/app/utils/bonus-product/business-logic'

describe('Bonus Product Business Logic', () => {
    describe('isRuleBasedPromotion', () => {
        test('returns true for rule-based promotion (empty bonusProducts array)', () => {
            const bonusDiscountLineItem = {
                promotionId: 'promo-123',
                bonusProducts: [] // Empty array = rule-based
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(true)
        })

        test('returns true when bonusProducts does not exist', () => {
            const bonusDiscountLineItem = {
                promotionId: 'promo-123'
                // No bonusProducts property = rule-based
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(true)
        })

        test('returns false for list-based promotion (populated bonusProducts array)', () => {
            const bonusDiscountLineItem = {
                promotionId: 'promo-456',
                bonusProducts: [
                    {productId: 'p1', productName: 'Product 1'},
                    {productId: 'p2', productName: 'Product 2'}
                ]
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(false)
        })

        test('returns false when bonusDiscountLineItem is null', () => {
            const result = businessLogicUtils.isRuleBasedPromotion(null)
            expect(result).toBe(false)
        })

        test('returns false when bonusDiscountLineItem is undefined', () => {
            const result = businessLogicUtils.isRuleBasedPromotion(undefined)
            expect(result).toBe(false)
        })

        test('returns true when bonusProducts is null', () => {
            const bonusDiscountLineItem = {
                promotionId: 'promo-789',
                bonusProducts: null // null = rule-based
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(true)
        })

        test('returns true when bonusProducts is undefined', () => {
            const bonusDiscountLineItem = {
                promotionId: 'promo-789',
                bonusProducts: undefined // undefined = rule-based
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(true)
        })

        test('returns false for single bonus product in array', () => {
            const bonusDiscountLineItem = {
                promotionId: 'promo-single',
                bonusProducts: [{productId: 'p1', productName: 'Product 1'}]
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(false)
        })

        test('returns false when bonusProducts is empty but promotionId is missing', () => {
            const bonusDiscountLineItem = {
                bonusProducts: [] // Empty bonusProducts but no promotionId
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(false)
        })

        test('returns false when bonusProducts is empty but promotionId is null', () => {
            const bonusDiscountLineItem = {
                promotionId: null,
                bonusProducts: [] // Empty bonusProducts but null promotionId
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(false)
        })

        test('returns false when bonusProducts is empty but promotionId is empty string', () => {
            const bonusDiscountLineItem = {
                promotionId: '',
                bonusProducts: [] // Empty bonusProducts but empty promotionId
            }

            const result = businessLogicUtils.isRuleBasedPromotion(bonusDiscountLineItem)
            expect(result).toBe(false)
        })
    })

    describe('shouldShowBonusProductSelection', () => {
        test('returns true when product is eligible and not available as bonus', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        promotionId: 'promo-1', // Include the promotion ID to make it a choice promotion
                        bonusProducts: [{productId: 'different-product'}]
                    }
                ]
            }
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: [{promotionId: 'promo-1'}]
                }
            }

            const result = businessLogicUtils.shouldShowBonusProductSelection(
                basket,
                'prod-123',
                productsWithPromotions
            )
            expect(result).toBe(true)
        })

        test('returns false when product is available as bonus', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        bonusProducts: [{productId: 'prod-123'}]
                    }
                ]
            }
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: [{promotionId: 'promo-1'}]
                }
            }

            const result = businessLogicUtils.shouldShowBonusProductSelection(
                basket,
                'prod-123',
                productsWithPromotions
            )
            expect(result).toBe(false)
        })

        test('returns false when product is not eligible for promotions', () => {
            const basket = {}
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: []
                }
            }

            const result = businessLogicUtils.shouldShowBonusProductSelection(
                basket,
                'prod-123',
                productsWithPromotions
            )
            expect(result).toBe(false)
        })
    })
})
