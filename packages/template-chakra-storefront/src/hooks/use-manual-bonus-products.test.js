/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useManualBonusProducts} from './use-manual-bonus-products'

describe('useManualBonusProducts', () => {
    let hookResult

    beforeEach(() => {
        const {result} = renderHook(() => useManualBonusProducts(null, false, true))
        hookResult = result
    })

    describe('initial state', () => {
        test('should initialize with empty collections', () => {
            expect(hookResult.current.manualBonusProductCollections).toEqual({})
        })

        test('should return all expected functions', () => {
            const {
                manualBonusProductCollections,
                createManualBonusProductCollection,
                createManualBonusProductCollections,
                trimManualBonusProductCollection,
                getManualBonusProductCollection,
                removeManualBonusProductCollection,
                clearAllManualBonusProductCollections,
                detectNewlyAddedBonusProducts,
                analyzeQualifyingProductChanges,
                getQualifyingProductItemId,
                findQualifyingProductIdFromCollections
            } = hookResult.current

            expect(manualBonusProductCollections).toBeDefined()
            expect(createManualBonusProductCollection).toBeInstanceOf(Function)
            expect(createManualBonusProductCollections).toBeInstanceOf(Function)
            expect(trimManualBonusProductCollection).toBeInstanceOf(Function)
            expect(getManualBonusProductCollection).toBeInstanceOf(Function)
            expect(removeManualBonusProductCollection).toBeInstanceOf(Function)
            expect(clearAllManualBonusProductCollections).toBeInstanceOf(Function)
            expect(detectNewlyAddedBonusProducts).toBeInstanceOf(Function)
            expect(analyzeQualifyingProductChanges).toBeInstanceOf(Function)
            expect(getQualifyingProductItemId).toBeInstanceOf(Function)
            expect(findQualifyingProductIdFromCollections).toBeInstanceOf(Function)
        })
    })

    describe('createManualBonusProductCollection', () => {
        test('should create a collection for a single product', () => {
            const regularProductId = 'product-123'
            const bonusProducts = [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    productName: 'Bonus Product 1',
                    quantity: 1,
                    priceAdjustments: [{appliedDiscount: {type: 'bonus'}}],
                    promotionId: 'promo-1'
                }
            ]

            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    bonusProducts
                )
            })

            const collection = hookResult.current.getManualBonusProductCollection(regularProductId)
            expect(collection).toHaveLength(1)
            expect(collection[0]).toMatchObject({
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                productName: 'Bonus Product 1',
                quantity: 1,
                promotionId: 'promo-1'
            })
            expect(collection[0].addedAt).toBeDefined()
        })

        test('should append to existing collection', () => {
            const regularProductId = 'product-123'
            const firstBonusProducts = [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    productName: 'Bonus Product 1',
                    quantity: 1,
                    promotionId: 'promo-1'
                }
            ]
            const secondBonusProducts = [
                {
                    itemId: 'bonus-item-2',
                    productId: 'bonus-product-2',
                    productName: 'Bonus Product 2',
                    quantity: 1,
                    promotionId: 'promo-2'
                }
            ]

            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    firstBonusProducts
                )
            })

            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    secondBonusProducts
                )
            })

            const collection = hookResult.current.getManualBonusProductCollection(regularProductId)
            expect(collection).toHaveLength(2)
        })
    })

    describe('createManualBonusProductCollections', () => {
        test('should create collections for multiple products', () => {
            const qualifyingProductToBonusProducts = {
                'product-1': [
                    {
                        itemId: 'bonus-item-1',
                        productId: 'bonus-product-1',
                        productName: 'Bonus Product 1',
                        quantity: 1,
                        promotionId: 'promo-1'
                    }
                ],
                'product-2': [
                    {
                        itemId: 'bonus-item-2',
                        productId: 'bonus-product-2',
                        productName: 'Bonus Product 2',
                        quantity: 1,
                        promotionId: 'promo-2'
                    }
                ]
            }

            act(() => {
                hookResult.current.createManualBonusProductCollections(
                    qualifyingProductToBonusProducts
                )
            })

            expect(hookResult.current.getManualBonusProductCollection('product-1')).toHaveLength(1)
            expect(hookResult.current.getManualBonusProductCollection('product-2')).toHaveLength(1)
        })

        test('should handle trim operations', () => {
            const regularProductId = 'product-123'

            // First add some bonus products
            const bonusProducts = [
                {
                    itemId: 'bonus-1',
                    productId: 'bonus-product-1',
                    quantity: 1,
                    promotionId: 'promo-1'
                },
                {
                    itemId: 'bonus-2',
                    productId: 'bonus-product-2',
                    quantity: 1,
                    promotionId: 'promo-2'
                },
                {
                    itemId: 'bonus-3',
                    productId: 'bonus-product-3',
                    quantity: 1,
                    promotionId: 'promo-3'
                }
            ]

            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    bonusProducts
                )
            })

            // Now trim the collection
            const trimOperation = {
                'product-123': {
                    action: 'trim',
                    quantityReduction: 1,
                    newQuantity: 2
                }
            }

            act(() => {
                hookResult.current.createManualBonusProductCollections(trimOperation)
            })

            const collection = hookResult.current.getManualBonusProductCollection(regularProductId)
            expect(collection).toHaveLength(2) // Should have removed 1 item
        })

        test('should handle empty or null input', () => {
            act(() => {
                hookResult.current.createManualBonusProductCollections(null)
            })

            act(() => {
                hookResult.current.createManualBonusProductCollections({})
            })

            expect(hookResult.current.manualBonusProductCollections).toEqual({})
        })
    })

    describe('trimManualBonusProductCollection', () => {
        beforeEach(() => {
            const bonusProducts = [
                {itemId: 'bonus-1', productId: 'bonus-product-1', quantity: 1},
                {itemId: 'bonus-2', productId: 'bonus-product-2', quantity: 1},
                {itemId: 'bonus-3', productId: 'bonus-product-3', quantity: 1}
            ]

            act(() => {
                hookResult.current.createManualBonusProductCollection('product-123', bonusProducts)
            })
        })

        test('should trim collection when quantity is reduced', () => {
            act(() => {
                hookResult.current.trimManualBonusProductCollection('product-123', 1, 2)
            })

            const collection = hookResult.current.getManualBonusProductCollection('product-123')
            expect(collection).toHaveLength(2)
        })

        test('should remove entire collection when quantity becomes 0', () => {
            act(() => {
                hookResult.current.trimManualBonusProductCollection('product-123', 3, 0)
            })

            const collection = hookResult.current.getManualBonusProductCollection('product-123')
            expect(collection).toHaveLength(0)
            expect(hookResult.current.manualBonusProductCollections['product-123']).toBeUndefined()
        })

        test('should handle trimming more items than available', () => {
            act(() => {
                hookResult.current.trimManualBonusProductCollection('product-123', 5, 1)
            })

            const collection = hookResult.current.getManualBonusProductCollection('product-123')
            expect(collection).toHaveLength(0)
        })

        test('should not change collection when no reduction', () => {
            act(() => {
                hookResult.current.trimManualBonusProductCollection('product-123', 0, 3)
            })

            const collection = hookResult.current.getManualBonusProductCollection('product-123')
            expect(collection).toHaveLength(3)
        })
    })

    describe('getManualBonusProductCollection', () => {
        test('should return collection for existing product', () => {
            const bonusProducts = [{itemId: 'bonus-1', productId: 'bonus-product-1'}]

            act(() => {
                hookResult.current.createManualBonusProductCollection('product-123', bonusProducts)
            })

            const collection = hookResult.current.getManualBonusProductCollection('product-123')
            expect(collection).toHaveLength(1)
        })

        test('should return empty array for non-existing product', () => {
            const collection = hookResult.current.getManualBonusProductCollection('non-existent')
            expect(collection).toEqual([])
        })
    })

    describe('removeManualBonusProductCollection', () => {
        test('should remove collection for specific product', () => {
            const bonusProducts = [{itemId: 'bonus-1', productId: 'bonus-product-1'}]

            act(() => {
                hookResult.current.createManualBonusProductCollection('product-123', bonusProducts)
                hookResult.current.createManualBonusProductCollection('product-456', bonusProducts)
            })

            act(() => {
                hookResult.current.removeManualBonusProductCollection('product-123')
            })

            expect(hookResult.current.getManualBonusProductCollection('product-123')).toEqual([])
            expect(hookResult.current.getManualBonusProductCollection('product-456')).toHaveLength(
                1
            )
        })

        test('should handle removing non-existent collection', () => {
            act(() => {
                hookResult.current.removeManualBonusProductCollection('non-existent')
            })

            expect(hookResult.current.manualBonusProductCollections).toEqual({})
        })
    })

    describe('clearAllManualBonusProductCollections', () => {
        test('should clear all collections', () => {
            const bonusProducts = [{itemId: 'bonus-1', productId: 'bonus-product-1'}]

            act(() => {
                hookResult.current.createManualBonusProductCollection('product-123', bonusProducts)
                hookResult.current.createManualBonusProductCollection('product-456', bonusProducts)
            })

            act(() => {
                hookResult.current.clearAllManualBonusProductCollections()
            })

            expect(hookResult.current.manualBonusProductCollections).toEqual({})
        })
    })

    describe('findQualifyingProductIdFromCollections', () => {
        test('should find qualifying product ID when bonus product exists in collections', () => {
            const collections = {
                'product-123': [
                    {
                        itemId: 'bonus-item-1',
                        productId: 'bonus-product-1',
                        promotionId: 'promo-1',
                        bonusDiscountLineItemId: 'bonus-discount-1'
                    }
                ]
            }

            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                promotionId: 'promo-1'
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'qualifying-item-456',
                        productId: 'product-123',
                        bonusProductLineItem: false
                    }
                ]
            }

            const result = hookResult.current.findQualifyingProductIdFromCollections(
                bonusProduct,
                basket,
                collections
            )
            expect(result).toBe('qualifying-item-456')
        })

        test('should return regularProductId when basket is not provided', () => {
            const collections = {
                'product-123': [
                    {
                        itemId: 'bonus-item-1',
                        productId: 'bonus-product-1',
                        promotionId: 'promo-1'
                    }
                ]
            }

            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                promotionId: 'promo-1'
            }

            const result = hookResult.current.findQualifyingProductIdFromCollections(
                bonusProduct,
                null,
                collections
            )
            expect(result).toBe('product-123')
        })

        test('should return null when bonus product not found in collections', () => {
            const collections = {
                'product-123': [
                    {
                        itemId: 'different-bonus-item',
                        productId: 'different-bonus-product',
                        promotionId: 'different-promo'
                    }
                ]
            }

            const bonusProduct = {
                itemId: 'unknown-bonus-item',
                productId: 'unknown-bonus-product',
                promotionId: 'unknown-promo'
            }

            const result = hookResult.current.findQualifyingProductIdFromCollections(
                bonusProduct,
                null,
                collections
            )
            expect(result).toBeNull()
        })

        test('should match by productId and promotion fields when itemId is not available', () => {
            const collections = {
                'product-123': [
                    {
                        productId: 'bonus-product-1',
                        promotionId: 'promo-1',
                        bonusDiscountLineItemId: 'bonus-discount-1'
                        // No itemId
                    }
                ]
            }

            const bonusProduct = {
                productId: 'bonus-product-1',
                promotionId: 'promo-1',
                bonusDiscountLineItemId: 'bonus-discount-1'
                // No itemId
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'qualifying-item-789',
                        productId: 'product-123',
                        bonusProductLineItem: false
                    }
                ]
            }

            const result = hookResult.current.findQualifyingProductIdFromCollections(
                bonusProduct,
                basket,
                collections
            )
            expect(result).toBe('qualifying-item-789')
        })

        test('should handle empty collections', () => {
            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1'
            }

            const result = hookResult.current.findQualifyingProductIdFromCollections(
                bonusProduct,
                null,
                {}
            )
            expect(result).toBeNull()
        })

        test('should prefer itemId match over productId match', () => {
            const collections = {
                'product-123': [
                    {
                        itemId: 'bonus-item-1',
                        productId: 'bonus-product-1',
                        promotionId: 'promo-1'
                    },
                    {
                        itemId: 'different-item',
                        productId: 'bonus-product-1', // Same productId
                        promotionId: 'promo-1'       // Same promotionId
                    }
                ]
            }

            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                promotionId: 'promo-1'
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'qualifying-item-123',
                        productId: 'product-123',
                        bonusProductLineItem: false
                    }
                ]
            }

            const result = hookResult.current.findQualifyingProductIdFromCollections(
                bonusProduct,
                basket,
                collections
            )
            expect(result).toBe('qualifying-item-123')
        })
    })

    describe('getQualifyingProductItemId', () => {
        test('should return qualifyingProductItemId when it exists on bonus product', () => {
            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                qualifyingProductItemId: 'qualifying-item-123',
                promotionId: 'promo-1'
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct)
            expect(result).toBe('qualifying-item-123')
        })

        test('should fallback to manual collections when qualifyingProductItemId is undefined', () => {
            const regularProductId = 'product-123'
            const bonusProducts = [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    productName: 'Bonus Product 1',
                    quantity: 1,
                    promotionId: 'promo-1',
                    bonusDiscountLineItemId: 'bonus-discount-1'
                }
            ]

            // First create a manual bonus product collection
            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    bonusProducts
                )
            })

            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                promotionId: 'promo-1',
                bonusDiscountLineItemId: 'bonus-discount-1'
                // No qualifyingProductItemId
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'qualifying-item-456',
                        productId: 'product-123',
                        bonusProductLineItem: false,
                        quantity: 2
                    }
                ]
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct, basket)
            expect(result).toBe('qualifying-item-456')
        })

        test('should fallback to manual collections when qualifyingProductItemId is empty string', () => {
            const regularProductId = 'product-123'
            const bonusProducts = [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    productName: 'Bonus Product 1',
                    quantity: 1,
                    promotionId: 'promo-1',
                    bonusDiscountLineItemId: 'bonus-discount-1'
                }
            ]

            // First create a manual bonus product collection
            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    bonusProducts
                )
            })

            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                promotionId: 'promo-1',
                bonusDiscountLineItemId: 'bonus-discount-1',
                qualifyingProductItemId: '' // Empty string
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'qualifying-item-789',
                        productId: 'product-123',
                        bonusProductLineItem: false,
                        quantity: 1
                    }
                ]
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct, basket)
            expect(result).toBe('qualifying-item-789')
        })

        test('should match bonus product by productId and promotion fields when itemId is not available', () => {
            const regularProductId = 'product-123'
            const bonusProducts = [
                {
                    productId: 'bonus-product-1',
                    productName: 'Bonus Product 1',
                    quantity: 1,
                    promotionId: 'promo-1',
                    bonusDiscountLineItemId: 'bonus-discount-1'
                    // No itemId
                }
            ]

            // First create a manual bonus product collection
            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    bonusProducts
                )
            })

            const bonusProduct = {
                productId: 'bonus-product-1',
                promotionId: 'promo-1',
                bonusDiscountLineItemId: 'bonus-discount-1'
                // No itemId or qualifyingProductItemId
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'qualifying-item-999',
                        productId: 'product-123',
                        bonusProductLineItem: false,
                        quantity: 1
                    }
                ]
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct, basket)
            expect(result).toBe('qualifying-item-999')
        })

        test('should return regularProductId when basket is not provided', () => {
            const regularProductId = 'product-123'
            const bonusProducts = [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    productName: 'Bonus Product 1',
                    quantity: 1,
                    promotionId: 'promo-1'
                }
            ]

            // First create a manual bonus product collection
            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    bonusProducts
                )
            })

            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                promotionId: 'promo-1'
                // No qualifyingProductItemId
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct)
            expect(result).toBe('product-123')
        })

        test('should return null when bonus product is not found in collections', () => {
            const bonusProduct = {
                itemId: 'unknown-bonus-item',
                productId: 'unknown-bonus-product',
                promotionId: 'unknown-promo'
                // No qualifyingProductItemId
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct)
            expect(result).toBeNull()
        })

        test('should return null when bonus product and basket are null/undefined', () => {
            expect(hookResult.current.getQualifyingProductItemId(null)).toBeNull()
            expect(hookResult.current.getQualifyingProductItemId(undefined)).toBeNull()
        })

        test('should handle multiple collections and find correct match', () => {
            const regularProductId1 = 'product-123'
            const regularProductId2 = 'product-456'
            
            const bonusProducts1 = [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    promotionId: 'promo-1'
                }
            ]
            
            const bonusProducts2 = [
                {
                    itemId: 'bonus-item-2',
                    productId: 'bonus-product-2',
                    promotionId: 'promo-2'
                }
            ]

            // Create multiple collections
            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId1,
                    bonusProducts1
                )
                hookResult.current.createManualBonusProductCollection(
                    regularProductId2,
                    bonusProducts2
                )
            })

            const bonusProduct = {
                itemId: 'bonus-item-2',
                productId: 'bonus-product-2',
                promotionId: 'promo-2'
                // No qualifyingProductItemId
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'qualifying-item-123',
                        productId: 'product-123',
                        bonusProductLineItem: false
                    },
                    {
                        itemId: 'qualifying-item-456',
                        productId: 'product-456',
                        bonusProductLineItem: false
                    }
                ]
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct, basket)
            expect(result).toBe('qualifying-item-456')
        })

        test('should return null when qualifying product is not found in basket', () => {
            const regularProductId = 'product-123'
            const bonusProducts = [
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    promotionId: 'promo-1'
                }
            ]

            // First create a manual bonus product collection
            act(() => {
                hookResult.current.createManualBonusProductCollection(
                    regularProductId,
                    bonusProducts
                )
            })

            const bonusProduct = {
                itemId: 'bonus-item-1',
                productId: 'bonus-product-1',
                promotionId: 'promo-1'
                // No qualifyingProductItemId
            }

            const basket = {
                productItems: [
                    {
                        itemId: 'different-item-999',
                        productId: 'different-product-999',
                        bonusProductLineItem: false
                    }
                ]
            }

            const result = hookResult.current.getQualifyingProductItemId(bonusProduct, basket)
            expect(result).toBe('product-123') // Falls back to regularProductId
        })
    })

    describe('analyzeQualifyingProductChanges', () => {
        test('should detect added products', () => {
            const beforeBasket = {productItems: []}
            const afterBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 2,
                        bonusProductLineItem: false
                    }
                ]
            }
            const addedProductIds = ['product-1']

            const changes = hookResult.current.analyzeQualifyingProductChanges(
                beforeBasket,
                afterBasket,
                addedProductIds
            )

            expect(changes).toHaveLength(1)
            expect(changes[0]).toEqual({
                productId: 'product-1',
                oldQuantity: 0,
                newQuantity: 2,
                action: 'added'
            })
        })

        test('should detect quantity increases', () => {
            const beforeBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 1,
                        bonusProductLineItem: false
                    }
                ]
            }
            const afterBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 3,
                        bonusProductLineItem: false
                    }
                ]
            }

            const changes = hookResult.current.analyzeQualifyingProductChanges(
                beforeBasket,
                afterBasket,
                []
            )

            expect(changes).toHaveLength(1)
            expect(changes[0]).toEqual({
                productId: 'product-1',
                oldQuantity: 1,
                newQuantity: 3,
                action: 'increased'
            })
        })

        test('should detect quantity decreases', () => {
            const beforeBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 3,
                        bonusProductLineItem: false
                    }
                ]
            }
            const afterBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 1,
                        bonusProductLineItem: false
                    }
                ]
            }

            const changes = hookResult.current.analyzeQualifyingProductChanges(
                beforeBasket,
                afterBasket,
                []
            )

            expect(changes).toHaveLength(1)
            expect(changes[0]).toEqual({
                productId: 'product-1',
                oldQuantity: 3,
                newQuantity: 1,
                action: 'decreased'
            })
        })

        test('should detect product removal', () => {
            const beforeBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 2,
                        bonusProductLineItem: false
                    }
                ]
            }
            const afterBasket = {productItems: []}

            const changes = hookResult.current.analyzeQualifyingProductChanges(
                beforeBasket,
                afterBasket,
                []
            )

            expect(changes).toHaveLength(1)
            expect(changes[0]).toEqual({
                productId: 'product-1',
                oldQuantity: 2,
                newQuantity: 0,
                action: 'decreased'
            })
        })

        test('should ignore bonus products', () => {
            const beforeBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 1,
                        bonusProductLineItem: true
                    }
                ]
            }
            const afterBasket = {
                productItems: [
                    {
                        productId: 'product-1',
                        itemId: 'item-1',
                        quantity: 2,
                        bonusProductLineItem: true
                    }
                ]
            }

            const changes = hookResult.current.analyzeQualifyingProductChanges(
                beforeBasket,
                afterBasket,
                []
            )

            expect(changes).toHaveLength(0)
        })

        test('should handle empty baskets', () => {
            const changes = hookResult.current.analyzeQualifyingProductChanges({}, {}, [])
            expect(changes).toEqual([])
        })
    })

    describe('detectNewlyAddedBonusProducts', () => {
        test('should detect new bonus products and associate with qualifying products', () => {
            const beforeBasket = {
                bonusDiscountLineItems: [],
                productItems: [{productId: 'product-1', quantity: 1, bonusProductLineItem: false}]
            }

            const afterBasket = {
                bonusDiscountLineItems: [
                    {bonusDiscountLineItemId: 'bonus-discount-1', promotionId: 'promo-1'}
                ],
                productItems: [
                    {productId: 'product-1', quantity: 2, bonusProductLineItem: false},
                    {
                        productId: 'bonus-product-1',
                        itemId: 'bonus-item-1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        promotionId: 'promo-1'
                    }
                ]
            }

            const changedQualifyingProducts = [
                {productId: 'product-1', oldQuantity: 1, newQuantity: 2, action: 'increased'}
            ]

            const result = hookResult.current.detectNewlyAddedBonusProducts(
                beforeBasket,
                afterBasket,
                changedQualifyingProducts
            )

            expect(result.newBonusProducts).toHaveLength(1)
            expect(result.newBonusProducts[0]).toMatchObject({
                productId: 'bonus-product-1',
                bonusDiscountLineItemId: 'bonus-discount-1',
                bonusDiscountPromotionId: 'promo-1'
            })

            expect(result.qualifyingProductToBonusProducts['product-1']).toHaveLength(1)
            expect(result.qualifyingProductChanges['product-1']).toEqual({
                action: 'increased',
                oldQuantity: 1,
                newQuantity: 2,
                quantityDelta: 1
            })
        })

        test('should handle quantity decreases with trim operations', () => {
            const beforeBasket = {
                bonusDiscountLineItems: [
                    {bonusDiscountLineItemId: 'bonus-discount-1', promotionId: 'promo-1'}
                ],
                productItems: [{productId: 'product-1', quantity: 2, bonusProductLineItem: false}]
            }

            const afterBasket = {
                bonusDiscountLineItems: [
                    {bonusDiscountLineItemId: 'bonus-discount-1', promotionId: 'promo-1'}
                ],
                productItems: [{productId: 'product-1', quantity: 1, bonusProductLineItem: false}]
            }

            const changedQualifyingProducts = [
                {productId: 'product-1', oldQuantity: 2, newQuantity: 1, action: 'decreased'}
            ]

            const result = hookResult.current.detectNewlyAddedBonusProducts(
                beforeBasket,
                afterBasket,
                changedQualifyingProducts
            )

            expect(result.qualifyingProductToBonusProducts['product-1']).toEqual({
                action: 'trim',
                quantityReduction: 1,
                newQuantity: 1
            })
        })

        test('should handle empty inputs', () => {
            const result = hookResult.current.detectNewlyAddedBonusProducts({}, {}, [])

            expect(result.newBonusProducts).toEqual([])
            expect(result.qualifyingProductToBonusProducts).toEqual({})
            expect(result.qualifyingProductChanges).toEqual({})
        })

        test('should match bonus discount line items by promotionId when bonusDiscountLineItemId is missing', () => {
            const beforeBasket = {
                bonusDiscountLineItems: [],
                productItems: []
            }

            const afterBasket = {
                bonusDiscountLineItems: [
                    {promotionId: 'promo-1'} // No bonusDiscountLineItemId
                ],
                productItems: [
                    {
                        productId: 'bonus-product-1',
                        itemId: 'bonus-item-1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        promotionId: 'promo-1'
                    }
                ]
            }

            const changedQualifyingProducts = [
                {productId: 'product-1', oldQuantity: 0, newQuantity: 1, action: 'added'}
            ]

            const result = hookResult.current.detectNewlyAddedBonusProducts(
                beforeBasket,
                afterBasket,
                changedQualifyingProducts
            )

            expect(result.newBonusProducts).toHaveLength(1)
            expect(result.newBonusProducts[0].bonusDiscountPromotionId).toBe('promo-1')
        })
    })
})
