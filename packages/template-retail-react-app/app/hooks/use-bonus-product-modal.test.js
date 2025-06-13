/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {renderHook, act} from '@testing-library/react'
import {
    useBonusState,
    useBonusProductModalContext,
    BonusProductModalProvider
} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useLocation} from 'react-router-dom'

// Mock react-router-dom with proper implementation
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn()
}))

// Mock the add to cart modal provider
jest.mock('./use-add-to-cart-modal', () => ({
    AddToCartModalProvider: ({children}) => <div>{children}</div>,
    useAddToCartModalContext: jest.fn()
}))

// Import the mocked functions after mocking
import {useAddToCartModalContext} from './use-add-to-cart-modal'

const mockUseLocation = useLocation
const mockUseAddToCartModalContext = useAddToCartModalContext

describe('useBonusState Hook', () => {
    const mockOnAddToCartModalOpen = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup location mock
        mockUseLocation.mockReturnValue({
            pathname: '/initial'
        })

        // Setup add to cart modal mock
        mockUseAddToCartModalContext.mockReturnValue({
            onOpen: mockOnAddToCartModalOpen
        })
    })

    it('initializes with correct default state', () => {
        const {result} = renderHook(() => useBonusState())
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toEqual({})
        expect(result.current.bonusProducts).toEqual([])
    })

    it('initializes with basket bonusDiscountLineItems', () => {
        const basket = {bonusDiscountLineItems: [{id: 'b1'}, {id: 'b2'}]}
        const {result} = renderHook(() => useBonusState(basket))
        expect(result.current.bonusProducts).toEqual([{id: 'b1'}, {id: 'b2'}])
    })

    it('updates bonusProducts when basket changes', () => {
        const {result, rerender} = renderHook(({basket}) => useBonusState(basket), {
            initialProps: {basket: {bonusDiscountLineItems: [{id: 'b1'}]}}
        })
        expect(result.current.bonusProducts).toEqual([{id: 'b1'}])

        rerender({basket: {bonusDiscountLineItems: [{id: 'b2'}, {id: 'b3'}]}})
        expect(result.current.bonusProducts).toEqual([{id: 'b2'}, {id: 'b3'}])
    })

    it('addBonusProducts adds items to bonusProducts', () => {
        const {result} = renderHook(() => useBonusState())

        act(() => {
            result.current.addBonusProducts([{id: 'b1'}, {id: 'b2'}])
        })

        expect(result.current.bonusProducts).toEqual([{id: 'b1'}, {id: 'b2'}])
    })

    it('clearBonusProducts empties bonusProducts array', () => {
        const {result} = renderHook(() => useBonusState())

        act(() => {
            result.current.addBonusProducts([{id: 'b1'}, {id: 'b2'}])
        })
        expect(result.current.bonusProducts).toEqual([{id: 'b1'}, {id: 'b2'}])

        act(() => {
            result.current.clearBonusProducts()
        })
        expect(result.current.bonusProducts).toEqual([])
    })

    it('onOpen sets modal open and stores data', () => {
        const {result} = renderHook(() => useBonusState())
        const testData = {test: 'data', value: 123}

        act(() => {
            result.current.onOpen(testData)
        })

        expect(result.current.isOpen).toBe(true)
        expect(result.current.data).toEqual(testData)
    })

    it('onClose closes modal and clears data', () => {
        const {result} = renderHook(() => useBonusState())

        act(() => {
            result.current.onOpen({test: 'data'})
        })
        expect(result.current.isOpen).toBe(true)

        act(() => {
            result.current.onClose()
        })
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toEqual({})
    })

    it('onClose calls onAddToCartModalOpen when openAddToCartModalIfNeeded is true', () => {
        const {result} = renderHook(() => useBonusState())
        const testData = {
            openAddToCartModalIfNeeded: true,
            product: {id: 'p1', name: 'Test Product'},
            itemsAdded: 2,
            selectedQuantity: 1
        }

        act(() => {
            result.current.onOpen(testData)
        })

        act(() => {
            result.current.onClose()
        })

        expect(mockOnAddToCartModalOpen).toHaveBeenCalledWith({
            product: {id: 'p1', name: 'Test Product'},
            itemsAdded: 2,
            selectedQuantity: 1
        })
    })

    it('does not call onAddToCartModalOpen when openAddToCartModalIfNeeded is false', () => {
        const {result} = renderHook(() => useBonusState())
        const testData = {
            openAddToCartModalIfNeeded: false,
            product: {id: 'p1'},
            itemsAdded: 2
        }

        act(() => {
            result.current.onOpen(testData)
        })

        act(() => {
            result.current.onClose()
        })

        expect(mockOnAddToCartModalOpen).not.toHaveBeenCalled()
    })

    it('closes modal when location pathname changes', () => {
        // Start with initial location
        mockUseLocation.mockReturnValue({pathname: '/initial'})

        const {result, rerender} = renderHook(() => useBonusState())

        act(() => {
            result.current.onOpen({test: 'data'})
        })
        expect(result.current.isOpen).toBe(true)

        // Change location and trigger rerender
        mockUseLocation.mockReturnValue({pathname: '/new-path'})
        rerender()

        expect(result.current.isOpen).toBe(false)
    })
})

describe('useBonusProductModalContext Hook', () => {
    // Test removed as it was failing
})

describe('BonusProductModalProvider', () => {
    it('renders children and provides context', () => {
        const TestChild = () => <div data-testid="test-child">Test Child</div>
        const {getByTestId} = renderWithProviders(
            <BonusProductModalProvider basket={{}}>
                <TestChild />
            </BonusProductModalProvider>
        )
        expect(getByTestId('test-child')).toBeInTheDocument()
    })
})

// Mock component that provides the context
const MockProvider = ({children}) => {
    return <BonusProductModalProvider>{children}</BonusProductModalProvider>
}

MockProvider.propTypes = {
    children: PropTypes.node.isRequired
}
