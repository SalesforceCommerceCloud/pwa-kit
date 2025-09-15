/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as bonusProductUtils from '@salesforce/retail-react-app/app/utils/bonus-product-utils'

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

        // Template function for testing bonus product combining
        const testBonusProductCombining = (
            testCase,
            bonusProducts,
            expectedResults,
            customPromotions = mockProductsWithPromotions
        ) => {
            it(`combines bonus products correctly: ${testCase}`, () => {
                const basketWithBonusProducts = {
                    ...mockBasket,
                    productItems: [...mockBasket.productItems, ...bonusProducts]
                }

                const result = bonusProductUtils.getBonusProductsInCartForProduct(
                    basketWithBonusProducts,
                    'prod-123',
                    customPromotions
                )

                expect(result).toHaveLength(expectedResults.length)

                expectedResults.forEach((expected, index) => {
                    const actualProduct = expected.productId
                        ? result.find((item) => item.productId === expected.productId)
                        : result[index]

                    Object.entries(expected).forEach(([key, value]) => {
                        expect(actualProduct[key]).toBe(value)
                    })
                })
            })
        }

        testBonusProductCombining(
            'identical products aggregate quantities',
            [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-prod-456',
                    productName: 'Striped Silk Tie',
                    bonusProductLineItem: true,
                    quantity: 1
                },
                {
                    itemId: 'bonus-item-2',
                    productId: 'bonus-prod-456',
                    productName: 'Striped Silk Tie',
                    bonusProductLineItem: true,
                    quantity: 2
                },
                {
                    itemId: 'bonus-item-3',
                    productId: 'bonus-prod-456',
                    productName: 'Striped Silk Tie',
                    bonusProductLineItem: true,
                    quantity: 1
                }
            ],
            [
                {
                    productId: 'bonus-prod-456',
                    quantity: 4, // 1 + 2 + 1 = 4
                    bonusProductLineItem: true,
                    productName: 'Striped Silk Tie'
                }
            ]
        )

        testBonusProductCombining(
            'different productIds stay separate',
            [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-prod-456',
                    productName: 'Striped Silk Tie',
                    bonusProductLineItem: true,
                    quantity: 2
                },
                {
                    itemId: 'bonus-item-2',
                    productId: 'bonus-prod-456',
                    productName: 'Striped Silk Tie',
                    bonusProductLineItem: true,
                    quantity: 1
                },
                {
                    itemId: 'bonus-item-3',
                    productId: 'bonus-prod-789',
                    productName: 'Different Bonus Product',
                    bonusProductLineItem: true,
                    quantity: 3
                }
            ],
            [
                {
                    productId: 'bonus-prod-456',
                    quantity: 3, // 2 + 1 = 3
                    productName: 'Striped Silk Tie'
                },
                {
                    productId: 'bonus-prod-789',
                    quantity: 3,
                    productName: 'Different Bonus Product'
                }
            ],
            {
                ...mockProductsWithPromotions,
                'bonus-prod-789': {
                    id: 'bonus-prod-789',
                    productPromotions: [
                        {
                            promotionId: 'BonusProductOnOrderOfAmountAbove250',
                            calloutMsg: 'Another bonus product!'
                        }
                    ]
                }
            }
        )

        testBonusProductCombining(
            'zero or undefined quantities',
            [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-prod-456',
                    bonusProductLineItem: true,
                    quantity: 0
                },
                {
                    itemId: 'bonus-item-2',
                    productId: 'bonus-prod-456',
                    bonusProductLineItem: true,
                    quantity: undefined
                },
                {
                    itemId: 'bonus-item-3',
                    productId: 'bonus-prod-456',
                    bonusProductLineItem: true,
                    quantity: 2
                }
            ],
            [
                {
                    productId: 'bonus-prod-456',
                    quantity: 2 // 0 + 0 + 2 = 2 (undefined treated as 0)
                }
            ]
        )

        testBonusProductCombining(
            'preserves properties from first occurrence',
            [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-prod-456',
                    productName: 'Striped Silk Tie',
                    bonusProductLineItem: true,
                    quantity: 1,
                    price: 19.19,
                    bonusDiscountLineItemId: 'discount-123',
                    customProperty: 'first-item-value'
                },
                {
                    itemId: 'bonus-item-2',
                    productId: 'bonus-prod-456',
                    productName: 'Striped Silk Tie',
                    bonusProductLineItem: true,
                    quantity: 2,
                    price: 19.19,
                    bonusDiscountLineItemId: 'discount-456',
                    customProperty: 'second-item-value'
                }
            ],
            [
                {
                    productId: 'bonus-prod-456',
                    quantity: 3, // 1 + 2 = 3
                    price: 19.19,
                    bonusDiscountLineItemId: 'discount-123', // From first item
                    customProperty: 'first-item-value', // From first item
                    itemId: 'bonus-item-1' // From first item
                }
            ]
        )
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

        test('checks if product is available as bonus product', () => {
            // Test with product that is available as bonus
            const isAvailableAsBonus = bonusProductUtils.isProductAvailableAsBonus(
                mockBasket,
                'bonus-prod-456'
            )
            expect(isAvailableAsBonus).toBe(true)

            // Test with product that is not available as bonus
            const isNotAvailableAsBonus = bonusProductUtils.isProductAvailableAsBonus(
                mockBasket,
                'prod-123'
            )
            expect(isNotAvailableAsBonus).toBe(false)

            // Test with null basket
            const isNotAvailableNull = bonusProductUtils.isProductAvailableAsBonus(
                null,
                'bonus-prod-456'
            )
            expect(isNotAvailableNull).toBe(false)
        })

        test('determines if product should show bonus product selection', () => {
            // Test with qualifying product (has promotions but not available as bonus)
            const shouldShow = bonusProductUtils.shouldShowBonusProductSelection(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )
            expect(shouldShow).toBe(true)

            // Test with bonus product (has promotions and is available as bonus)
            const shouldNotShow = bonusProductUtils.shouldShowBonusProductSelection(
                mockBasket,
                'bonus-prod-456',
                mockProductsWithPromotions
            )
            expect(shouldNotShow).toBe(false)

            // Test with product that has no promotions
            const shouldNotShowNoPromo = bonusProductUtils.shouldShowBonusProductSelection(
                mockBasket,
                'non-existent',
                mockProductsWithPromotions
            )
            expect(shouldNotShowNoPromo).toBe(false)
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

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
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

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
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

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
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

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([])
        })

        test('returns empty array when basket is null or undefined', () => {
            expect(
                bonusProductUtils.findAvailableBonusDiscountLineItemIds(null, 'promo-123')
            ).toEqual([])
            expect(
                bonusProductUtils.findAvailableBonusDiscountLineItemIds(undefined, 'promo-123')
            ).toEqual([])
        })

        test('returns empty array when promotionId is null or undefined', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3}
                ],
                productItems: []
            }

            expect(bonusProductUtils.findAvailableBonusDiscountLineItemIds(basket, null)).toEqual(
                []
            )
            expect(
                bonusProductUtils.findAvailableBonusDiscountLineItemIds(basket, undefined)
            ).toEqual([])
        })

        test('returns empty array when no bonusDiscountLineItems exist', () => {
            const basket = {
                productItems: []
            }

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([])
        })

        test('handles missing maxBonusItems (defaults to 0)', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123'} // No maxBonusItems
                ],
                productItems: []
            }

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([])
        })

        test('handles missing productItems array', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 3}
                ]
                // No productItems array
            }

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([
                ['bonus-1', 3] // 3 max - 0 selected = 3 available
            ])
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

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([
                ['bonus-1', 2] // 3 max - 1 selected = 2 available (ignores non-bonus item)
            ])
        })

        test('handles mixed scenario with partial and full capacity', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 4},
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 2},
                    {id: 'bonus-3', promotionId: 'promo-123', maxBonusItems: 1}
                ],
                productItems: [
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 1},
                    {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-2', quantity: 2}
                    // bonus-3 has no items yet
                ]
            }

            const result = bonusProductUtils.findAvailableBonusDiscountLineItemIds(
                basket,
                'promo-123'
            )

            expect(result).toEqual([
                ['bonus-1', 3], // 4 max - 1 selected = 3 available
                ['bonus-3', 1] // 1 max - 0 selected = 1 available
                // bonus-2 excluded because 2 max - 2 selected = 0 available
            ])
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

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

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

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

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

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

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

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual(targetProduct)
        })

        test('handles multiple quantities correctly', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {id: 'bonus-1', promotionId: 'promo-123', maxBonusItems: 4},
                    {id: 'bonus-2', promotionId: 'promo-123', maxBonusItems: 2}
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-A',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-1',
                        quantity: 3
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-A',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-2',
                        quantity: 2
                    }
                ]
            }

            const targetProduct = basket.productItems[0]

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

            expect(result).toHaveLength(2)
            expect(result[0].quantity).toBe(3)
            expect(result[1].quantity).toBe(2)
        })

        test('returns empty array when basket or productItems is null/undefined', () => {
            expect(bonusProductUtils.findAllBonusProductItemsToRemove(null, {})).toEqual([])
            expect(bonusProductUtils.findAllBonusProductItemsToRemove(undefined, {})).toEqual([])
            expect(bonusProductUtils.findAllBonusProductItemsToRemove({}, {})).toEqual([])
            expect(
                bonusProductUtils.findAllBonusProductItemsToRemove({productItems: []}, {})
            ).toEqual([])
        })

        test('returns empty array when target product is null/undefined', () => {
            const basket = {
                bonusDiscountLineItems: [],
                productItems: []
            }

            expect(bonusProductUtils.findAllBonusProductItemsToRemove(basket, null)).toEqual([])
            expect(bonusProductUtils.findAllBonusProductItemsToRemove(basket, undefined)).toEqual(
                []
            )
        })

        test('handles edge case with no bonusDiscountLineItems array', () => {
            const basket = {
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

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(basket, targetProduct)

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual(targetProduct)
        })

        test('finds all bonus products when qualifying product triggers removal (realistic promotion scenario)', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        id: 'bonus-discount-1',
                        promotionId: 'buy-1-get-2-bonus',
                        maxBonusItems: 16,
                        // This discount line item allows 16 bonus products based on 8 qualifying products
                        qualifyingProductIds: ['product1']
                    }
                ],
                productItems: [
                    // Qualifying product: 8 quantity of product1
                    {
                        itemId: 'qualifying-item-1',
                        productId: 'product1',
                        bonusProductLineItem: false,
                        quantity: 8
                    },
                    // Bonus products: 16 quantity of product2 (2 bonus per 1 qualifying)
                    {
                        itemId: 'bonus-item-1',
                        productId: 'product2',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-discount-1',
                        quantity: 10
                    },
                    {
                        itemId: 'bonus-item-2',
                        productId: 'product2',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-discount-1',
                        quantity: 6
                    },
                    // Unrelated product in cart
                    {
                        itemId: 'regular-item-1',
                        productId: 'product3',
                        bonusProductLineItem: false,
                        quantity: 2
                    }
                ]
            }

            // Simulate clicking remove on one of the bonus product items
            const targetBonusProduct = basket.productItems[1] // bonus-item-1

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(
                basket,
                targetBonusProduct
            )

            // Should find ALL bonus products with same productId and promotionId
            expect(result).toHaveLength(2)
            expect(result).toEqual([
                expect.objectContaining({
                    itemId: 'bonus-item-1',
                    productId: 'product2',
                    quantity: 10
                }),
                expect.objectContaining({
                    itemId: 'bonus-item-2',
                    productId: 'product2',
                    quantity: 6
                })
            ])

            // Verify total quantity that would be removed
            const totalQuantityToRemove = result.reduce((sum, item) => sum + item.quantity, 0)
            expect(totalQuantityToRemove).toBe(16) // All 16 bonus products should be removed
        })

        test('removes only bonus products when clicking remove on bonus product (mixed bonus and regular products)', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        id: 'bonus-discount-1',
                        promotionId: 'buy-1-get-2-free',
                        maxBonusItems: 6,
                        qualifyingProductIds: ['product1']
                    }
                ],
                productItems: [
                    // Qualifying product: 3 quantity of product1
                    {
                        itemId: 'qualifying-item-1',
                        productId: 'product1',
                        bonusProductLineItem: false,
                        quantity: 3
                    },
                    // Bonus products: 6 quantity of product2 (2 bonus per 1 qualifying × 3 qualifying)
                    {
                        itemId: 'bonus-product2-item-1',
                        productId: 'product2',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-discount-1',
                        quantity: 4
                    },
                    {
                        itemId: 'bonus-product2-item-2',
                        productId: 'product2',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-discount-1',
                        quantity: 2
                    },
                    // Regular (non-bonus) products: 3 quantity of product2 added separately
                    {
                        itemId: 'regular-product2-item-1',
                        productId: 'product2',
                        bonusProductLineItem: false,
                        quantity: 3
                    }
                ]
            }

            // Simulate clicking remove on one of the bonus product2 items
            const targetBonusProduct = basket.productItems[1] // bonus-product2-item-1

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(
                basket,
                targetBonusProduct
            )

            // Should find ONLY bonus products with same productId, NOT regular products
            expect(result).toHaveLength(2)
            expect(result).toEqual([
                expect.objectContaining({
                    itemId: 'bonus-product2-item-1',
                    productId: 'product2',
                    bonusProductLineItem: true,
                    quantity: 4
                }),
                expect.objectContaining({
                    itemId: 'bonus-product2-item-2',
                    productId: 'product2',
                    bonusProductLineItem: true,
                    quantity: 2
                })
            ])

            // Verify that regular product2s are NOT included
            const regularProducts = result.filter((item) => item.bonusProductLineItem === false)
            expect(regularProducts).toHaveLength(0)

            // Verify total bonus quantity that would be removed
            const totalBonusQuantityToRemove = result.reduce((sum, item) => sum + item.quantity, 0)
            expect(totalBonusQuantityToRemove).toBe(6) // All 6 bonus product2s should be removed
        })

        test('returns empty array when clicking remove on regular (non-bonus) product', () => {
            const basket = {
                bonusDiscountLineItems: [
                    {
                        id: 'bonus-discount-1',
                        promotionId: 'buy-1-get-2-free',
                        maxBonusItems: 6,
                        qualifyingProductIds: ['product1']
                    }
                ],
                productItems: [
                    // Qualifying product: 3 quantity of product1
                    {
                        itemId: 'qualifying-item-1',
                        productId: 'product1',
                        bonusProductLineItem: false,
                        quantity: 3
                    },
                    // Bonus products: 6 quantity of product2 (2 bonus per 1 qualifying × 3 qualifying)
                    {
                        itemId: 'bonus-product2-item-1',
                        productId: 'product2',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-discount-1',
                        quantity: 4
                    },
                    {
                        itemId: 'bonus-product2-item-2',
                        productId: 'product2',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-discount-1',
                        quantity: 2
                    },
                    // Regular (non-bonus) products: 3 quantity of product2 added separately
                    {
                        itemId: 'regular-product2-item-1',
                        productId: 'product2',
                        bonusProductLineItem: false,
                        quantity: 3
                    }
                ]
            }

            // Simulate clicking remove on the regular (non-bonus) product2 item
            const targetRegularProduct = basket.productItems[3] // regular-product2-item-1

            const result = bonusProductUtils.findAllBonusProductItemsToRemove(
                basket,
                targetRegularProduct
            )

            // Should return empty array because target is not a bonus product
            expect(result).toEqual([])

            // Verify that bonus products would remain untouched
            const bonusProducts = basket.productItems.filter(
                (item) => item.bonusProductLineItem === true
            )
            expect(bonusProducts).toHaveLength(2) // Both bonus product items should still exist

            const totalBonusQuantity = bonusProducts.reduce((sum, item) => sum + item.quantity, 0)
            expect(totalBonusQuantity).toBe(6) // All 6 bonus quantities should remain
        })
    })
})
