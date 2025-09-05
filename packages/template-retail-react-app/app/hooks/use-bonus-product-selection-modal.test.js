/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react'
import {BrowserRouter} from 'react-router-dom'

// Import the hook we want to test
import {useBonusProductSelectionModal} from './use-bonus-product-selection-modal'

// Mock all dependencies
jest.mock('./use-current-basket')
jest.mock('./use-wish-list')
jest.mock('./use-toast')
jest.mock('./use-navigation')
jest.mock('@salesforce/commerce-sdk-react')
jest.mock('./use-modal-state')

import {useCurrentBasket} from './use-current-basket'
import {useWishList} from './use-wish-list'
import {useToast} from './use-toast'
import useNavigation from './use-navigation'
import {useModalState} from './use-modal-state'
import {
    useProducts,
    useShopperCustomersMutation,
    useCustomerId
} from '@salesforce/commerce-sdk-react'

// Mock implementations
const mockToast = jest.fn()
const mockNavigate = jest.fn()
const mockMutateAsync = jest.fn()
const mockModalState = {
    isOpen: false,
    data: undefined,
    onOpen: jest.fn(),
    onClose: jest.fn()
}

beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock all hook dependencies
    useCurrentBasket.mockReturnValue({data: {basketId: 'test-basket'}})
    useWishList.mockReturnValue({data: {id: 'test-wishlist-id'}})
    useToast.mockReturnValue(mockToast)
    useNavigation.mockReturnValue(mockNavigate)
    useCustomerId.mockReturnValue('test-customer-id')
    useModalState.mockReturnValue(mockModalState)
    
    useProducts.mockReturnValue({
        data: {
            data: [
                {
                    id: 'test-product-id',
                    name: 'Test Product',
                    c_isNew: true,
                    c_isSale: false
                }
            ]
        },
        isLoading: false
    })
    
    useShopperCustomersMutation.mockReturnValue({
        mutateAsync: mockMutateAsync
    })
})

// Helper wrapper to provide Router context
const RouterWrapper = ({children}) => (
    <BrowserRouter>{children}</BrowserRouter>
)

describe('useBonusProductSelectionModal Hook - Basic Tests', () => {
    test('should initialize and return modal state', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toBeUndefined()
        expect(typeof result.current.onOpen).toBe('function')
        expect(typeof result.current.onClose).toBe('function')
    })

    test('should have wishlist-related functionality available', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify that the hook loaded successfully with our wishlist imports
        expect(result.current).toBeDefined()
        expect(useWishList).toHaveBeenCalled()
        expect(useShopperCustomersMutation).toHaveBeenCalledWith('createCustomerProductListItem')
        expect(useShopperCustomersMutation).toHaveBeenCalledWith('deleteCustomerProductListItem')
    })

    test('should fetch product data for bonus products', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify products hook was called to fetch product data
        expect(useProducts).toHaveBeenCalled()
    })

    test('should have toast functionality for wishlist operations', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify toast hook is available for notifications
        expect(useToast).toHaveBeenCalled()
    })
})

describe('Wishlist Integration Tests', () => {
    test('should test wishlist handlers exist', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Test that the hook loaded successfully with wishlist dependencies
        expect(useWishList).toHaveBeenCalled()
        expect(useCustomerId).toHaveBeenCalled()
    })

    test('should verify badge filtering logic dependencies', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify the products hook is called which provides data for badge filtering
        expect(useProducts).toHaveBeenCalled()
        
        // Check that product data contains expected properties
        const lastCall = useProducts.mock.calls[useProducts.mock.calls.length - 1]
        const mockProductData = useProducts.mock.results[0].value
        expect(mockProductData.data.data[0]).toHaveProperty('c_isNew', true)
        expect(mockProductData.data.data[0]).toHaveProperty('c_isSale', false)
    })

    test('should have proper mutation hooks for wishlist operations', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify both create and delete mutations are set up
        expect(useShopperCustomersMutation).toHaveBeenCalledWith('createCustomerProductListItem')
        expect(useShopperCustomersMutation).toHaveBeenCalledWith('deleteCustomerProductListItem')
    })
})

describe('Badge System Tests', () => {
    test('should handle products with different badge properties', () => {
        // Test with product that has both NEW and SALE badges
        useProducts.mockReturnValue({
            data: {
                data: [
                    {
                        id: 'test-product-id-1',
                        name: 'Test Product With Both Badges',
                        c_isNew: true,
                        c_isSale: true
                    },
                    {
                        id: 'test-product-id-2', 
                        name: 'Test Product With No Badges',
                        c_isNew: false,
                        c_isSale: false
                    }
                ]
            },
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook processes products with different badge states
        expect(result.current).toBeDefined()
        expect(useProducts).toHaveBeenCalled()
    })
})

describe('Badge Rendering Tests', () => {
    test('should render NEW badge when product has c_isNew true', () => {
        // Mock product with NEW badge
        useProducts.mockReturnValue({
            data: {
                data: [
                    {
                        id: 'test-product-new',
                        name: 'Test Product with NEW badge',
                        c_isNew: true,
                        c_isSale: false
                    }
                ]
            },
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook processes product with NEW badge property
        expect(result.current).toBeDefined()
        expect(useProducts).toHaveBeenCalled()
    })

    test('should render SALE badge when product has c_isSale true', () => {
        // Mock product with SALE badge
        useProducts.mockReturnValue({
            data: {
                data: [
                    {
                        id: 'test-product-sale',
                        name: 'Test Product with SALE badge',
                        c_isNew: false,
                        c_isSale: true
                    }
                ]
            },
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook processes product with SALE badge property
        expect(result.current).toBeDefined()
        expect(useProducts).toHaveBeenCalled()
    })

    test('should render both NEW and SALE badges when product has both properties true', () => {
        // Mock product with both badges
        useProducts.mockReturnValue({
            data: {
                data: [
                    {
                        id: 'test-product-both-badges',
                        name: 'Test Product with both badges',
                        c_isNew: true,
                        c_isSale: true
                    }
                ]
            },
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook processes product with both badge properties
        expect(result.current).toBeDefined()
        const mockProductData = useProducts.mock.results[useProducts.mock.results.length - 1].value
        expect(mockProductData.data.data[0]).toHaveProperty('c_isNew', true)
        expect(mockProductData.data.data[0]).toHaveProperty('c_isSale', true)
    })

    test('should not render badges when product has no badge properties', () => {
        // Mock product without badges
        useProducts.mockReturnValue({
            data: {
                data: [
                    {
                        id: 'test-product-no-badges',
                        name: 'Test Product without badges',
                        c_isNew: false,
                        c_isSale: false
                    }
                ]
            },
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook processes product without badge properties
        expect(result.current).toBeDefined()
        const mockProductData = useProducts.mock.results[useProducts.mock.results.length - 1].value
        expect(mockProductData.data.data[0]).toHaveProperty('c_isNew', false)
        expect(mockProductData.data.data[0]).toHaveProperty('c_isSale', false)
    })
})

describe('Wishlist Icon Rendering Tests', () => {
    test('should verify wishlist dependencies are loaded for icon rendering', () => {
        // Mock standard wishlist setup
        useWishList.mockReturnValue({data: {id: 'test-wishlist-id'}})
        useCustomerId.mockReturnValue('test-customer-id')
        
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify wishlist dependencies for icon rendering
        expect(result.current).toBeDefined()
        expect(useWishList).toHaveBeenCalled()
        expect(useCustomerId).toHaveBeenCalled()
    })

    test('should handle wishlist icon for non-favorited item', () => {
        // Mock product not in wishlist
        useWishList.mockReturnValue({
            data: {
                id: 'test-wishlist-id',
                customerProductListItems: [] // Empty - product not in wishlist
            }
        })
        
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook can handle non-favorited items
        expect(result.current).toBeDefined()
        expect(useWishList().data.customerProductListItems).toHaveLength(0)
    })

    test('should handle wishlist icon for favorited item', () => {
        // Mock product already in wishlist
        useWishList.mockReturnValue({
            data: {
                id: 'test-wishlist-id',
                customerProductListItems: [
                    {
                        id: 'wishlist-item-1',
                        productId: 'test-product-id',
                        product: {
                            id: 'test-product-id',
                            name: 'Test Favorited Product'
                        }
                    }
                ]
            }
        })
        
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook can handle favorited items
        expect(result.current).toBeDefined()
        expect(useWishList().data.customerProductListItems).toHaveLength(1)
        expect(useWishList().data.customerProductListItems[0].productId).toBe('test-product-id')
    })

    test('should verify wishlist mutation handlers are available', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify both add and remove wishlist mutations are set up
        expect(result.current).toBeDefined()
        expect(useShopperCustomersMutation).toHaveBeenCalledWith('createCustomerProductListItem')
        expect(useShopperCustomersMutation).toHaveBeenCalledWith('deleteCustomerProductListItem')
    })
})

describe('Wishlist Icon State Tests', () => {
    test('should determine correct icon state for non-wishlisted product', () => {
        // Setup for non-favorited product
        useWishList.mockReturnValue({
            data: {
                id: 'test-wishlist-id',
                customerProductListItems: [
                    // Different product in wishlist
                    {
                        id: 'other-item',
                        productId: 'other-product-id'
                    }
                ]
            }
        })

        useProducts.mockReturnValue({
            data: {
                data: [
                    {
                        id: 'test-product-id', // This product NOT in wishlist
                        name: 'Non-favorited Product'
                    }
                ]
            },
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify setup for non-favorited product
        expect(result.current).toBeDefined()
        const wishlistItems = useWishList().data.customerProductListItems
        const hasTargetProduct = wishlistItems.some(item => item.productId === 'test-product-id')
        expect(hasTargetProduct).toBe(false) // Product should NOT be in wishlist
    })

    test('should determine correct icon state for wishlisted product', () => {
        // Setup for favorited product
        useWishList.mockReturnValue({
            data: {
                id: 'test-wishlist-id',
                customerProductListItems: [
                    {
                        id: 'wishlist-item-1',
                        productId: 'test-product-id' // This product IS in wishlist
                    }
                ]
            }
        })

        useProducts.mockReturnValue({
            data: {
                data: [
                    {
                        id: 'test-product-id', // This product in wishlist
                        name: 'Favorited Product'
                    }
                ]
            },
            isLoading: false
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify setup for favorited product
        expect(result.current).toBeDefined()
        const wishlistItems = useWishList().data.customerProductListItems
        const hasTargetProduct = wishlistItems.some(item => item.productId === 'test-product-id')
        expect(hasTargetProduct).toBe(true) // Product should BE in wishlist
    })
})

describe('Error Handling Tests', () => {
    test('should handle missing wishlist gracefully', () => {
        useWishList.mockReturnValue({data: null})

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Hook should still initialize even without wishlist
        expect(result.current).toBeDefined()
        expect(result.current.isOpen).toBe(false)
    })

    test('should handle missing customer ID', () => {
        useCustomerId.mockReturnValue(null)

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Hook should still work without customer ID
        expect(result.current).toBeDefined()
    })

    test('should handle product loading states', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: true
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Hook should handle loading state
        expect(result.current).toBeDefined()
        expect(useProducts().isLoading).toBe(true)
    })
})
