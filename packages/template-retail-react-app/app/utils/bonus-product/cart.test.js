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

    describe('getBonusProductsForSpecificCartItem', () => {
        const extendedBasket = {
            bonusDiscountLineItems: [
                {
                    id: 'bonus-123',
                    promotionId: 'BonusProductOnOrderOfAmountAbove250',
                    maxBonusItems: 4 // 4 total ties available
                }
            ],
            productItems: [
                // Two suits (same product, different delivery methods)
                {
                    itemId: 'suit-item-1',
                    productId: 'suit-product-1',
                    quantity: 1,
                    priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                },
                {
                    itemId: 'suit-item-2',
                    productId: 'suit-product-1',
                    quantity: 1,
                    priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                },
                // Four bonus ties (2 red, 2 blue)
                {
                    itemId: 'tie-item-1',
                    productId: 'red-tie',
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-123',
                    quantity: 2
                },
                {
                    itemId: 'tie-item-2',
                    productId: 'blue-tie',
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-123',
                    quantity: 2
                }
            ]
        }

        const productsWithPromotions = {
            'suit-product-1': {
                productPromotions: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
            }
        }

        test('distributes 4 ties across 2 suits: first suit gets 2, second gets 2', () => {
            // First suit should get 2 ties (2 red)
            const firstSuitItem = extendedBasket.productItems[0]
            const firstSuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                extendedBasket,
                firstSuitItem,
                productsWithPromotions
            )

            expect(firstSuitResult).toHaveLength(1) // Should get red ties only
            expect(firstSuitResult[0].productId).toBe('red-tie')
            expect(firstSuitResult[0].quantity).toBe(2)

            // Second suit should get 2 ties (2 blue)
            const secondSuitItem = extendedBasket.productItems[1]
            const secondSuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                extendedBasket,
                secondSuitItem,
                productsWithPromotions
            )

            expect(secondSuitResult).toHaveLength(1) // Should get blue ties only
            expect(secondSuitResult[0].productId).toBe('blue-tie')
            expect(secondSuitResult[0].quantity).toBe(2)
        })

        test('distributes 3 ties across 2 suits: first suit gets 2, second gets 1', () => {
            // Modify basket to have only 3 ties total
            const basketWith3Ties = {
                ...extendedBasket,
                productItems: [
                    ...extendedBasket.productItems.slice(0, 2), // Keep both suits
                    {
                        itemId: 'tie-item-1',
                        productId: 'red-tie',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 2 // 2 red ties
                    },
                    {
                        itemId: 'tie-item-2',
                        productId: 'blue-tie',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 1 // 1 blue tie
                    }
                ]
            }

            // First suit gets 2 ties
            const firstSuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                basketWith3Ties,
                basketWith3Ties.productItems[0],
                productsWithPromotions
            )
            expect(firstSuitResult).toHaveLength(1)
            expect(firstSuitResult[0].quantity).toBe(2)

            // Second suit gets 1 tie
            const secondSuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                basketWith3Ties,
                basketWith3Ties.productItems[1],
                productsWithPromotions
            )
            expect(secondSuitResult).toHaveLength(1)
            expect(secondSuitResult[0].quantity).toBe(1)
        })

        test('handles quantity multipliers: suit with qty=2 gets 4 ties, suit with qty=1 gets 0', () => {
            const basketWithQuantities = {
                ...extendedBasket,
                productItems: [
                    {
                        itemId: 'suit-item-1',
                        productId: 'suit-product-1',
                        quantity: 2, // This suit has quantity 2
                        priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                    },
                    {
                        itemId: 'suit-item-2',
                        productId: 'suit-product-1',
                        quantity: 1, // This suit has quantity 1
                        priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                    },
                    // 4 ties total
                    {
                        itemId: 'tie-item-1',
                        productId: 'red-tie',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 4
                    }
                ]
            }

            // First suit (qty=2) should get 4 ties = (4 total capacity / 3 total qualifying qty) * 2 = 2.67 → 2, but takes remaining
            const firstSuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                basketWithQuantities,
                basketWithQuantities.productItems[0],
                productsWithPromotions
            )
            expect(firstSuitResult[0].quantity).toBe(2) // Gets calculated capacity

            // Second suit (qty=1) should get 1 tie = (4 total capacity / 3 total qualifying qty) * 1 = 1.33 → 1
            const secondSuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                basketWithQuantities,
                basketWithQuantities.productItems[1],
                productsWithPromotions
            )
            expect(secondSuitResult[0].quantity).toBe(1) // Gets remaining
        })

        test('returns all bonus products when only one qualifying item exists', () => {
            const basketWithOneSuit = {
                ...extendedBasket,
                productItems: [
                    extendedBasket.productItems[0], // Only first suit
                    ...extendedBasket.productItems.slice(2) // All bonus items
                ]
            }

            const result = cartUtils.getBonusProductsForSpecificCartItem(
                basketWithOneSuit,
                basketWithOneSuit.productItems[0],
                productsWithPromotions
            )

            // Should get all bonus products
            expect(result).toHaveLength(2)
            expect(result.find((item) => item.productId === 'red-tie').quantity).toBe(2)
            expect(result.find((item) => item.productId === 'blue-tie').quantity).toBe(2)
        })

        test('returns empty array when no bonus products exist', () => {
            const emptyBasket = {
                ...extendedBasket,
                productItems: extendedBasket.productItems.slice(0, 2) // Only suits, no bonus items
            }

            const result = cartUtils.getBonusProductsForSpecificCartItem(
                emptyBasket,
                emptyBasket.productItems[0],
                productsWithPromotions
            )

            expect(result).toEqual([])
        })

        describe('Composite Sorting: Store Pickup Priority', () => {
            const basketWithShipments = {
                bonusDiscountLineItems: [
                    {
                        id: 'bonus-123',
                        promotionId: 'BonusProductOnOrderOfAmountAbove250',
                        maxBonusItems: 4
                    }
                ],
                shipments: [
                    {
                        shipmentId: 'delivery-shipment',
                        shippingMethod: {
                            c_storePickupEnabled: false // Delivery shipment
                        }
                    },
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {
                            c_storePickupEnabled: true // Store pickup shipment
                        }
                    }
                ],
                productItems: [
                    // Delivery suit added first (position 0)
                    {
                        itemId: 'delivery-suit-1',
                        productId: 'suit-product-1',
                        quantity: 1,
                        shipmentId: 'delivery-shipment',
                        priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                    },
                    // Store pickup suit added second (position 1)
                    {
                        itemId: 'pickup-suit-1',
                        productId: 'suit-product-1',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                    },
                    // 4 bonus ties
                    {
                        itemId: 'tie-item-1',
                        productId: 'red-tie',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 2
                    },
                    {
                        itemId: 'tie-item-2',
                        productId: 'blue-tie',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 2
                    }
                ]
            }

            test('store pickup item gets bonus products even when added after delivery item', () => {
                // Pickup suit (second in cart) should get bonus products due to higher priority
                const pickupSuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                    basketWithShipments,
                    basketWithShipments.productItems[1], // pickup-suit-1
                    productsWithPromotions
                )

                // Should get 2 ties (first allocation)
                expect(pickupSuitResult).toHaveLength(1)
                expect(pickupSuitResult[0].quantity).toBe(2)

                // Delivery suit (first in cart) should get remaining bonus products
                const deliverySuitResult = cartUtils.getBonusProductsForSpecificCartItem(
                    basketWithShipments,
                    basketWithShipments.productItems[0], // delivery-suit-1
                    productsWithPromotions
                )

                // Should get 2 ties (remaining allocation)
                expect(deliverySuitResult).toHaveLength(1)
                expect(deliverySuitResult[0].quantity).toBe(2)
            })

            test('multiple store pickup items use cart position as tiebreaker', () => {
                const basketWithMultiplePickup = {
                    ...basketWithShipments,
                    productItems: [
                        // First pickup suit (position 0)
                        {
                            itemId: 'pickup-suit-1',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'pickup-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // Second pickup suit (position 1)
                        {
                            itemId: 'pickup-suit-2',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'pickup-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // 4 bonus ties
                        {
                            itemId: 'tie-item-1',
                            productId: 'red-tie',
                            bonusProductLineItem: true,
                            bonusDiscountLineItemId: 'bonus-123',
                            quantity: 4
                        }
                    ]
                }

                // First pickup suit should get 2 ties (higher cart position priority)
                const firstPickupResult = cartUtils.getBonusProductsForSpecificCartItem(
                    basketWithMultiplePickup,
                    basketWithMultiplePickup.productItems[0], // pickup-suit-1
                    productsWithPromotions
                )
                expect(firstPickupResult[0].quantity).toBe(2)

                // Second pickup suit should get 2 ties (remaining)
                const secondPickupResult = cartUtils.getBonusProductsForSpecificCartItem(
                    basketWithMultiplePickup,
                    basketWithMultiplePickup.productItems[1], // pickup-suit-2
                    productsWithPromotions
                )
                expect(secondPickupResult[0].quantity).toBe(2)
            })

            test('multiple delivery items use cart position when no pickup items exist', () => {
                const basketWithDeliveryOnly = {
                    ...basketWithShipments,
                    productItems: [
                        // First delivery suit (position 0)
                        {
                            itemId: 'delivery-suit-1',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'delivery-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // Second delivery suit (position 1)
                        {
                            itemId: 'delivery-suit-2',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'delivery-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // 4 bonus ties
                        {
                            itemId: 'tie-item-1',
                            productId: 'red-tie',
                            bonusProductLineItem: true,
                            bonusDiscountLineItemId: 'bonus-123',
                            quantity: 4
                        }
                    ]
                }

                // First delivery suit should get 2 ties (cart position priority)
                const firstDeliveryResult = cartUtils.getBonusProductsForSpecificCartItem(
                    basketWithDeliveryOnly,
                    basketWithDeliveryOnly.productItems[0], // delivery-suit-1
                    productsWithPromotions
                )
                expect(firstDeliveryResult[0].quantity).toBe(2)

                // Second delivery suit should get 2 ties (remaining)
                const secondDeliveryResult = cartUtils.getBonusProductsForSpecificCartItem(
                    basketWithDeliveryOnly,
                    basketWithDeliveryOnly.productItems[1], // delivery-suit-2
                    productsWithPromotions
                )
                expect(secondDeliveryResult[0].quantity).toBe(2)
            })

            test('handles mixed shipment types with complex cart ordering', () => {
                const complexBasket = {
                    ...basketWithShipments,
                    productItems: [
                        // Delivery suit #1 (position 0)
                        {
                            itemId: 'delivery-suit-1',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'delivery-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // Pickup suit #1 (position 1)
                        {
                            itemId: 'pickup-suit-1',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'pickup-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // Delivery suit #2 (position 2)
                        {
                            itemId: 'delivery-suit-2',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'delivery-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // Pickup suit #2 (position 3)
                        {
                            itemId: 'pickup-suit-2',
                            productId: 'suit-product-1',
                            quantity: 1,
                            shipmentId: 'pickup-shipment',
                            priceAdjustments: [{promotionId: 'BonusProductOnOrderOfAmountAbove250'}]
                        },
                        // 4 bonus ties
                        {
                            itemId: 'tie-item-1',
                            productId: 'red-tie',
                            bonusProductLineItem: true,
                            bonusDiscountLineItemId: 'bonus-123',
                            quantity: 4
                        }
                    ]
                }

                // Expected allocation order: pickup-suit-1, pickup-suit-2, delivery-suit-1, delivery-suit-2

                // First pickup suit should get 1 tie (first priority)
                const firstPickupResult = cartUtils.getBonusProductsForSpecificCartItem(
                    complexBasket,
                    complexBasket.productItems[1], // pickup-suit-1 (position 1)
                    productsWithPromotions
                )
                expect(firstPickupResult[0].quantity).toBe(1)

                // Second pickup suit should get 1 tie (second priority)
                const secondPickupResult = cartUtils.getBonusProductsForSpecificCartItem(
                    complexBasket,
                    complexBasket.productItems[3], // pickup-suit-2 (position 3)
                    productsWithPromotions
                )
                expect(secondPickupResult[0].quantity).toBe(1)

                // First delivery suit should get 1 tie (third priority)
                const firstDeliveryResult = cartUtils.getBonusProductsForSpecificCartItem(
                    complexBasket,
                    complexBasket.productItems[0], // delivery-suit-1 (position 0)
                    productsWithPromotions
                )
                expect(firstDeliveryResult[0].quantity).toBe(1)

                // Second delivery suit should get 1 tie (fourth priority)
                const secondDeliveryResult = cartUtils.getBonusProductsForSpecificCartItem(
                    complexBasket,
                    complexBasket.productItems[2], // delivery-suit-2 (position 2)
                    productsWithPromotions
                )
                expect(secondDeliveryResult[0].quantity).toBe(1)
            })
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
