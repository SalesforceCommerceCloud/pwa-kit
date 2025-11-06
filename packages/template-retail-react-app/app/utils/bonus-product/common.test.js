/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as commonUtils from '@salesforce/retail-react-app/app/utils/bonus-product/common'

describe('Bonus Product Common Utilities', () => {
    describe('getPromotionCalloutText', () => {
        test('returns plain text by stripping HTML tags', () => {
            const product = {
                productPromotions: [
                    {
                        promotionId: 'promo-123',
                        calloutMsg: '<p>Get <strong>free</strong> shipping!</p>'
                    }
                ]
            }
            const result = commonUtils.getPromotionCalloutText(product, 'promo-123')
            expect(result).toBe('Get free shipping!')
        })

        test('returns empty string when no matching promotion found', () => {
            const product = {
                productPromotions: [
                    {
                        promotionId: 'promo-456',
                        calloutMsg: 'Different promotion'
                    }
                ]
            }
            const result = commonUtils.getPromotionCalloutText(product, 'promo-123')
            expect(result).toBe('')
        })
    })

    describe('getPromotionIdsForProduct', () => {
        test('returns promotion IDs for list-based promotions when in bonusDiscountLineItems', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        promotionId: 'promo-1',
                        bonusProducts: [{productId: 'bonus-1'}] // List-based
                    },
                    {
                        promotionId: 'promo-2',
                        bonusProducts: [{productId: 'bonus-2'}] // List-based
                    }
                ]
            }
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: [{promotionId: 'promo-1'}, {promotionId: 'promo-2'}]
                }
            }
            const result = commonUtils.getPromotionIdsForProduct(
                basket,
                'prod-123',
                productsWithPromotions
            )
            expect(result).toEqual(['promo-1', 'promo-2'])
        })

        test('returns promotion IDs for rule-based promotions when product qualifies', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        promotionId: 'promo-rule-1',
                        bonusProducts: [] // Rule-based (empty array)
                    }
                ]
            }
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: [{promotionId: 'promo-rule-1'}]
                }
            }
            const ruleBasedQualifyingProductsMap = {
                'promo-rule-1': new Set(['prod-123'])
            }
            const result = commonUtils.getPromotionIdsForProduct(
                basket,
                'prod-123',
                productsWithPromotions,
                ruleBasedQualifyingProductsMap
            )
            expect(result).toEqual(['promo-rule-1'])
        })

        test('returns promotion IDs for rule-based promotions when variant master qualifies', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        promotionId: 'promo-rule-1',
                        bonusProducts: [] // Rule-based
                    }
                ]
            }
            const productsWithPromotions = {
                'variant-123': {
                    productPromotions: [{promotionId: 'promo-rule-1'}],
                    master: {
                        masterId: 'master-123'
                    }
                }
            }
            const ruleBasedQualifyingProductsMap = {
                'promo-rule-1': new Set(['master-123']) // Master qualifies
            }
            const result = commonUtils.getPromotionIdsForProduct(
                basket,
                'variant-123',
                productsWithPromotions,
                ruleBasedQualifyingProductsMap
            )
            expect(result).toEqual(['promo-rule-1'])
        })

        test('returns empty array when promotion not in bonusDiscountLineItems', () => {
            const basket = {
                bonusDiscountLineItems: []
            }
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: [{promotionId: 'promo-1'}]
                }
            }
            const result = commonUtils.getPromotionIdsForProduct(
                basket,
                'prod-123',
                productsWithPromotions
            )
            expect(result).toEqual([])
        })

        test('returns empty array when rule-based product does not qualify', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        promotionId: 'promo-rule-1',
                        bonusProducts: [] // Rule-based
                    }
                ]
            }
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: [{promotionId: 'promo-rule-1'}]
                }
            }
            const ruleBasedQualifyingProductsMap = {
                'promo-rule-1': new Set(['other-product']) // Different product qualifies
            }
            const result = commonUtils.getPromotionIdsForProduct(
                basket,
                'prod-123',
                productsWithPromotions,
                ruleBasedQualifyingProductsMap
            )
            expect(result).toEqual([])
        })
    })

    describe('isProductAvailableAsBonus', () => {
        test('returns true when product is available as bonus', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        bonusProducts: [{productId: 'bonus-prod-1'}, {productId: 'bonus-prod-2'}]
                    }
                ]
            }
            const result = commonUtils.isProductAvailableAsBonus(basket, 'bonus-prod-1')
            expect(result).toBe(true)
        })
    })

    describe('isProductEligibleForBonusProducts', () => {
        test('returns true when product has promotions', () => {
            const productsWithPromotions = {
                'prod-123': {
                    productPromotions: [{promotionId: 'promo-1'}]
                }
            }
            const result = commonUtils.isProductEligibleForBonusProducts(
                'prod-123',
                productsWithPromotions
            )
            expect(result).toBe(true)
        })
    })
})
