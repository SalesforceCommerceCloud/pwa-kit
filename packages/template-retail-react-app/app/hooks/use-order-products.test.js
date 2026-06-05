/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {useOrderProducts} from '@salesforce/retail-react-app/app/hooks/use-order-products'

// Mock the Commerce SDK React hook
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProducts: jest.fn()
}))

// Mock the onClient check - ensure window is defined for client-side tests
global.window = global.window || {}

describe('useOrderProducts', () => {
    const mockProductItems = [
        {
            itemId: 'item1',
            productId: 'prod1',
            quantity: 1,
            price: 29.99
        },
        {
            itemId: 'item2',
            productId: 'prod2',
            quantity: 2,
            price: 39.99
        }
    ]

    const mockProducts = {
        prod1: {
            id: 'prod1',
            name: 'Test Product 1',
            imageGroups: [{images: [{disBaseLink: '/image1.jpg'}]}]
        },
        prod2: {
            id: 'prod2',
            name: 'Test Product 2',
            imageGroups: [{images: [{disBaseLink: '/image2.jpg'}]}]
        }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns empty variants when no productItems provided', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: false,
            error: null
        })

        const {result} = renderHook(() => useOrderProducts([]))

        expect(result.current.variants).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    test('fetches product data with correct parameters', () => {
        useProducts.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        })

        renderHook(() => useOrderProducts(mockProductItems))

        expect(useProducts).toHaveBeenCalledWith(
            {
                parameters: {
                    ids: 'prod1,prod2',
                    allImages: true
                }
            },
            expect.objectContaining({
                enabled: true,
                select: expect.any(Function)
            })
        )
    })

    test('merges product data with order items correctly', () => {
        useProducts.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        })

        const {result} = renderHook(() => useOrderProducts(mockProductItems))

        expect(result.current.variants).toHaveLength(2)

        const firstVariant = result.current.variants[0]
        expect(firstVariant).toEqual({
            // Product data
            id: 'prod1',
            name: 'Test Product 1',
            imageGroups: [{images: [{disBaseLink: '/image1.jpg'}]}],
            isProductUnavailable: false,
            // Order item data
            itemId: 'item1',
            productId: 'prod1',
            quantity: 1,
            price: 29.99
        })
    })

    test('handles missing product data gracefully', () => {
        useProducts.mockReturnValue({
            data: {
                // Only prod1 data, missing prod2
                prod1: mockProducts.prod1
            },
            isLoading: false,
            error: null
        })

        const {result} = renderHook(() => useOrderProducts(mockProductItems))

        expect(result.current.variants).toHaveLength(2)

        // First variant should have product data
        expect(result.current.variants[0].isProductUnavailable).toBe(false)
        expect(result.current.variants[0].name).toBe('Test Product 1')

        // Second variant should be marked as unavailable
        expect(result.current.variants[1].isProductUnavailable).toBe(true)
        expect(result.current.variants[1].name).toBeUndefined()
    })

    test('handles loading state', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: true,
            error: null
        })

        const {result} = renderHook(() => useOrderProducts(mockProductItems))

        expect(result.current.variants).toHaveLength(2)
        expect(result.current.variants[0].isProductUnavailable).toBe(true)
        expect(result.current.variants[1].isProductUnavailable).toBe(true)
        expect(result.current.isLoading).toBe(true)
    })

    test('handles error state', () => {
        const mockError = new Error('API Error')
        useProducts.mockReturnValue({
            data: null,
            isLoading: false,
            error: mockError
        })

        const {result} = renderHook(() => useOrderProducts(mockProductItems))

        expect(result.current.variants).toHaveLength(2)
        expect(result.current.variants[0].isProductUnavailable).toBe(true)
        expect(result.current.variants[1].isProductUnavailable).toBe(true)
        expect(result.current.error).toBe(mockError)
    })

    test('disables API call when no product items provided', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: false,
            error: null
        })

        renderHook(() => useOrderProducts([]))

        expect(useProducts).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                enabled: false
            })
        )
    })

    test('transforms API response correctly with select function', () => {
        const mockSelectFn = jest.fn()
        useProducts.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        })

        renderHook(() => useOrderProducts(mockProductItems))

        const selectFn = useProducts.mock.calls[0][1].select
        const mockApiResponse = {
            data: [
                {id: 'prod1', name: 'Product 1'},
                {id: 'prod2', name: 'Product 2'}
            ]
        }

        const result = selectFn(mockApiResponse)
        expect(result).toEqual({
            prod1: {id: 'prod1', name: 'Product 1'},
            prod2: {id: 'prod2', name: 'Product 2'}
        })
    })
})
