/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {useBonusState} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import {useLocation} from 'react-router-dom'

// Mock the dependencies
jest.mock('react-router-dom', () => ({
    useLocation: jest.fn()
}))

jest.mock('./use-add-to-cart-modal', () => ({
    useAddToCartModalContext: jest.fn()
}))

// Mock localStorage
const localStorageMock = (() => {
    let store = {}
    return {
        getItem: jest.fn((key) => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value
        }),
        removeItem: jest.fn((key) => {
            delete store[key]
        }),
        clear: jest.fn(() => {
            store = {}
        })
    }
})()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('useBonusState', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks()
        localStorageMock.clear()
        useLocation.mockReturnValue({pathname: '/'})
        useAddToCartModalContext.mockReturnValue({
            onOpen: jest.fn()
        })
    })

    it('should initialize with empty state', () => {
        const {result} = renderHook(() => useBonusState())

        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toEqual({})
        expect(result.current.bonusProducts).toEqual([])
    })

    it('should load products from localStorage on initialization', () => {
        const mockProducts = [{id: 1, name: 'Product 1'}]
        localStorageMock.setItem('bonusProducts', JSON.stringify(mockProducts))

        const {result} = renderHook(() => useBonusState())

        expect(result.current.bonusProducts).toEqual(mockProducts)
    })

    it('should add products and update localStorage', () => {
        const {result} = renderHook(() => useBonusState())
        const newProducts = [{id: 2, name: 'Product 2'}]

        act(() => {
            result.current.addBonusProducts(newProducts)
        })

        expect(result.current.bonusProducts).toEqual(newProducts)
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'bonusProducts',
            JSON.stringify(newProducts)
        )
    })

    it('should clear products and remove from localStorage', () => {
        const {result} = renderHook(() => useBonusState())

        // First add some products
        act(() => {
            result.current.addBonusProducts([{id: 1, name: 'Product 1'}])
        })

        // Then clear them
        act(() => {
            result.current.clearBonusProducts()
        })

        expect(result.current.bonusProducts).toEqual([])
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('bonusProducts')
    })

    it('should handle modal open/close state', () => {
        const {result} = renderHook(() => useBonusState())
        const modalData = {product: {id: 1}, itemsAdded: 1, selectedQuantity: 1}

        act(() => {
            result.current.onOpen(modalData)
        })

        expect(result.current.isOpen).toBe(true)
        expect(result.current.data).toEqual(modalData)

        act(() => {
            result.current.onClose()
        })

        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toEqual({})
    })

    it('should close modal and open add to cart modal when closing with product data', () => {
        const mockOnAddToCartModalOpen = jest.fn()
        useAddToCartModalContext.mockReturnValue({
            onOpen: mockOnAddToCartModalOpen
        })

        const {result} = renderHook(() => useBonusState())
        const modalData = {product: {id: 1}, itemsAdded: 1, selectedQuantity: 1}

        act(() => {
            result.current.onOpen(modalData)
        })

        act(() => {
            result.current.onClose()
        })

        expect(mockOnAddToCartModalOpen).toHaveBeenCalledWith(modalData)
    })
})
