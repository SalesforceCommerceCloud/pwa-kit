/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as calculationUtils from '@salesforce/retail-react-app/app/utils/bonus-product/calculations'

describe('Bonus Product Calculations', () => {
    describe('getBonusProductCountsForPromotion', () => {
        test('calculates counts correctly', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3},
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 2}
                ],
                productItems: [
                    {
                        productId: 'bonus-product-1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-1'
                    },
                    {
                        productId: 'bonus-product-2',
                        quantity: 2,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-2'
                    }
                ]
            }

            const result = calculationUtils.getBonusProductCountsForPromotion(basket, 'promo-123')

            expect(result).toEqual({
                selectedBonusItems: 3, // 1 + 2
                maxBonusItems: 5 // 3 + 2
            })
        })

        test('returns zero counts when no data', () => {
            const basket = {
                bonusDiscountLineItems: [],
                productItems: []
            }

            const result = calculationUtils.getBonusProductCountsForPromotion(basket, 'promo-123')

            expect(result).toEqual({
                selectedBonusItems: 0,
                maxBonusItems: 0
            })
        })

        test('handles null basket', () => {
            const result = calculationUtils.getBonusProductCountsForPromotion(null, 'promo-123')

            expect(result).toEqual({
                selectedBonusItems: 0,
                maxBonusItems: 0
            })
        })

        test('handles null promotionId', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3}
                ],
                productItems: []
            }

            const result = calculationUtils.getBonusProductCountsForPromotion(basket, null)

            expect(result).toEqual({
                selectedBonusItems: 0,
                maxBonusItems: 0
            })
        })
    })
})
