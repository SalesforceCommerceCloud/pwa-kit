/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook} from '@testing-library/react'
import {useCartProducts} from './use-cart-products'

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
    keepPreviousData: 'keepPreviousData'
}))

// Mock the commerce SDK hooks
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProducts: jest.fn()
}))

// Import the mocked function
import {useProducts} from '@salesforce/commerce-sdk-react'
const mockUseProducts = useProducts

describe('useCartProducts', () => {
    beforeEach(() => {
        mockUseProducts.mockClear()
    })

    describe('basic functionality', () => {
        it('should return empty data when basket is null', () => {
            // Mock both calls to useProducts
            mockUseProducts
                .mockReturnValueOnce({
                    data: null,
                    isPending: false
                })
                .mockReturnValueOnce({
                    data: null
                })

            const {result} = renderHook(() => useCartProducts(null))

            expect(result.current.products).toBeNull()
            expect(result.current.isProductsPending).toBe(false)
            expect(result.current.bundleChildProductData).toBeNull()
            expect(result.current.productsByItemId).toEqual({})
        })

        it('should return empty data when basket has no product items', () => {
            const basket = {
                productItems: []
            }

            mockUseProducts
                .mockReturnValueOnce({
                    data: null,
                    isPending: false
                })
                .mockReturnValueOnce({
                    data: null
                })

            const {result} = renderHook(() => useCartProducts(basket))

            expect(result.current.products).toBeNull()
            expect(result.current.isProductsPending).toBe(false)
            expect(result.current.bundleChildProductData).toBeNull()
            expect(result.current.productsByItemId).toEqual({})
        })
    })

    describe('main products fetching', () => {
        it('should fetch main products correctly', () => {
            const basket = {
                productItems: [
                    {productId: 'product1', itemId: 'item1'},
                    {productId: 'product2', itemId: 'item2'}
                ]
            }

            mockUseProducts
                .mockReturnValueOnce({
                    data: {
                        product1: {id: 'product1', name: 'Product 1'},
                        product2: {id: 'product2', name: 'Product 2'}
                    },
                    isPending: false
                })
                .mockReturnValueOnce({
                    data: null
                })

            const {result} = renderHook(() => useCartProducts(basket))

            expect(mockUseProducts).toHaveBeenCalledWith(
                {
                    parameters: {
                        ids: 'product1,product2',
                        allImages: true,
                        perPricebook: true
                    }
                },
                {
                    enabled: true,
                    select: expect.any(Function)
                }
            )

            expect(result.current.products).toEqual({
                product1: {id: 'product1', name: 'Product 1'},
                product2: {id: 'product2', name: 'Product 2'}
            })
        })

        it('should test the select function for main products', () => {
            const basket = {
                productItems: [{productId: 'product1', itemId: 'item1'}]
            }

            let selectFunction
            mockUseProducts
                .mockImplementationOnce((config, options) => {
                    selectFunction = options.select
                    return {
                        data: null,
                        isPending: false
                    }
                })
                .mockReturnValueOnce({
                    data: null
                })

            renderHook(() => useCartProducts(basket))

            // Test the select function
            const mockResult = {
                data: [
                    {id: 'product1', name: 'Product 1'},
                    {id: 'product2', name: 'Product 2'}
                ]
            }

            const transformedResult = selectFunction(mockResult)
            expect(transformedResult).toEqual({
                product1: {id: 'product1', name: 'Product 1'},
                product2: {id: 'product2', name: 'Product 2'}
            })
        })
    })

    describe('bundle child products fetching', () => {
        it('should fetch bundle child products when bundles exist', () => {
            const basket = {
                productItems: [
                    {
                        productId: 'bundle1',
                        itemId: 'item1',
                        bundledProductItems: [
                            {productId: 'child1', productName: 'Child 1'},
                            {productId: 'child2', productName: 'Child 2'}
                        ]
                    }
                ]
            }

            // Mock first call for main products
            mockUseProducts
                .mockReturnValueOnce({
                    data: {bundle1: {id: 'bundle1', name: 'Bundle 1'}},
                    isPending: false
                })
                // Mock second call for bundle child products
                .mockReturnValueOnce({
                    data: {
                        child1: {id: 'child1', inventory: {stockLevel: 10}},
                        child2: {id: 'child2', inventory: {stockLevel: 5}}
                    }
                })

            renderHook(() => useCartProducts(basket))

            // Check that second call was made for bundle children
            expect(mockUseProducts).toHaveBeenCalledTimes(2)
            expect(mockUseProducts).toHaveBeenNthCalledWith(
                2,
                {
                    parameters: {
                        ids: 'child1,child2',
                        allImages: false,
                        expand: ['availability', 'variations'],
                        select: '(data.(id,inventory))'
                    }
                },
                {
                    enabled: true,
                    placeholderData: 'keepPreviousData',
                    select: expect.any(Function)
                }
            )
        })

        it('should not fetch bundle child products when no bundles exist', () => {
            const basket = {
                productItems: [{productId: 'product1', itemId: 'item1'}]
            }

            mockUseProducts
                .mockReturnValueOnce({
                    data: {product1: {id: 'product1', name: 'Product 1'}},
                    isPending: false
                })
                .mockReturnValueOnce({
                    data: null
                })

            renderHook(() => useCartProducts(basket))

            // Check that second call was made but with enabled: false
            expect(mockUseProducts).toHaveBeenCalledTimes(2)
            expect(mockUseProducts).toHaveBeenNthCalledWith(
                2,
                expect.any(Object),
                expect.objectContaining({
                    enabled: false
                })
            )
        })

        it('should test the select function for bundle child products', () => {
            const basket = {
                productItems: [
                    {
                        productId: 'bundle1',
                        itemId: 'item1',
                        bundledProductItems: [{productId: 'child1', productName: 'Child 1'}]
                    }
                ]
            }

            let bundleChildSelectFunction
            mockUseProducts
                .mockReturnValueOnce({
                    data: {bundle1: {id: 'bundle1', name: 'Bundle 1'}},
                    isPending: false
                })
                .mockImplementationOnce((config, options) => {
                    bundleChildSelectFunction = options.select
                    return {
                        data: null
                    }
                })

            renderHook(() => useCartProducts(basket))

            // Test the select function for bundle child products
            const mockBundleChildResult = {
                data: [
                    {id: 'child1', inventory: {stockLevel: 10}},
                    {id: 'child2', inventory: {stockLevel: 5}}
                ]
            }

            const transformedResult = bundleChildSelectFunction(mockBundleChildResult)
            expect(transformedResult).toEqual({
                child1: {id: 'child1', inventory: {stockLevel: 10}},
                child2: {id: 'child2', inventory: {stockLevel: 5}}
            })
        })
    })

    describe('inventory calculations for bundles', () => {
        it('should calculate lowest stock level for bundle products', () => {
            const basket = {
                productItems: [
                    {
                        productId: 'bundle1',
                        itemId: 'item1',
                        bundledProductItems: [
                            {productId: 'child1', productName: 'Child 1'},
                            {productId: 'child2', productName: 'Child 2'}
                        ]
                    }
                ]
            }

            // Mock main products
            mockUseProducts
                .mockReturnValueOnce({
                    data: {
                        bundle1: {
                            id: 'bundle1',
                            name: 'Bundle 1',
                            inventory: {stockLevel: 100}
                        }
                    },
                    isPending: false
                })
                // Mock bundle child products
                .mockReturnValueOnce({
                    data: {
                        child1: {id: 'child1', inventory: {stockLevel: 10}},
                        child2: {id: 'child2', inventory: {stockLevel: 5}}
                    }
                })

            const {result} = renderHook(() => useCartProducts(basket))

            // Should use the lowest stock level (5) and track which product has it
            expect(result.current.productsByItemId['item1']).toEqual({
                id: 'bundle1',
                name: 'Bundle 1',
                inventory: {
                    stockLevel: 5,
                    lowestStockLevelProductName: 'Child 2'
                }
            })
        })

        it('should handle bundle products with no inventory data', () => {
            const basket = {
                productItems: [
                    {
                        productId: 'bundle1',
                        itemId: 'item1',
                        bundledProductItems: [{productId: 'child1', productName: 'Child 1'}]
                    }
                ]
            }

            // Mock main products without inventory
            mockUseProducts
                .mockReturnValueOnce({
                    data: {
                        bundle1: {
                            id: 'bundle1',
                            name: 'Bundle 1'
                        }
                    },
                    isPending: false
                })
                // Mock bundle child products
                .mockReturnValueOnce({
                    data: {
                        child1: {id: 'child1', inventory: {stockLevel: 10}}
                    }
                })

            const {result} = renderHook(() => useCartProducts(basket))

            // Should not modify inventory if parent has no inventory
            expect(result.current.productsByItemId['item1']).toEqual({
                id: 'bundle1',
                name: 'Bundle 1'
            })
        })

        it('should handle bundle child products with no inventory data', () => {
            const basket = {
                productItems: [
                    {
                        productId: 'bundle1',
                        itemId: 'item1',
                        bundledProductItems: [{productId: 'child1', productName: 'Child 1'}]
                    }
                ]
            }

            // Mock main products
            mockUseProducts
                .mockReturnValueOnce({
                    data: {
                        bundle1: {
                            id: 'bundle1',
                            name: 'Bundle 1',
                            inventory: {stockLevel: 100}
                        }
                    },
                    isPending: false
                })
                // Mock bundle child products without inventory
                .mockReturnValueOnce({
                    data: {
                        child1: {id: 'child1'}
                    }
                })

            const {result} = renderHook(() => useCartProducts(basket))

            // Should keep parent's stock level since child has no inventory (MAX_SAFE_INTEGER)
            // and the lowestStockLevelProductName should be empty since no child has lower inventory
            expect(result.current.productsByItemId['item1']).toEqual({
                id: 'bundle1',
                name: 'Bundle 1',
                inventory: {
                    stockLevel: 100,
                    lowestStockLevelProductName: ''
                }
            })
        })

        it('should handle equal stock levels and pick the last one encountered', () => {
            const basket = {
                productItems: [
                    {
                        productId: 'bundle1',
                        itemId: 'item1',
                        bundledProductItems: [
                            {productId: 'child1', productName: 'Child 1'},
                            {productId: 'child2', productName: 'Child 2'}
                        ]
                    }
                ]
            }

            // Mock main products
            mockUseProducts
                .mockReturnValueOnce({
                    data: {
                        bundle1: {
                            id: 'bundle1',
                            name: 'Bundle 1',
                            inventory: {stockLevel: 100}
                        }
                    },
                    isPending: false
                })
                // Mock bundle child products with equal stock levels
                .mockReturnValueOnce({
                    data: {
                        child1: {id: 'child1', inventory: {stockLevel: 5}},
                        child2: {id: 'child2', inventory: {stockLevel: 5}}
                    }
                })

            const {result} = renderHook(() => useCartProducts(basket))

            // Should use the last product with the lowest stock level
            expect(result.current.productsByItemId['item1']).toEqual({
                id: 'bundle1',
                name: 'Bundle 1',
                inventory: {
                    stockLevel: 5,
                    lowestStockLevelProductName: 'Child 2'
                }
            })
        })
    })

    describe('productsByItemId memoization', () => {
        it('should create productsByItemId mapping for regular products', () => {
            const basket = {
                productItems: [
                    {productId: 'product1', itemId: 'item1'},
                    {productId: 'product2', itemId: 'item2'}
                ]
            }

            mockUseProducts
                .mockReturnValueOnce({
                    data: {
                        product1: {id: 'product1', name: 'Product 1'},
                        product2: {id: 'product2', name: 'Product 2'}
                    },
                    isPending: false
                })
                .mockReturnValueOnce({
                    data: null
                })

            const {result} = renderHook(() => useCartProducts(basket))

            expect(result.current.productsByItemId).toEqual({
                item1: {id: 'product1', name: 'Product 1'},
                item2: {id: 'product2', name: 'Product 2'}
            })
        })

        it('should handle missing products in the mapping', () => {
            const basket = {
                productItems: [
                    {productId: 'product1', itemId: 'item1'},
                    {productId: 'product2', itemId: 'item2'}
                ]
            }

            mockUseProducts
                .mockReturnValueOnce({
                    data: {
                        product1: {id: 'product1', name: 'Product 1'}
                        // product2 is missing
                    },
                    isPending: false
                })
                .mockReturnValueOnce({
                    data: null
                })

            const {result} = renderHook(() => useCartProducts(basket))

            expect(result.current.productsByItemId).toEqual({
                item1: {id: 'product1', name: 'Product 1'},
                item2: undefined
            })
        })
    })
})
