/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {BrowserRouter} from 'react-router-dom'

// Import the hook we want to test
import {useBonusProductSelectionModal} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal'

// Mock all dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-modal-state')

import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'

// Mock implementations
const mockModalState = {
    isOpen: false,
    data: undefined,
    onOpen: jest.fn(),
    onClose: jest.fn()
}

beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock the modal state hook
    useModalState.mockReturnValue(mockModalState)
})

// Router wrapper for tests that need routing context
const RouterWrapper = ({children}) => <BrowserRouter>{children}</BrowserRouter>

describe('useBonusProductSelectionModal Hook - Basic Tests', () => {
    test('should initialize and return modal state', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(result.current).toBeDefined()
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toBeUndefined()
        expect(typeof result.current.onOpen).toBe('function')
        expect(typeof result.current.onClose).toBe('function')
    })

    test('should use modal state hook with correct configuration', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify useModalState was called with correct configuration
        expect(useModalState).toHaveBeenCalledWith({
            closeOnRouteChange: false,
            resetDataOnClose: true
        })
    })

    test('should return modal state functions', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook returns modal state that can be used to manage modal
        expect(result.current).toBeDefined()
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toBeUndefined()
        expect(typeof result.current.onOpen).toBe('function')
        expect(typeof result.current.onClose).toBe('function')
    })

    test('should handle modal open state changes', () => {
        const mockOpenModalState = {
            ...mockModalState,
            isOpen: true,
            data: {productId: 'test-product'}
        }
        
        useModalState.mockReturnValue(mockOpenModalState)

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(result.current.isOpen).toBe(true)
        expect(result.current.data).toEqual({productId: 'test-product'})
    })
})

describe('Modal State Management Tests', () => {
    test('should handle modal opening', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Test that onOpen function is available
        expect(typeof result.current.onOpen).toBe('function')
        
        // Test calling onOpen
        act(() => {
            result.current.onOpen({productId: 'test'})
        })

        expect(mockModalState.onOpen).toHaveBeenCalledWith({productId: 'test'})
    })

    test('should handle modal closing', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Test that onClose function is available
        expect(typeof result.current.onClose).toBe('function')
        
        // Test calling onClose
        act(() => {
            result.current.onClose()
        })

        expect(mockModalState.onClose).toHaveBeenCalled()
    })

    test('should maintain modal state consistency', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify initial state
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toBeUndefined()

        // Verify functions are available
        expect(typeof result.current.onOpen).toBe('function')
        expect(typeof result.current.onClose).toBe('function')
    })
})

describe('Hook Configuration Tests', () => {
    test('should configure modal to not close on route change', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(useModalState).toHaveBeenCalledWith(
            expect.objectContaining({
                closeOnRouteChange: false
            })
        )
    })

    test('should configure modal to reset data on close', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(useModalState).toHaveBeenCalledWith(
            expect.objectContaining({
                resetDataOnClose: true
            })
        )
    })

    test('should use correct modal state configuration', () => {
        renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(useModalState).toHaveBeenCalledTimes(1)
        expect(useModalState).toHaveBeenCalledWith({
            closeOnRouteChange: false,
            resetDataOnClose: true
        })
    })
})

describe('Error Handling Tests', () => {
    test('should handle missing modal state gracefully', () => {
        useModalState.mockReturnValue({
            isOpen: false,
            data: undefined,
            onOpen: undefined,
            onClose: undefined
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(result.current).toBeDefined()
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toBeUndefined()
    })

    test('should handle modal state with null data', () => {
        useModalState.mockReturnValue({
            ...mockModalState,
            data: null
        })

        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(result.current.data).toBe(null)
    })

    test('should handle modal state loading states', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        expect(result.current).toBeDefined()
        expect(typeof result.current.isOpen).toBe('boolean')
    })

    test('should handle return flow with missing bonus products gracefully', () => {
        const {result} = renderHook(() => useBonusProductSelectionModal(), {
            wrapper: RouterWrapper
        })

        // Verify hook handles undefined data gracefully
        expect(result.current.data).toBeUndefined()
        expect(result.current.isOpen).toBe(false)
    })
})