/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as cartUtils from '@salesforce/retail-react-app/app/utils/bonus-product/cart'

describe('Bonus Product Cart Utilities', () => {
    const mockBasket = {
        bonusDiscountLineItems: [
            {
                id: 'bonus-123',
                promotionId: 'BonusProductOnOrderOfAmountAbove250'
            }
        ],
        productItems: [
            {
                productId: 'regular-product-1',
                priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
            },
            {
                productId: 'bonus-product-1',
                bonusProductLineItem: true,
                bonusDiscountLineItemId: 'bonus-123',
                quantity: 2
            }
        ]
    }

    describe('getQualifyingProductIdForBonusItem', () => {
        test('returns qualifying product IDs for a valid bonus discount line item', () => {
            const result = cartUtils.getQualifyingProductIdForBonusItem(mockBasket, 'bonus-123')
            expect(result).toEqual(['regular-product-1'])
        })

        test('returns empty array for non-existent bonus discount line item', () => {
            const result = cartUtils.getQualifyingProductIdForBonusItem(mockBasket, 'non-existent')
            expect(result).toEqual([])
        })
    })

    describe('getBonusProductsInCartForProduct', () => {
        test('returns bonus products in cart for a product', () => {
            const productsWithPromotions = {
                'regular-product-1': {
                    productPromotions: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                }
            }
            const result = cartUtils.getBonusProductsInCartForProduct(
                mockBasket,
                'regular-product-1',
                productsWithPromotions
            )
            expect(result).toHaveLength(1)
            expect(result[0].productId).toBe('bonus-product-1')
            expect(result[0].quantity).toBe(2)
        })
    })

    describe('findAllBonusProductItemsToRemove', () => {
        test('finds all bonus products with same productId and promotionId', () => {
            const targetBonusProduct = {
                productId: 'bonus-product-1',
                bonusProductLineItem: true,
                bonusDiscountLineItemId: 'bonus-123'
            }
            const result = cartUtils.findAllBonusProductItemsToRemove(
                mockBasket,
                targetBonusProduct
            )
            expect(result).toHaveLength(1)
            expect(result[0].productId).toBe('bonus-product-1')
        })
    })
})
