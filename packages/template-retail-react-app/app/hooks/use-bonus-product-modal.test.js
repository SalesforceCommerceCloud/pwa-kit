/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderHook, act, render} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {useLocation} from 'react-router-dom'
import {
    useBonusState,
    BonusProductModalProvider,
    useBonusProductModalContext,
    BonusProductModal
} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'

// Mock react-router-dom's useLocation
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn()
}))

// Mock useAddToCartModalContext
const mockOnAddToCartModalOpen = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal', () => ({
    useAddToCartModalContext: () => ({onOpen: mockOnAddToCartModalOpen})
}))

describe('useBonusState', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useLocation.mockReturnValue({pathname: '/initial'})
    })

    it('initializes with correct state from basket', () => {
        const basket = {bonusDiscountLineItems: [{id: 'b1'}]}
        const {result} = renderHook(() => useBonusState(basket))
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toEqual({})
        expect(result.current.bonusProducts).toEqual([{id: 'b1'}])
    })

    it('updates bonusProducts when basket changes', () => {
        const {result, rerender} = renderHook(({basket}) => useBonusState(basket), {
            initialProps: {basket: {bonusDiscountLineItems: [{id: 'b1'}]}}
        })
        rerender({basket: {bonusDiscountLineItems: [{id: 'b2'}]}})
        expect(result.current.bonusProducts).toEqual([{id: 'b2'}])
    })

    it('addBonusProducts adds items', () => {
        const {result} = renderHook(() => useBonusState())
        act(() => {
            result.current.addBonusProducts([{id: 'b3'}])
        })
        expect(result.current.bonusProducts).toEqual([{id: 'b3'}])
    })

    it('clearBonusProducts empties bonusProducts', () => {
        const {result} = renderHook(() => useBonusState())
        act(() => {
            result.current.addBonusProducts([{id: 'b4'}])
        })
        act(() => {
            result.current.clearBonusProducts()
        })
        expect(result.current.bonusProducts).toEqual([])
    })

    it('onOpen sets modal open and stores data', () => {
        const {result} = renderHook(() => useBonusState())
        act(() => {
            result.current.onOpen({foo: 'bar'})
        })
        expect(result.current.isOpen).toBe(true)
        expect(result.current.data).toEqual({foo: 'bar'})
    })

    it('onClose closes modal and clears data', () => {
        const {result} = renderHook(() => useBonusState())
        act(() => {
            result.current.onOpen({foo: 'bar'})
        })
        act(() => {
            result.current.onClose()
        })
        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toEqual({})
    })

    it('onClose calls onAddToCartModalOpen if needed', () => {
        const {result} = renderHook(() => useBonusState())
        const data = {
            openAddToCartModalIfNeeded: true,
            product: {id: 'p1'},
            itemsAdded: 2,
            selectedQuantity: 1
        }
        act(() => {
            result.current.onOpen(data)
        })
        act(() => {
            result.current.onClose()
        })
        expect(mockOnAddToCartModalOpen).toHaveBeenCalledWith({
            product: {id: 'p1'},
            itemsAdded: 2,
            selectedQuantity: 1
        })
    })

    it('closes modal on location change', () => {
        let location = {pathname: '/foo'}
        useLocation.mockImplementation(() => location)
        const {result, rerender} = renderHook(() => useBonusState())
        act(() => {
            result.current.onOpen({foo: 'bar'})
        })
        expect(result.current.isOpen).toBe(true)
        // Simulate location change
        location = {pathname: '/bar'}
        rerender()
        expect(result.current.isOpen).toBe(false)
    })
})

describe('BonusProductModalProvider', () => {
    it('provides context to children', () => {
        const basket = {bonusDiscountLineItems: [{id: 'b1'}]}
        const TestChild = () => {
            const ctx = useBonusProductModalContext()
            return <div data-testid="ctx">{JSON.stringify(ctx.bonusProducts)}</div>
        }
        const {getByTestId} = render(
            <ChakraProvider>
                <BonusProductModalProvider basket={basket}>
                    <TestChild />
                </BonusProductModalProvider>
            </ChakraProvider>
        )
        expect(getByTestId('ctx').textContent).toContain('b1')
    })
})
