/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useProductInventory} from '@salesforce/retail-react-app/app/hooks/use-product-inventory'
import {normalizeSetBundleProduct} from '@salesforce/retail-react-app/app/utils/product-utils'

jest.mock('@salesforce/retail-react-app/app/utils/product-utils', () => ({
    normalizeSetBundleProduct: jest.fn()
}))

describe('useProductInventory', () => {
    const createChildProduct = (id, name, stockLevel, options = {}) => ({
        product: {
            id,
            name,
            ...(stockLevel !== undefined && {
                inventory: {stockLevel, orderable: true, ...options.inventory}
            }),
            ...(options.inventories && {inventories: options.inventories})
        },
        ...(options.quantity && {quantity: options.quantity})
    })

    const createProduct = (type, children = []) => ({
        id: `product-${type}`,
        name: `Product ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type: {[type]: true},
        childProducts: children
    })

    const createVariantData = (masterId, stockLevel, storeInventories = []) => ({
        master: {masterId},
        inventory: {stockLevel, orderable: true},
        inventories: storeInventories
    })

    const renderUseProductInventory = (
        product,
        variantData = null,
        storeId = null,
        isSet = false,
        isBundle = false
    ) => {
        return renderHook(() => useProductInventory(product, variantData, storeId, isSet, isBundle))
    }

    const setupNormalizeMock = () => {
        normalizeSetBundleProduct.mockImplementation((product) => ({
            ...product,
            childProducts: product?.childProducts || []
        }))
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('simple products', () => {
        it('should return product as-is for non-set, non-bundle products', () => {
            const simpleProduct = {
                id: 'simple-product',
                name: 'Simple Product',
                inventory: {stockLevel: 10, orderable: true}
            }

            const {result} = renderUseProductInventory(simpleProduct)

            expect(result.current).toBe(simpleProduct)
            expect(normalizeSetBundleProduct).not.toHaveBeenCalled()
        })

        it('should handle undefined productResponse gracefully', () => {
            const {result} = renderUseProductInventory(undefined)
            expect(result.current).toBeUndefined()
        })
    })

    describe('product sets', () => {
        beforeEach(setupNormalizeMock)

        it('should calculate lowest inventory across child products', () => {
            const children = [
                createChildProduct('child-1', 'Child Product 1', 5),
                createChildProduct('child-2', 'Child Product 2', 3), // Lowest
                createChildProduct('child-3', 'Child Product 3', 8)
            ]
            const productSet = createProduct('set', children)
            normalizeSetBundleProduct.mockReturnValue(productSet)

            const {result} = renderUseProductInventory(productSet, null, null, true, false)

            expect(result.current.inventory).toEqual({
                stockLevel: 3,
                orderable: true,
                lowestStockLevelProductName: 'Child Product 2'
            })
        })

        it('should not set inventory when any child is missing inventory', () => {
            const children = [
                createChildProduct('child-1', 'Child Product 1', 5),
                createChildProduct('child-2', 'Child Product 2') // No inventory
            ]
            const productSet = createProduct('set', children)
            normalizeSetBundleProduct.mockReturnValue(productSet)

            const {result} = renderUseProductInventory(productSet, null, null, true, false)

            expect(result.current.inventory).toBeUndefined()
        })

        it('should update child products with variant data', () => {
            const children = [
                createChildProduct('child-1', 'Child Product 1', 5),
                createChildProduct('child-2', 'Child Product 2', 10)
            ]
            const productSet = createProduct('set', children)
            normalizeSetBundleProduct.mockReturnValue(productSet)

            const variantProductData = {
                data: [
                    createVariantData('child-1', 15, [{id: 'store-1', stockLevel: 12}]),
                    createVariantData('child-2', 8, [{id: 'store-1', stockLevel: 6}]) // Lower
                ]
            }

            const {result} = renderUseProductInventory(
                productSet,
                variantProductData,
                null,
                true,
                false
            )

            expect(result.current.inventory).toEqual({
                stockLevel: 8,
                orderable: true,
                lowestStockLevelProductName: 'Child Product 2'
            })
        })

        it('should handle products without child products', () => {
            const productSet = createProduct('set')
            normalizeSetBundleProduct.mockReturnValue(productSet)

            const {result} = renderUseProductInventory(productSet, null, null, true, false)

            expect(result.current).toEqual(productSet)
        })
    })

    describe('store inventory', () => {
        beforeEach(setupNormalizeMock)

        const createStoreInventory = (storeId, stockLevel, orderable = true) => ({
            id: storeId,
            stockLevel,
            orderable
        })

        it('should calculate lowest store inventory when store is selected', () => {
            const children = [
                createChildProduct('child-1', 'Child Product 1', 10, {
                    inventories: [
                        createStoreInventory('store-1', 4),
                        createStoreInventory('store-2', 9)
                    ]
                }),
                createChildProduct('child-2', 'Child Product 2', 8, {
                    inventories: [
                        createStoreInventory('store-1', 2), // Lowest
                        createStoreInventory('store-2', 7)
                    ]
                })
            ]
            const productSet = createProduct('set', children)
            normalizeSetBundleProduct.mockReturnValue(productSet)

            const {result} = renderUseProductInventory(productSet, null, 'store-1', true, false)

            expect(result.current.inventories).toEqual([
                {
                    id: 'store-1',
                    stockLevel: 2,
                    orderable: true,
                    lowestStockLevelProductName: 'Child Product 2'
                }
            ])
        })

        it('should not set store inventory when any child is missing store inventory', () => {
            const children = [
                createChildProduct('child-1', 'Child Product 1', 10, {
                    inventories: [createStoreInventory('store-1', 4)]
                }),
                createChildProduct('child-2', 'Child Product 2', 8, {
                    inventories: [createStoreInventory('store-2', 5)] // Missing store-1
                })
            ]
            const productSet = createProduct('set', children)
            normalizeSetBundleProduct.mockReturnValue(productSet)

            const {result} = renderUseProductInventory(productSet, null, 'store-1', true, false)

            expect(result.current.inventories).toBeUndefined()
        })
    })

    describe('product bundles', () => {
        beforeEach(setupNormalizeMock)

        it('should normalize bundle products', () => {
            const children = [createChildProduct('bundle-child-1', 'Bundle Child 1', 5)]
            const productBundle = createProduct('bundle', children)
            normalizeSetBundleProduct.mockReturnValue(productBundle)

            const {result} = renderUseProductInventory(productBundle, null, null, false, true)

            expect(normalizeSetBundleProduct).toHaveBeenCalledWith(productBundle)
            expect(result.current).toEqual(productBundle)
            expect(result.current.inventory).toBeUndefined() // Bundles don't calculate lowest
        })

        it('should update bundle child products with variant data', () => {
            const children = [
                createChildProduct('bundle-child-1', 'Bundle Child 1', 5, {quantity: 2})
            ]
            const productBundle = createProduct('bundle', children)
            normalizeSetBundleProduct.mockReturnValue(productBundle)

            const variantProductData = {
                data: [createVariantData('bundle-child-1', 20, [{id: 'store-1', stockLevel: 15}])]
            }

            const {result} = renderUseProductInventory(
                productBundle,
                variantProductData,
                null,
                false,
                true
            )

            expect(result.current.childProducts[0].product.inventory.stockLevel).toBe(20)
            expect(result.current.childProducts[0].product.inventories).toEqual([
                {id: 'store-1', stockLevel: 15}
            ])
        })
    })
})
