/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as businessLogicUtils from '@salesforce/retail-react-app/app/utils/bonus-product/business-logic'

describe('Bonus Product Business Logic', () => {
    describe('shouldShowBonusProductSelection', () => {
        test('returns true when product is eligible and not available as bonus', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
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
