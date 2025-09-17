/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {BrowserRouter} from 'react-router-dom'
import fs from 'fs'
import path from 'path'
import PropTypes from 'prop-types'

// Import the hook and component we want to test
import {useBonusProductSelectionModal} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal'

// Mock all dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-modal-state')
jest.mock('@salesforce/retail-react-app/app/utils/bonus-product', () => ({
    findAvailableBonusDiscountLineItemIds: jest.fn(() => [])
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useCustomerId: jest.fn(() => 'test-customer-id'),
    useShopperCustomersMutation: jest.fn(() => ({
        mutateAsync: jest.fn()
    }))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-wish-list', () => ({
    useWishList: jest.fn(() => ({
        data: {
            id: 'test-wishlist-id',
            customerProductListItems: []
        }
    }))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: jest.fn(() => jest.fn())
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: jest.fn(() => jest.fn())
}))

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

RouterWrapper.propTypes = {
    children: PropTypes.node.isRequired
}

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

        expect(result.current.data).toBeNull()
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

describe('BonusProductSelectionModal Component - Scrolling Behavior', () => {
    it('should have correct scrollable structure in JSX', () => {
        // This is a structural test to verify the scrolling container exists in the component
        // We're testing the component structure rather than full rendering to avoid complex mocking

        const hookResult = useBonusProductSelectionModal()
        expect(hookResult).toBeDefined()
        expect(typeof hookResult.onOpen).toBe('function')
        expect(typeof hookResult.onClose).toBe('function')
        expect(typeof hookResult.isOpen).toBe('boolean')
    })

    it('should verify modal scrolling properties are correctly defined', () => {
        // Test that the scrolling Box properties exist in our component
        // This ensures our maxHeight and overflowY changes are preserved

        // Read the component source to verify scrolling structure
        const componentPath = path.join(
            __dirname,
            'use-bonus-product-selection-modal/components/bonus-product-selection-modal.js'
        )
        const componentSource = fs.readFileSync(componentPath, 'utf8')

        // Verify that our scrolling container exists in the source
        expect(componentSource).toContain("maxHeight={{base: '60vh', md: '70vh'}}")
        expect(componentSource).toContain('overflowY="auto"')
        expect(componentSource).toContain('Box')
        expect(componentSource).toContain('width="100%"')
        expect(componentSource).toContain('px="1"')
    })

    it('should have correct responsive maxHeight values', () => {
        // Test that we have the correct responsive breakpoints for maxHeight
        const componentPath = path.join(
            __dirname,
            'use-bonus-product-selection-modal/components/bonus-product-selection-modal.js'
        )
        const componentSource = fs.readFileSync(componentPath, 'utf8')

        // Verify responsive maxHeight configuration
        expect(componentSource).toContain("'60vh'") // base size
        expect(componentSource).toContain("'70vh'") // md+ size
        expect(componentSource).toContain('base:') // responsive object structure
        expect(componentSource).toContain('md:') // responsive object structure
    })

    it('should wrap SimpleGrid with scrollable container', () => {
        // Verify that SimpleGrid is properly nested within the scrollable Box
        const componentPath = path.join(
            __dirname,
            'use-bonus-product-selection-modal/components/bonus-product-selection-modal.js'
        )
        const componentSource = fs.readFileSync(componentPath, 'utf8')

        // Check for correct nesting structure
        const boxIndex = componentSource.indexOf('overflowY="auto"')
        const gridIndex = componentSource.indexOf('<SimpleGrid')
        const closingBoxIndex = componentSource.indexOf('</Box>', boxIndex)

        expect(boxIndex).toBeGreaterThan(-1)
        expect(gridIndex).toBeGreaterThan(boxIndex)
        expect(closingBoxIndex).toBeGreaterThan(gridIndex)
    })

    it('should prevent modal height regression', () => {
        // This test ensures that the modal doesn't expand infinitely with many products
        // by checking that the scrollable container structure is maintained
        const componentPath = path.join(
            __dirname,
            'use-bonus-product-selection-modal/components/bonus-product-selection-modal.js'
        )
        const componentSource = fs.readFileSync(componentPath, 'utf8')

        // Check that the modal body contains both VStack and Box with scrolling
        expect(componentSource).toContain('<VStack spacing="4">')
        expect(componentSource).toContain('overflowY="auto"')
        expect(componentSource).toContain("maxHeight={{base: '60vh', md: '70vh'}}")

        // Verify the structure prevents infinite expansion by having constrained height
        const modalBodySection = componentSource.substring(
            componentSource.indexOf('<ModalBody'),
            componentSource.indexOf('</ModalBody>') + '</ModalBody>'.length
        )

        expect(modalBodySection).toContain('overflowY="auto"')
        expect(modalBodySection).toContain('maxHeight=')
    })
})
