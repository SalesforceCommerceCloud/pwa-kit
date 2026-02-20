/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as discoveryUtils from '@salesforce/retail-react-app/app/utils/bonus-product/discovery'

describe('Bonus Product Discovery', () => {
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
                    calloutMsg: 'Buy $250+ and get free bonus products!'
                }
            ]
        }
    }

    describe('getAvailableBonusItemsForProduct', () => {
        test('returns available bonus items using enhanced product data', () => {
            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                productId: 'bonus-prod-456',
                promotionId: 'BonusProductOnOrderOfAmountAbove250',
                discountLineItemId: 'bonus-123'
            })
        })

        test('returns empty array when no matching promotions', () => {
            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                mockBasket,
                'prod-nonexistent',
                mockProductsWithPromotions
            )

            expect(result).toEqual([])
        })
    })

    describe('getRemainingAvailableBonusProductsForProduct', () => {
        test('calculates remaining bonus products correctly', () => {
            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.bonusItems).toHaveLength(1)
            expect(result.aggregatedMaxBonusItems).toBe(2)
            expect(result.aggregatedSelectedItems).toBe(0)
            expect(result.hasRemainingCapacity).toBe(true)
        })

        test('filters out bonus items with zero remaining count', () => {
            const basketWithBonusItems = {
                ...mockBasket,
                productItems: [
                    ...mockBasket.productItems,
                    // Add bonus items that fill the capacity
                    {
                        productId: 'bonus-prod-456',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 2
                    }
                ]
            }

            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                basketWithBonusItems,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.bonusItems).toHaveLength(0)
            expect(result.hasRemainingCapacity).toBe(false)
        })

        test('shows remaining capacity with no bonus products selected', () => {
            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                mockBasket,
                'prod-123',
                mockProductsWithPromotions
            )

            expect(result.hasRemainingCapacity).toBe(true)
            expect(result.aggregatedSelectedItems).toBe(0)
        })
    })

    describe('findAvailableBonusDiscountLineItemIds', () => {
        test('returns pairs with available capacity for matching promotion', () => {
            const result = discoveryUtils.findAvailableBonusDiscountLineItemIds(
                mockBasket,
                'BonusProductOnOrderOfAmountAbove250'
            )

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual(['bonus-123', 2])
        })

        test('excludes pairs with zero available capacity', () => {
            const basketWithFullCapacity = {
                ...mockBasket,
                productItems: [
                    ...mockBasket.productItems,
                    {
                        productId: 'bonus-prod-456',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-123',
                        quantity: 2
                    }
                ]
            }

            const result = discoveryUtils.findAvailableBonusDiscountLineItemIds(
                basketWithFullCapacity,
                'BonusProductOnOrderOfAmountAbove250'
            )

            expect(result).toEqual([])
        })

        test('returns empty array when no matching promotion found', () => {
            const result = discoveryUtils.findAvailableBonusDiscountLineItemIds(
                mockBasket,
                'NonexistentPromotion'
            )

            expect(result).toEqual([])
        })
    })

    describe('Rule-Based Promotions Support', () => {
        const mockRuleBasedBasket = {
            bonusDiscountLineItems: [
                {
                    id: 'rule-based-123',
                    promotionId: 'rule-based-promo',
                    maxBonusItems: 3,
                    bonusProducts: [] // Empty array indicates rule-based
                }
            ],
            productItems: [
                {
                    productId: 'prod-456',
                    priceAdjustments: [{promotionId: 'rule-based-promo', price: -15}]
                }
            ]
        }

        const mockProductsForRuleBased = {
            'prod-456': {
                id: 'prod-456',
                productPromotions: [
                    {
                        promotionId: 'rule-based-promo',
                        calloutMsg: 'Get choice of bonus from Electronics category!'
                    }
                ]
            }
        }

        const mockRuleBasedProductsMap = {
            'rule-based-promo': [
                {productId: 'rule-product-1', productName: 'Rule Product 1'},
                {productId: 'rule-product-2', productName: 'Rule Product 2'},
                {productId: 'rule-product-3', productName: 'Rule Product 3'}
            ]
        }

        const mockRuleBasedQualifyingProductsMap = {
            'rule-based-promo': new Set(['prod-456']) // prod-456 qualifies for the promotion
        }

        describe('getAvailableBonusItemsForProduct with rule-based products', () => {
            test('returns rule-based products from ruleBasedProductsMap', () => {
                const result = discoveryUtils.getAvailableBonusItemsForProduct(
                    mockRuleBasedBasket,
                    'prod-456',
                    mockProductsForRuleBased,
                    mockRuleBasedProductsMap,
                    mockRuleBasedQualifyingProductsMap
                )

                expect(result).toHaveLength(3)
                expect(result[0]).toEqual({
                    productId: 'rule-product-1',
                    productName: 'Rule Product 1',
                    promotionId: 'rule-based-promo',
                    discountLineItemId: 'rule-based-123'
                })
                expect(result[1].productId).toBe('rule-product-2')
                expect(result[2].productId).toBe('rule-product-3')
            })

            test('returns empty array when ruleBasedProductsMap is not provided', () => {
                const result = discoveryUtils.getAvailableBonusItemsForProduct(
                    mockRuleBasedBasket,
                    'prod-456',
                    mockProductsForRuleBased
                    // No ruleBasedProductsMap provided
                )

                expect(result).toEqual([])
            })

            test('handles mixed list-based and rule-based promotions', () => {
                const mixedBasket = {
                    bonusDiscountLineItems: [
                        {
                            id: 'list-based-123',
                            promotionId: 'list-based-promo',
                            maxBonusItems: 1,
                            bonusProducts: [{productId: 'list-product-1'}]
                        },
                        {
                            id: 'rule-based-456',
                            promotionId: 'rule-based-promo',
                            maxBonusItems: 2,
                            bonusProducts: [] // Rule-based
                        }
                    ],
                    productItems: []
                }

                const mixedProducts = {
                    'prod-789': {
                        id: 'prod-789',
                        productPromotions: [
                            {promotionId: 'list-based-promo'},
                            {promotionId: 'rule-based-promo'}
                        ]
                    }
                }

                const mixedQualifyingMap = {
                    'list-based-promo': new Set(['prod-789']),
                    'rule-based-promo': new Set(['prod-789'])
                }

                const result = discoveryUtils.getAvailableBonusItemsForProduct(
                    mixedBasket,
                    'prod-789',
                    mixedProducts,
                    mockRuleBasedProductsMap,
                    mixedQualifyingMap
                )

                expect(result).toHaveLength(4) // 1 list-based + 3 rule-based
                expect(result[0].productId).toBe('list-product-1')
                expect(result[1].productId).toBe('rule-product-1')
                expect(result[2].productId).toBe('rule-product-2')
                expect(result[3].productId).toBe('rule-product-3')
            })
        })

        describe('getRemainingAvailableBonusProductsForProduct with rule-based products', () => {
            test('calculates remaining count for rule-based products', () => {
                const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                    mockRuleBasedBasket,
                    'prod-456',
                    mockProductsForRuleBased,
                    mockRuleBasedProductsMap,
                    mockRuleBasedQualifyingProductsMap
                )

                expect(result.bonusItems).toHaveLength(3)
                expect(result.aggregatedMaxBonusItems).toBe(3)
                expect(result.aggregatedSelectedItems).toBe(0)
                expect(result.hasRemainingCapacity).toBe(true)
                expect(result.bonusItems[0].remainingBonusItemsCount).toBe(3)
            })

            test('filters out rule-based products when capacity is full', () => {
                const basketWithBonusItems = {
                    ...mockRuleBasedBasket,
                    productItems: [
                        ...mockRuleBasedBasket.productItems,
                        {
                            productId: 'rule-product-1',
                            bonusProductLineItem: true,
                            bonusDiscountLineItemId: 'rule-based-123',
                            quantity: 3 // Fill the capacity
                        }
                    ]
                }

                const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                    basketWithBonusItems,
                    'prod-456',
                    mockProductsForRuleBased,
                    mockRuleBasedProductsMap,
                    mockRuleBasedQualifyingProductsMap
                )

                expect(result.bonusItems).toEqual([])
                expect(result.aggregatedMaxBonusItems).toBe(3)
                expect(result.aggregatedSelectedItems).toBe(3)
                expect(result.hasRemainingCapacity).toBe(false)
            })

            test('handles mixed promotions with different remaining counts', () => {
                const mixedBasket = {
                    bonusDiscountLineItems: [
                        {
                            id: 'list-based-123',
                            promotionId: 'list-based-promo',
                            maxBonusItems: 2,
                            bonusProducts: [{productId: 'list-product-1'}]
                        },
                        {
                            id: 'rule-based-456',
                            promotionId: 'rule-based-promo',
                            maxBonusItems: 3,
                            bonusProducts: []
                        }
                    ],
                    productItems: [
                        {
                            productId: 'list-product-1',
                            bonusProductLineItem: true,
                            bonusDiscountLineItemId: 'list-based-123',
                            quantity: 1 // 1 of 2 used
                        }
                    ]
                }

                const mixedProducts = {
                    'prod-789': {
                        id: 'prod-789',
                        productPromotions: [
                            {promotionId: 'list-based-promo'},
                            {promotionId: 'rule-based-promo'}
                        ]
                    }
                }

                const mixedQualifyingMap = {
                    'list-based-promo': new Set(['prod-789']),
                    'rule-based-promo': new Set(['prod-789'])
                }

                const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                    mixedBasket,
                    'prod-789',
                    mixedProducts,
                    mockRuleBasedProductsMap,
                    mixedQualifyingMap
                )

                // List-based has 1 remaining, rule-based has 3 remaining
                expect(result.bonusItems).toHaveLength(4)
                expect(result.aggregatedMaxBonusItems).toBe(5)
                expect(result.aggregatedSelectedItems).toBe(1)
                expect(result.hasRemainingCapacity).toBe(true)

                // Check that list-based product has remainingCount of 1
                const listBasedItem = result.bonusItems.find(
                    (item) => item.productId === 'list-product-1'
                )
                expect(listBasedItem.remainingBonusItemsCount).toBe(1)

                // Check that rule-based products have remainingCount of 3
                const ruleBasedItem = result.bonusItems.find(
                    (item) => item.productId === 'rule-product-1'
                )
                expect(ruleBasedItem.remainingBonusItemsCount).toBe(3)
            })
        })
    })

    describe('Backward Compatibility with List-Based Promotions', () => {
        test('getAvailableBonusItemsForProduct works without ruleBasedProductsMap parameter', () => {
            const listBasedBasket = {
                bonusDiscountLineItems: [
                    {
                        id: 'list-123',
                        promotionId: 'list-promo',
                        maxBonusItems: 2,
                        bonusProducts: [
                            {productId: 'list-product-1', productName: 'List Product 1'},
                            {productId: 'list-product-2', productName: 'List Product 2'}
                        ]
                    }
                ],
                productItems: []
            }

            const listBasedProducts = {
                'prod-100': {
                    id: 'prod-100',
                    productPromotions: [{promotionId: 'list-promo'}]
                }
            }

            // Call without ruleBasedProductsMap - should still work for list-based
            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                listBasedBasket,
                'prod-100',
                listBasedProducts
            )

            expect(result).toHaveLength(2)
            expect(result[0].productId).toBe('list-product-1')
            expect(result[1].productId).toBe('list-product-2')
        })

        test('getRemainingAvailableBonusProductsForProduct works without ruleBasedProductsMap parameter', () => {
            const listBasedBasket = {
                bonusDiscountLineItems: [
                    {
                        id: 'list-456',
                        promotionId: 'list-promo-2',
                        maxBonusItems: 3,
                        bonusProducts: [
                            {productId: 'bonus-a', productName: 'Bonus A'},
                            {productId: 'bonus-b', productName: 'Bonus B'},
                            {productId: 'bonus-c', productName: 'Bonus C'}
                        ]
                    }
                ],
                productItems: [
                    {
                        productId: 'bonus-a',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'list-456',
                        quantity: 1
                    }
                ]
            }

            const listBasedProducts = {
                'prod-200': {
                    id: 'prod-200',
                    productPromotions: [{promotionId: 'list-promo-2'}]
                }
            }

            // Call without ruleBasedProductsMap - should calculate remaining correctly
            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                listBasedBasket,
                'prod-200',
                listBasedProducts
            )

            expect(result.bonusItems).toHaveLength(3)
            expect(result.aggregatedMaxBonusItems).toBe(3)
            expect(result.aggregatedSelectedItems).toBe(1)
            expect(result.hasRemainingCapacity).toBe(true)
            expect(result.bonusItems[0].remainingBonusItemsCount).toBe(2)
        })

        test('existing list-based promotions return same results with empty ruleBasedProductsMap', () => {
            const listBasedBasket = {
                bonusDiscountLineItems: [
                    {
                        id: 'legacy-promo',
                        promotionId: 'legacy-promotion',
                        maxBonusItems: 1,
                        bonusProducts: [
                            {productId: 'legacy-product', productName: 'Legacy Product'}
                        ]
                    }
                ],
                productItems: []
            }

            const listBasedProducts = {
                'prod-300': {
                    id: 'prod-300',
                    productPromotions: [{promotionId: 'legacy-promotion'}]
                }
            }

            // Results should be identical with or without empty map
            const resultWithoutMap = discoveryUtils.getAvailableBonusItemsForProduct(
                listBasedBasket,
                'prod-300',
                listBasedProducts
            )

            const resultWithEmptyMap = discoveryUtils.getAvailableBonusItemsForProduct(
                listBasedBasket,
                'prod-300',
                listBasedProducts,
                {}
            )

            expect(resultWithoutMap).toEqual(resultWithEmptyMap)
            expect(resultWithoutMap).toHaveLength(1)
            expect(resultWithoutMap[0].productId).toBe('legacy-product')
        })
    })

    describe('Integration with Real Basket Data Structure', () => {
        test('handles complete SCAPI basket response structure for list-based promotion', () => {
            const realBasket = {
                basketId: 'test-basket-123',
                currency: 'USD',
                customerInfo: {customerId: 'test-customer'},
                bonusDiscountLineItems: [
                    {
                        couponCode: 'BONUS10',
                        id: '8a7b9c0d1e2f3456',
                        maxBonusItems: 2,
                        promotionId: 'BuyXGetYBonusChoice',
                        promotionLink: 'https://example.com/promotions/BuyXGetYBonusChoice',
                        bonusProducts: [
                            {
                                productId: 'bonus-product-A',
                                productName: 'Bonus Product A',
                                title: 'Bonus Product A'
                            },
                            {
                                productId: 'bonus-product-B',
                                productName: 'Bonus Product B',
                                title: 'Bonus Product B'
                            }
                        ]
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-001',
                        productId: 'qualifying-product-X',
                        productName: 'Qualifying Product X',
                        quantity: 1,
                        price: 99.99,
                        priceAfterItemDiscount: 99.99,
                        bonusProductLineItem: false,
                        priceAdjustments: [
                            {
                                promotionId: 'BuyXGetYBonusChoice',
                                appliedDiscount: {type: 'bonus_choice'},
                                itemText: 'Bonus product promotion',
                                price: 0
                            }
                        ]
                    }
                ]
            }

            const realProducts = {
                'qualifying-product-X': {
                    id: 'qualifying-product-X',
                    name: 'Qualifying Product X',
                    productPromotions: [
                        {
                            promotionId: 'BuyXGetYBonusChoice',
                            calloutMsg: 'Buy 1, Get 2 Bonus Products Free!'
                        }
                    ]
                }
            }

            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                realBasket,
                'qualifying-product-X',
                realProducts
            )

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                productId: 'bonus-product-A',
                productName: 'Bonus Product A',
                title: 'Bonus Product A',
                promotionId: 'BuyXGetYBonusChoice',
                discountLineItemId: '8a7b9c0d1e2f3456'
            })
            expect(result[1]).toEqual({
                productId: 'bonus-product-B',
                productName: 'Bonus Product B',
                title: 'Bonus Product B',
                promotionId: 'BuyXGetYBonusChoice',
                discountLineItemId: '8a7b9c0d1e2f3456'
            })
        })

        test('handles complete SCAPI basket response structure for rule-based promotion', () => {
            const realRuleBasedBasket = {
                basketId: 'test-basket-456',
                currency: 'USD',
                bonusDiscountLineItems: [
                    {
                        couponCode: 'RULEBASED20',
                        id: '9b8c7d6e5f4a3210',
                        maxBonusItems: 3,
                        promotionId: 'CategoryBonusRule',
                        promotionLink: 'https://example.com/promotions/CategoryBonusRule',
                        bonusProducts: [] // Rule-based: empty array
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-002',
                        productId: 'qualifying-product-Y',
                        productName: 'Qualifying Product Y',
                        quantity: 2,
                        price: 149.99,
                        priceAfterItemDiscount: 149.99,
                        bonusProductLineItem: false,
                        priceAdjustments: [
                            {
                                promotionId: 'CategoryBonusRule',
                                appliedDiscount: {type: 'bonus_choice'},
                                itemText: 'Choose bonus from Electronics category',
                                price: 0
                            }
                        ]
                    }
                ]
            }

            const realProducts = {
                'qualifying-product-Y': {
                    id: 'qualifying-product-Y',
                    name: 'Qualifying Product Y',
                    productPromotions: [
                        {
                            promotionId: 'CategoryBonusRule',
                            calloutMsg: 'Buy 2, Get Choice from Electronics!'
                        }
                    ]
                }
            }

            const ruleBasedProductsMap = {
                CategoryBonusRule: [
                    {
                        productId: 'electronics-1',
                        productName: 'Headphones',
                        price: 79.99,
                        currency: 'USD',
                        image: {
                            alt: 'Headphones',
                            link: '/images/headphones.jpg'
                        }
                    },
                    {
                        productId: 'electronics-2',
                        productName: 'Smart Watch',
                        price: 199.99,
                        currency: 'USD',
                        image: {
                            alt: 'Smart Watch',
                            link: '/images/watch.jpg'
                        }
                    },
                    {
                        productId: 'electronics-3',
                        productName: 'Wireless Mouse',
                        price: 29.99,
                        currency: 'USD',
                        image: {
                            alt: 'Mouse',
                            link: '/images/mouse.jpg'
                        }
                    }
                ]
            }

            const qualifyingMap = {
                CategoryBonusRule: new Set(['qualifying-product-Y'])
            }

            const result = discoveryUtils.getAvailableBonusItemsForProduct(
                realRuleBasedBasket,
                'qualifying-product-Y',
                realProducts,
                ruleBasedProductsMap,
                qualifyingMap
            )

            expect(result).toHaveLength(3)
            expect(result[0].productId).toBe('electronics-1')
            expect(result[1].productId).toBe('electronics-2')
            expect(result[2].productId).toBe('electronics-3')
            expect(result[0].promotionId).toBe('CategoryBonusRule')
            expect(result[0].discountLineItemId).toBe('9b8c7d6e5f4a3210')
        })

        test('handles basket with both list-based and rule-based promotions and partial selection', () => {
            const complexBasket = {
                basketId: 'complex-basket-789',
                currency: 'USD',
                bonusDiscountLineItems: [
                    {
                        id: 'list-discount-1',
                        promotionId: 'ListBasedPromo',
                        maxBonusItems: 2,
                        bonusProducts: [
                            {productId: 'list-bonus-1', productName: 'List Bonus 1'},
                            {productId: 'list-bonus-2', productName: 'List Bonus 2'}
                        ]
                    },
                    {
                        id: 'rule-discount-1',
                        promotionId: 'RuleBasedPromo',
                        maxBonusItems: 3,
                        bonusProducts: []
                    }
                ],
                productItems: [
                    {
                        itemId: 'qual-item-1',
                        productId: 'qualifying-prod-1',
                        quantity: 1,
                        bonusProductLineItem: false,
                        priceAdjustments: [
                            {promotionId: 'ListBasedPromo'},
                            {promotionId: 'RuleBasedPromo'}
                        ]
                    },
                    {
                        itemId: 'bonus-item-1',
                        productId: 'list-bonus-1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'list-discount-1'
                    },
                    {
                        itemId: 'bonus-item-2',
                        productId: 'rule-fetched-1',
                        quantity: 2,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'rule-discount-1'
                    }
                ]
            }

            const complexProducts = {
                'qualifying-prod-1': {
                    id: 'qualifying-prod-1',
                    productPromotions: [
                        {promotionId: 'ListBasedPromo'},
                        {promotionId: 'RuleBasedPromo'}
                    ]
                }
            }

            const ruleBasedMap = {
                RuleBasedPromo: [
                    {productId: 'rule-fetched-1', productName: 'Rule Product 1'},
                    {productId: 'rule-fetched-2', productName: 'Rule Product 2'}
                ]
            }

            const qualifyingMap = {
                ListBasedPromo: new Set(['qualifying-prod-1']),
                RuleBasedPromo: new Set(['qualifying-prod-1'])
            }

            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                complexBasket,
                'qualifying-prod-1',
                complexProducts,
                ruleBasedMap,
                qualifyingMap
            )

            // List-based: 2 max, 1 selected = 1 remaining
            // Rule-based: 3 max, 2 selected = 1 remaining
            // Total: 2 products available (1 from each)
            expect(result.aggregatedMaxBonusItems).toBe(5)
            expect(result.aggregatedSelectedItems).toBe(3)
            expect(result.hasRemainingCapacity).toBe(true)

            // Should include remaining products from both promotions
            const listProducts = result.bonusItems.filter((item) =>
                item.productId.startsWith('list-')
            )
            const ruleProducts = result.bonusItems.filter((item) =>
                item.productId.startsWith('rule-')
            )

            expect(listProducts).toHaveLength(2) // Both list products should be available
            expect(ruleProducts).toHaveLength(2) // Both rule products should be available

            // Verify remaining counts
            const listProduct = result.bonusItems.find((item) => item.productId === 'list-bonus-1')
            expect(listProduct.remainingBonusItemsCount).toBe(1)

            const ruleProduct = result.bonusItems.find(
                (item) => item.productId === 'rule-fetched-1'
            )
            expect(ruleProduct.remainingBonusItemsCount).toBe(1)
        })

        test('handles basket with all bonus slots filled across mixed promotions', () => {
            const fullBasket = {
                basketId: 'full-basket-101',
                bonusDiscountLineItems: [
                    {
                        id: 'list-full',
                        promotionId: 'ListPromo',
                        maxBonusItems: 1,
                        bonusProducts: [{productId: 'list-prod'}]
                    },
                    {
                        id: 'rule-full',
                        promotionId: 'RulePromo',
                        maxBonusItems: 2,
                        bonusProducts: []
                    }
                ],
                productItems: [
                    {
                        itemId: 'qual',
                        productId: 'qualifying',
                        bonusProductLineItem: false,
                        priceAdjustments: [{promotionId: 'ListPromo'}, {promotionId: 'RulePromo'}]
                    },
                    {
                        itemId: 'b1',
                        productId: 'list-prod',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'list-full'
                    },
                    {
                        itemId: 'b2',
                        productId: 'rule-prod-1',
                        quantity: 2,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'rule-full'
                    }
                ]
            }

            const fullProducts = {
                qualifying: {
                    id: 'qualifying',
                    productPromotions: [{promotionId: 'ListPromo'}, {promotionId: 'RulePromo'}]
                }
            }

            const ruleMap = {
                RulePromo: [{productId: 'rule-prod-1'}, {productId: 'rule-prod-2'}]
            }

            const qualifyingMap = {
                ListPromo: new Set(['qualifying']),
                RulePromo: new Set(['qualifying'])
            }

            const result = discoveryUtils.getRemainingAvailableBonusProductsForProduct(
                fullBasket,
                'qualifying',
                fullProducts,
                ruleMap,
                qualifyingMap
            )

            expect(result.bonusItems).toEqual([])
            expect(result.aggregatedMaxBonusItems).toBe(3)
            expect(result.aggregatedSelectedItems).toBe(3)
            expect(result.hasRemainingCapacity).toBe(false)
        })
    })
})
