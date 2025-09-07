/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {ComparisonProvider} from '@salesforce/retail-react-app/app/contexts'
import {useComparison} from '@salesforce/retail-react-app/app/hooks/use-comparison'
import mockProductHit from '@salesforce/retail-react-app/app/mocks/product-search-hit'

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

const wrapper = ({children}) => <ComparisonProvider>{children}</ComparisonProvider>

describe('useComparison', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorageMock.getItem.mockReturnValue('[]')
    })

    test('provides initial state', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        expect(result.current.comparedProducts).toEqual([])
        expect(result.current.isDrawerOpen).toBe(false)
        expect(result.current.canCompare).toBe(true)
        expect(result.current.hasProducts).toBe(false)
        expect(result.current.count).toBe(0)
    })

    test('adds product to comparison', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        act(() => {
            result.current.addToComparison(mockProductHit)
        })

        expect(result.current.comparedProducts).toHaveLength(1)
        expect(result.current.comparedProducts[0]).toEqual(mockProductHit)
        expect(result.current.hasProducts).toBe(true)
        expect(result.current.count).toBe(1)
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'comparedProducts',
            JSON.stringify([mockProductHit])
        )
    })

    test('removes product from comparison', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        // Add product first
        act(() => {
            result.current.addToComparison(mockProductHit)
        })

        // Then remove it
        act(() => {
            result.current.removeFromComparison(mockProductHit.productId)
        })

        expect(result.current.comparedProducts).toHaveLength(0)
        expect(result.current.hasProducts).toBe(false)
        expect(result.current.count).toBe(0)
    })

    test('checks if product is in comparison', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        expect(result.current.isInComparison(mockProductHit.productId)).toBe(false)

        act(() => {
            result.current.addToComparison(mockProductHit)
        })

        expect(result.current.isInComparison(mockProductHit.productId)).toBe(true)
    })

    test('clears all compared products', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        // Add product first
        act(() => {
            result.current.addToComparison(mockProductHit)
        })

        expect(result.current.comparedProducts).toHaveLength(1)

        // Clear all
        act(() => {
            result.current.clearComparison()
        })

        expect(result.current.comparedProducts).toHaveLength(0)
        expect(result.current.hasProducts).toBe(false)
    })

    test('prevents adding more than 4 products', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        // Add 4 products
        for (let i = 0; i < 4; i++) {
            act(() => {
                result.current.addToComparison({...mockProductHit, productId: `product-${i}`})
            })
        }

        expect(result.current.comparedProducts).toHaveLength(4)
        expect(result.current.canCompare).toBe(false)

        // Try to add 5th product - should throw error
        expect(() => {
            act(() => {
                result.current.addToComparison({...mockProductHit, productId: 'product-5'})
            })
        }).toThrow('Maximum 4 products can be compared at once')
    })

    test('prevents adding duplicate products', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        // Add product twice
        act(() => {
            result.current.addToComparison(mockProductHit)
        })
        act(() => {
            result.current.addToComparison(mockProductHit)
        })

        expect(result.current.comparedProducts).toHaveLength(1)
    })

    test('toggles drawer state', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        expect(result.current.isDrawerOpen).toBe(false)

        act(() => {
            result.current.toggleDrawer()
        })

        expect(result.current.isDrawerOpen).toBe(true)

        act(() => {
            result.current.toggleDrawer()
        })

        expect(result.current.isDrawerOpen).toBe(false)
    })

    test('opens and closes drawer', () => {
        const {result} = renderHook(() => useComparison(), {wrapper})

        act(() => {
            result.current.openDrawer()
        })

        expect(result.current.isDrawerOpen).toBe(true)

        act(() => {
            result.current.closeDrawer()
        })

        expect(result.current.isDrawerOpen).toBe(false)
    })

    test('loads persisted data from localStorage', () => {
        const persistedData = [mockProductHit]
        localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedData))

        const {result} = renderHook(() => useComparison(), {wrapper})

        expect(result.current.comparedProducts).toEqual(persistedData)
        expect(result.current.hasProducts).toBe(true)
        expect(result.current.count).toBe(1)
    })
})
