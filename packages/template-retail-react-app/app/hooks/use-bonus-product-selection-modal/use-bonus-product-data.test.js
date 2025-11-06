/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useBonusProductData} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-data'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProducts: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/utils/bonus-product', () => ({
    findAvailableBonusDiscountLineItemIds: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-rule-based-bonus-products', () => ({
    useRuleBasedBonusProducts: jest.fn()
}))

import {useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {findAvailableBonusDiscountLineItemIds} from '@salesforce/retail-react-app/app/utils/bonus-product'
import {useRuleBasedBonusProducts} from '@salesforce/retail-react-app/app/hooks/use-rule-based-bonus-products'

describe('useBonusProductData', () => {
    const mockBasket = {
        productItems: [
            {
                productId: 'product-1',
                bonusProductLineItem: true,
                bonusDiscountLineItemId: 'bonus-1',
                quantity: 1
            },
            {
                productId: 'product-2',
                bonusProductLineItem: false,
                quantity: 2
            }
        ]
    }

    const mockModalData = {
        bonusDiscountLineItems: [
            {
                id: 'bonus-1',
                promotionId: 'promo-1',
                maxBonusItems: 2,
                bonusProducts: [{productId: 'bonus-product-1'}, {productId: 'bonus-product-2'}]
            },
            {
                id: 'bonus-2',
                promotionId: 'promo-2',
                maxBonusItems: 1,
                bonusProducts: [{productId: 'bonus-product-1'}]
            }
        ]
    }

    const mockProductData = {
        data: [
            {
                id: 'bonus-product-1',
                name: 'Bonus Product 1',
                imageGroups: []
            },
            {
                id: 'bonus-product-2',
                name: 'Bonus Product 2',
                imageGroups: []
            }
        ]
    }

    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentBasket.mockReturnValue({data: mockBasket})
        useProducts.mockReturnValue({
            data: mockProductData,
            isLoading: false
        })
        findAvailableBonusDiscountLineItemIds.mockReturnValue([['bonus-1', 1]])
        useRuleBasedBonusProducts.mockReturnValue({
            products: [],
            total: 0,
            isLoading: false,
            error: null
        })
    })

    test('returns correct bonus products data', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.bonusProducts).toBe(mockModalData.bonusDiscountLineItems)
        expect(result.current.bonusLineItemIds).toEqual(['bonus-1', 'bonus-2'])
        expect(result.current.maxBonusItems).toBe(3)
        expect(result.current.selectedBonusItems).toBe(1)
    })

    test('deduplicates bonus products by productId', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.uniqueBonusProducts).toHaveLength(2)
        expect(result.current.uniqueBonusProducts).toEqual([
            {productId: 'bonus-product-1'},
            {productId: 'bonus-product-2'}
        ])
    })

    test('creates correct product IDs string', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.productIds).toBe('bonus-product-1,bonus-product-2')
    })

    test('calls useProducts with correct parameters', () => {
        renderHook(() => useBonusProductData(mockModalData))

        expect(useProducts).toHaveBeenCalledWith(
            {
                parameters: {
                    ids: 'bonus-product-1,bonus-product-2',
                    allImages: true
                }
            },
            {
                enabled: true,
                placeholderData: null
            }
        )
    })

    test('creates productById map correctly', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.productById.get('bonus-product-1')).toEqual({
            id: 'bonus-product-1',
            name: 'Bonus Product 1',
            imageGroups: []
        })
        expect(result.current.productById.get('bonus-product-2')).toEqual({
            id: 'bonus-product-2',
            name: 'Bonus Product 2',
            imageGroups: []
        })
    })

    test('computeBonusMeta returns correct metadata', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'bonus-product-1'}

        const meta = result.current.computeBonusMeta(bonusProduct)

        expect(meta).toEqual({
            promotionId: 'promo-1',
            bonusDiscountLineItemId: 'bonus-1'
        })
    })

    test('normalizeProduct returns normalized product data', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'bonus-product-1'}
        const foundData = mockProductData.data[0]

        const normalized = result.current.normalizeProduct(bonusProduct, foundData)

        expect(normalized).toEqual({
            productId: 'bonus-product-1',
            id: 'bonus-product-1',
            name: 'Bonus Product 1',
            imageGroups: [],
            variants: [],
            variationAttributes: [],
            type: {set: false, bundle: false},
            selectedVariant: null,
            variationValues: {}
        })
    })

    test('normalizeProduct handles missing product data', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'missing-product'}

        const normalized = result.current.normalizeProduct(bonusProduct, null)

        expect(normalized).toEqual({
            productId: 'missing-product',
            imageGroups: [],
            variants: [],
            variationAttributes: [],
            type: {set: false, bundle: false}
        })
    })

    test('handles empty modal data', () => {
        const {result} = renderHook(() => useBonusProductData(null))

        expect(result.current.bonusProducts).toEqual([])
        expect(result.current.bonusLineItemIds).toEqual([])
        expect(result.current.maxBonusItems).toBe(0)
        expect(result.current.selectedBonusItems).toBe(0)
        expect(result.current.uniqueBonusProducts).toEqual([])
        expect(result.current.productIds).toBe('')
    })

    test('handles missing basket data', () => {
        useCurrentBasket.mockReturnValue({data: null})
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.selectedBonusItems).toBe(0)
    })

    test('returns loading state from useProducts', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: true
        })

        const {result} = renderHook(() => useBonusProductData(mockModalData))

        expect(result.current.isLoading).toBe(true)
    })

    test('computeBonusMeta handles no available pairs', () => {
        findAvailableBonusDiscountLineItemIds.mockReturnValue([])
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'bonus-product-1'}

        const meta = result.current.computeBonusMeta(bonusProduct)

        expect(meta).toEqual({
            promotionId: 'promo-1',
            bonusDiscountLineItemId: 'bonus-1'
        })
    })

    test('normalizeProduct extracts variant information when productId matches a variant', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'variant-123'}
        const foundData = {
            id: 'master-product',
            name: 'Master Product',
            imageGroups: [],
            variants: [
                {
                    productId: 'variant-123',
                    variationValues: {color: 'red', size: 'M'}
                },
                {
                    productId: 'variant-456',
                    variationValues: {color: 'blue', size: 'L'}
                }
            ],
            variationAttributes: [],
            type: {set: false, bundle: false}
        }

        const normalized = result.current.normalizeProduct(bonusProduct, foundData)

        expect(normalized.selectedVariant).toEqual({
            productId: 'variant-123',
            variationValues: {color: 'red', size: 'M'}
        })
        expect(normalized.variationValues).toEqual({color: 'red', size: 'M'})
    })

    test('normalizeProduct returns empty variationValues when productId matches master product', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'master-product'} // Master product ID
        const foundData = {
            id: 'master-product',
            name: 'Master Product',
            imageGroups: [],
            variants: [
                {
                    productId: 'variant-123',
                    variationValues: {color: 'red', size: 'M'}
                },
                {
                    productId: 'variant-456',
                    variationValues: {color: 'blue', size: 'L'}
                }
            ],
            variationAttributes: [],
            type: {set: false, bundle: false}
        }

        const normalized = result.current.normalizeProduct(bonusProduct, foundData)

        expect(normalized.selectedVariant).toBeNull()
        expect(normalized.variationValues).toEqual({})
        expect(normalized.productId).toBe('master-product')
    })

    test('handles multiple bonusDiscountLineItems with mixed variant and master product IDs', () => {
        const complexModalData = {
            bonusDiscountLineItems: [
                {
                    id: 'bonus-line-1',
                    promotionId: 'promo-ties',
                    maxBonusItems: 2,
                    bonusProducts: [
                        {productId: 'tie-variant-red', productName: 'Red Tie', title: 'Red Tie'},
                        {productId: 'tie-variant-blue', productName: 'Blue Tie', title: 'Blue Tie'}
                    ]
                },
                {
                    id: 'bonus-line-2',
                    promotionId: 'promo-accessories',
                    maxBonusItems: 1,
                    bonusProducts: [
                        {
                            productId: 'accessories-master',
                            productName: 'Accessories',
                            title: 'Accessories'
                        },
                        {
                            productId: 'watch-variant-silver',
                            productName: 'Silver Watch',
                            title: 'Silver Watch'
                        }
                    ]
                }
            ]
        }

        // Mock product data for the complex scenario
        const complexProductData = {
            data: [
                {
                    id: 'tie-master',
                    name: 'Silk Tie',
                    imageGroups: [],
                    variants: [
                        {productId: 'tie-variant-red', variationValues: {color: 'red'}},
                        {productId: 'tie-variant-blue', variationValues: {color: 'blue'}}
                    ],
                    variationAttributes: [],
                    type: {set: false, bundle: false}
                },
                {
                    id: 'accessories-master',
                    name: 'Accessories Collection',
                    imageGroups: [],
                    variants: [
                        {productId: 'acc-variant-1', variationValues: {style: 'classic'}},
                        {productId: 'acc-variant-2', variationValues: {style: 'modern'}}
                    ],
                    variationAttributes: [],
                    type: {set: false, bundle: false}
                },
                {
                    id: 'watch-master',
                    name: 'Premium Watch',
                    imageGroups: [],
                    variants: [
                        {
                            productId: 'watch-variant-silver',
                            variationValues: {color: 'silver', size: '42mm'}
                        },
                        {
                            productId: 'watch-variant-gold',
                            variationValues: {color: 'gold', size: '38mm'}
                        }
                    ],
                    variationAttributes: [],
                    type: {set: false, bundle: false}
                }
            ]
        }

        useProducts.mockReturnValue({
            data: complexProductData,
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductData(complexModalData))

        // Test deduplication and correct product extraction
        expect(result.current.uniqueBonusProducts).toHaveLength(4)
        expect(result.current.maxBonusItems).toBe(3) // 2 + 1

        // Test normalizeProduct for each type
        // 1. Variant ID (should extract variant info)
        const redTie = result.current.normalizeProduct(
            {productId: 'tie-variant-red'},
            complexProductData.data[0]
        )
        expect(redTie.selectedVariant).toEqual({
            productId: 'tie-variant-red',
            variationValues: {color: 'red'}
        })
        expect(redTie.variationValues).toEqual({color: 'red'})

        // 2. Master product ID (should not extract variant info)
        const accessories = result.current.normalizeProduct(
            {productId: 'accessories-master'},
            complexProductData.data[1]
        )
        expect(accessories.selectedVariant).toBeNull()
        expect(accessories.variationValues).toEqual({})
        expect(accessories.productId).toBe('accessories-master')

        // 3. Another variant ID with multiple variation values
        const silverWatch = result.current.normalizeProduct(
            {productId: 'watch-variant-silver'},
            complexProductData.data[2]
        )
        expect(silverWatch.selectedVariant).toEqual({
            productId: 'watch-variant-silver',
            variationValues: {color: 'silver', size: '42mm'}
        })
        expect(silverWatch.variationValues).toEqual({color: 'silver', size: '42mm'})
    })

    test('handles variant ID that does not exist in product variants array', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'non-existent-variant-999'}
        const foundData = {
            id: 'master-product',
            name: 'Master Product',
            imageGroups: [],
            variants: [
                {productId: 'variant-123', variationValues: {color: 'red'}},
                {productId: 'variant-456', variationValues: {color: 'blue'}}
            ],
            variationAttributes: [],
            type: {set: false, bundle: false}
        }

        const normalized = result.current.normalizeProduct(bonusProduct, foundData)

        // Should gracefully fallback to master product behavior
        expect(normalized.selectedVariant).toBeNull()
        expect(normalized.variationValues).toEqual({})
        expect(normalized.productId).toBe('master-product')
    })

    test('handles product data with no variants array', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'some-variant-id'}
        const foundData = {
            id: 'master-product-no-variants',
            name: 'Simple Product',
            imageGroups: [],
            // variants: undefined (intentionally missing)
            variationAttributes: [],
            type: {set: false, bundle: false}
        }

        const normalized = result.current.normalizeProduct(bonusProduct, foundData)

        // Should handle gracefully without crashing
        expect(normalized.selectedVariant).toBeNull()
        expect(normalized.variationValues).toEqual({})
        expect(normalized.productId).toBe('master-product-no-variants')
    })

    test('handles variant with null/undefined variationValues', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))
        const bonusProduct = {productId: 'variant-with-null-values'}
        const foundData = {
            id: 'master-product',
            name: 'Master Product',
            imageGroups: [],
            variants: [
                {
                    productId: 'variant-with-null-values',
                    variationValues: null // Malformed data
                },
                {
                    productId: 'variant-with-undefined-values'
                    // variationValues: undefined (missing property)
                }
            ],
            variationAttributes: [],
            type: {set: false, bundle: false}
        }

        const normalized = result.current.normalizeProduct(bonusProduct, foundData)

        // Should handle null variationValues gracefully
        expect(normalized.selectedVariant).toEqual({
            productId: 'variant-with-null-values',
            variationValues: null
        })
        expect(normalized.variationValues).toEqual({}) // Our code converts null to empty object
    })

    test('handles product bundles and sets correctly', () => {
        const {result} = renderHook(() => useBonusProductData(mockModalData))

        // Test bundle
        const bundleProduct = {productId: 'bundle-variant-123'}
        const bundleData = {
            id: 'bundle-master',
            name: 'Product Bundle',
            imageGroups: [],
            variants: [{productId: 'bundle-variant-123', variationValues: {size: 'large'}}],
            variationAttributes: [],
            type: {set: false, bundle: true} // This is a bundle
        }

        const normalizedBundle = result.current.normalizeProduct(bundleProduct, bundleData)
        expect(normalizedBundle.selectedVariant.variationValues).toEqual({size: 'large'})
        expect(normalizedBundle.type.bundle).toBe(true)

        // Test set
        const setProduct = {productId: 'set-variant-456'}
        const setData = {
            id: 'set-master',
            name: 'Product Set',
            imageGroups: [],
            variants: [{productId: 'set-variant-456', variationValues: {color: 'multi'}}],
            variationAttributes: [],
            type: {set: true, bundle: false} // This is a set
        }

        const normalizedSet = result.current.normalizeProduct(setProduct, setData)
        expect(normalizedSet.selectedVariant.variationValues).toEqual({color: 'multi'})
        expect(normalizedSet.type.set).toBe(true)
    })

    describe('Integration with Rule-Based Promotions', () => {
        test('handles rule-based promotion with empty bonusProducts array', () => {
            const ruleBasedModalData = {
                bonusDiscountLineItems: [
                    {
                        id: 'rule-based-bonus-1',
                        promotionId: 'rule-based-promo',
                        maxBonusItems: 3,
                        bonusProducts: [] // Empty for rule-based
                    }
                ]
            }

            const {result} = renderHook(() => useBonusProductData(ruleBasedModalData))

            // Should handle empty bonusProducts gracefully
            expect(result.current.bonusProducts).toEqual(ruleBasedModalData.bonusDiscountLineItems)
            expect(result.current.bonusLineItemIds).toEqual(['rule-based-bonus-1'])
            expect(result.current.maxBonusItems).toBe(3)
            expect(result.current.uniqueBonusProducts).toEqual([])
            expect(result.current.productIds).toBe('')
        })

        test('handles mixed list-based and rule-based promotions', () => {
            const mixedModalData = {
                bonusDiscountLineItems: [
                    {
                        id: 'list-based-1',
                        promotionId: 'list-promo',
                        maxBonusItems: 2,
                        bonusProducts: [
                            {productId: 'list-product-1'},
                            {productId: 'list-product-2'}
                        ]
                    },
                    {
                        id: 'rule-based-1',
                        promotionId: 'rule-promo',
                        maxBonusItems: 3,
                        bonusProducts: [] // Rule-based
                    }
                ]
            }

            const {result} = renderHook(() => useBonusProductData(mixedModalData))

            // Should combine maxBonusItems from both
            expect(result.current.maxBonusItems).toBe(5)
            expect(result.current.bonusLineItemIds).toEqual(['list-based-1', 'rule-based-1'])

            // Should only include products from list-based in uniqueBonusProducts
            expect(result.current.uniqueBonusProducts).toEqual([
                {productId: 'list-product-1'},
                {productId: 'list-product-2'}
            ])

            // Product IDs should only include list-based products
            expect(result.current.productIds).toBe('list-product-1,list-product-2')
        })

        test('computes selected items correctly with rule-based bonus products in basket', () => {
            const mixedBasket = {
                productItems: [
                    {
                        productId: 'list-bonus-1',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'list-based-1',
                        quantity: 1
                    },
                    {
                        productId: 'rule-bonus-1',
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'rule-based-1',
                        quantity: 2
                    }
                ]
            }

            useCurrentBasket.mockReturnValue({data: mixedBasket})

            const mixedModalData = {
                bonusDiscountLineItems: [
                    {
                        id: 'list-based-1',
                        promotionId: 'list-promo',
                        maxBonusItems: 2,
                        bonusProducts: [{productId: 'list-bonus-1'}]
                    },
                    {
                        id: 'rule-based-1',
                        promotionId: 'rule-promo',
                        maxBonusItems: 3,
                        bonusProducts: []
                    }
                ]
            }

            const {result} = renderHook(() => useBonusProductData(mixedModalData))

            // Should count both list-based and rule-based selected items
            expect(result.current.selectedBonusItems).toBe(3) // 1 + 2
        })

        test('computeBonusMeta handles rule-based promotion with no bonusProducts', () => {
            const ruleBasedModalData = {
                bonusDiscountLineItems: [
                    {
                        id: 'rule-based-1',
                        promotionId: 'rule-promo',
                        maxBonusItems: 3,
                        bonusProducts: []
                    }
                ]
            }

            findAvailableBonusDiscountLineItemIds.mockReturnValue([['rule-based-1', 3]])

            const {result} = renderHook(() => useBonusProductData(ruleBasedModalData))

            // Should return metadata for rule-based products from rule-based promotion
            const meta = result.current.computeBonusMeta({productId: 'rule-fetched-product'})

            expect(meta).toEqual({
                promotionId: 'rule-promo',
                bonusDiscountLineItemId: 'rule-based-1'
            })
        })

        test('fetches rule-based products and merges them with list-based products', () => {
            const mixedModalData = {
                bonusDiscountLineItems: [
                    {
                        id: 'list-based-1',
                        promotionId: 'list-promo',
                        maxBonusItems: 2,
                        bonusProducts: [
                            {productId: 'list-product-1', productName: 'List Product 1'}
                        ]
                    },
                    {
                        id: 'rule-based-1',
                        promotionId: 'rule-promo',
                        maxBonusItems: 3,
                        bonusProducts: [] // Rule-based
                    }
                ]
            }

            // Mock rule-based products fetch
            useRuleBasedBonusProducts.mockReturnValue({
                products: [
                    {productId: 'rule-product-1', productName: 'Rule Product 1'},
                    {productId: 'rule-product-2', productName: 'Rule Product 2'}
                ],
                total: 2,
                isLoading: false,
                error: null
            })

            const {result} = renderHook(() => useBonusProductData(mixedModalData))

            // Should have 3 unique products: 1 list-based + 2 rule-based
            expect(result.current.uniqueBonusProducts).toHaveLength(3)
            expect(result.current.uniqueBonusProducts[0].productId).toBe('list-product-1')
            expect(result.current.uniqueBonusProducts[1].productId).toBe('rule-product-1')
            expect(result.current.uniqueBonusProducts[2].productId).toBe('rule-product-2')

            // Should call useRuleBasedBonusProducts with the rule-based promotion ID
            expect(useRuleBasedBonusProducts).toHaveBeenCalledWith('rule-promo', {
                enabled: true,
                limit: 50
            })

            // Should include both promotion types in ruleBasedPromotions array
            expect(result.current.ruleBasedPromotions).toEqual(['rule-promo'])
        })

        test('handles loading state for rule-based products', () => {
            const ruleBasedModalData = {
                bonusDiscountLineItems: [
                    {
                        id: 'rule-based-1',
                        promotionId: 'rule-promo',
                        maxBonusItems: 3,
                        bonusProducts: []
                    }
                ]
            }

            // Mock rule-based products as loading
            useRuleBasedBonusProducts.mockReturnValue({
                products: [],
                total: 0,
                isLoading: true,
                error: null
            })

            useProducts.mockReturnValue({
                data: null,
                isLoading: false
            })

            const {result} = renderHook(() => useBonusProductData(ruleBasedModalData))

            // Should show loading when rule-based products are being fetched
            expect(result.current.isLoading).toBe(true)
        })

        test('deduplicates products when same product appears in both list and rule-based', () => {
            const mixedModalData = {
                bonusDiscountLineItems: [
                    {
                        id: 'list-based-1',
                        promotionId: 'list-promo',
                        maxBonusItems: 2,
                        bonusProducts: [
                            {productId: 'shared-product-1', productName: 'Shared Product 1'}
                        ]
                    },
                    {
                        id: 'rule-based-1',
                        promotionId: 'rule-promo',
                        maxBonusItems: 3,
                        bonusProducts: []
                    }
                ]
            }

            // Mock rule-based products with a duplicate product
            useRuleBasedBonusProducts.mockReturnValue({
                products: [
                    {productId: 'shared-product-1', productName: 'Shared Product 1'},
                    {productId: 'rule-product-1', productName: 'Rule Product 1'}
                ],
                total: 2,
                isLoading: false,
                error: null
            })

            const {result} = renderHook(() => useBonusProductData(mixedModalData))

            // Should deduplicate and only show 2 unique products
            expect(result.current.uniqueBonusProducts).toHaveLength(2)
            expect(result.current.uniqueBonusProducts[0].productId).toBe('shared-product-1')
            expect(result.current.uniqueBonusProducts[1].productId).toBe('rule-product-1')
        })
    })
})
