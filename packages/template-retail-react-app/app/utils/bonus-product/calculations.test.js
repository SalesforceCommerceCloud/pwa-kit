/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as calculationUtils from '@salesforce/retail-react-app/app/utils/bonus-product/calculations'

describe('Bonus Product Calculations', () => {
    describe('findAvailableBonusDiscountLineItemIds', () => {
        test('returns pairs with available capacity for matching promotion', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3},
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 2}
                ],
                productItems: [
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 1}
                ]
            }

            const result = calculationUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([
                ['bonus-1', 2], // 3 max - 1 selected = 2 available
                ['bonus-2', 2] // 2 max - 0 selected = 2 available
            ])
        })

        test('excludes pairs with zero available capacity', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 2},
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 1}
                ],
                productItems: [
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 2},
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-2', quantity: 1}
                ]
            }

            const result = calculationUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([])
        })

        test('handles multiple quantities for same discount line item', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 5}
                ],
                productItems: [
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 2},
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 1}
                ]
            }

            const result = calculationUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([
                ['bonus-1', 2] // 5 max - (2+1) selected = 2 available
            ])
        })

        test('returns empty array when no matching promotion found', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'different-promo', maxBonusItems: 3}
                ],
                productItems: []
            }

            const result = calculationUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([])
        })

        test('returns empty array when basket is null or undefined', () => {
            expect(
                calculationUtils.findAvailableBonusDiscountLineItemIds(null, 'promo-123')
            ).toEqual([])
            expect(
                calculationUtils.findAvailableBonusDiscountLineItemIds(undefined, 'promo-123')
            ).toEqual([])
        })

        test('returns empty array when promotionId is null or undefined', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3}
                ],
                productItems: []
            }

            expect(calculationUtils.findAvailableBonusDiscountLineItemIds(basket, null)).toEqual([])
            expect(
                calculationUtils.findAvailableBonusDiscountLineItemIds(basket, undefined)
            ).toEqual([])
        })

        test('ignores non-bonus product items when calculating capacity', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3}
                ],
                productItems: [
                    {bonusProductLineItem: false, bonusDiscountLineItemId: 'bonus-1', quantity: 2}, // Should be ignored
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 1} // Should count
                ]
            }

            const result = calculationUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([
                ['bonus-1', 2] // 3 max - 1 selected = 2 available (ignores non-bonus item)
            ])
        })
    })

    describe('getBonusProductCountsForPromotion', () => {
        test('calculates counts correctly', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3},
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 2}
                ],
                productItems: [
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 2},
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-2', quantity: 1}
                ]
            }

            const result = calculationUtils.getBonusProductCountsForPromotion(basket, 'promo-123')

            expect(result.maxBonusItems).toBe(5) // 3 + 2
            expect(result.selectedBonusItems).toBe(3) // 2 + 1
        })

        test('returns zero counts when no data', () => {
            const result = calculationUtils.getBonusProductCountsForPromotion(null, 'promo-123')

            expect(result.maxBonusItems).toBe(0)
            expect(result.selectedBonusItems).toBe(0)
        })
    })

    describe('findAllBonusProductItemsToRemove', () => {
        test('finds all bonus products with same productId and promotionId across multiple discount line items', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 2},
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 1},
                    {id: 'bonus-3', promotionId: 'promo-456', maxBonusItems: 2}
                ],
                productItems: [
                    // Same product across multiple discount line items of same promotion - should all be removed
                    {
                        itemId: 'item-1',
                        productId: 'product-A',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-1',
                        quantity: 1
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-A',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-2',
                        quantity: 1
                    },
                    // Different product in same promotion - should not be removed
                    {
                        itemId: 'item-3',
                        productId: 'product-B',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-1',
                        quantity: 1
                    },
                    // Same product but different promotion - should not be removed
                    {
                        itemId: 'item-4',
                        productId: 'product-A',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-3',
                        quantity: 1
                    },
                    // Regular product - should not be removed
                    {
                        itemId: 'item-5',
                        productId: 'product-A',
                        bonusProductLineItem: false,
                        quantity: 1
                    }
                ]
            }

            const targetProduct = basket.productItems[0] // item-1

            const result = calculationUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

            expect(result).toHaveLength(2)
            expect(result).toEqual([
                expect.objectContaining({itemId: 'item-1', productId: 'product-A'}),
                expect.objectContaining({itemId: 'item-2', productId: 'product-A'})
            ])
        })

        test('returns only target item when no other matching items exist', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 2}
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-A',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-1',
                        quantity: 1
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-B',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-1',
                        quantity: 1
                    }
                ]
            }

            const targetProduct = basket.productItems[0]

            const result = calculationUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual(
                expect.objectContaining({itemId: 'item-1', productId: 'product-A'})
            )
        })

        test('returns empty array when target product is not a bonus product', () => {
            const basket = {
                bonusDiscountLineItems: [],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-A',
                        bonusProductLineItem: false,
                        quantity: 1
                    }
                ]
            }

            const targetProduct = basket.productItems[0]

            const result = calculationUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

            expect(result).toEqual([])
        })

        test('returns target item only when bonusDiscountLineItem not found (fallback)', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 2}
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-A',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-1',
                        quantity: 1
                    }
                ]
            }

            const targetProduct = basket.productItems[0]

            const result = calculationUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual(targetProduct)
        })

        test('returns empty array when basket or productItems is null/undefined', () => {
            expect(calculationUtils.findAllBonusProductItemsToRemove(null, {})).toEqual([])
            expect(calculationUtils.findAllBonusProductItemsToRemove(undefined, {})).toEqual([])
            expect(calculationUtils.findAllBonusProductItemsToRemove({}, {})).toEqual([])
        })

        test('returns empty array when target product is null/undefined', () => {
            const basket = {
                bonusDiscountLineItems: [],
                productItems: []
            }

            expect(calculationUtils.findAllBonusProductItemsToRemove(basket, null)).toEqual([])
            expect(calculationUtils.findAllBonusProductItemsToRemove(basket, undefined)).toEqual([])
        })
    })
})
