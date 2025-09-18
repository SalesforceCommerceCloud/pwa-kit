/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useBonusProductModalState} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-modal-state'

jest.mock('@salesforce/retail-react-app/app/hooks/use-modal-state')

import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'

describe('useBonusProductModalState', () => {
    const mockModalState = {
        isOpen: false,
        data: null,
        onOpen: jest.fn(),
        onClose: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
        useModalState.mockReturnValue(mockModalState)
    })

    test('initializes with correct default state', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        expect(result.current.isOpen).toBe(false)
        expect(result.current.data).toBeNull()
        expect(result.current.isSelectionOpen).toBe(false)
        expect(result.current.isViewOpen).toBe(false)
        expect(result.current.selectedProduct).toBeNull()
        expect(result.current.selectedBonusMeta.bonusDiscountLineItemId).toBeNull()
        expect(result.current.selectedBonusMeta.promotionId).toBeNull()
        expect(result.current.isProductLoading).toBe(false)
        expect(result.current.isWishlistLoading).toBe(false)
        expect(result.current.error).toBeNull()
        expect(result.current.wishlistError).toBeNull()
    })

    test('calls useModalState with correct configuration', () => {
        renderHook(() => useBonusProductModalState())

        expect(useModalState).toHaveBeenCalledWith({
            closeOnRouteChange: false,
            resetDataOnClose: true
        })
    })

    test('openSelectionModal opens modal and sets data', () => {
        const {result} = renderHook(() => useBonusProductModalState())
        const testData = {bonusDiscountLineItems: [{id: 'bonus-1'}]}

        act(() => {
            result.current.openSelectionModal(testData)
        })

        expect(mockModalState.onOpen).toHaveBeenCalledWith(testData)
        expect(result.current.isSelectionOpen).toBe(true)
    })

    test('closeSelectionModal closes modal and resets state', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        act(() => {
            result.current.closeSelectionModal()
        })

        expect(mockModalState.onClose).toHaveBeenCalled()
        expect(result.current.isSelectionOpen).toBe(false)
    })

    test('openProductView sets product view state', () => {
        const {result} = renderHook(() => useBonusProductModalState())
        const testProduct = {id: 'product-1'}
        const testBonusId = 'bonus-1'
        const testPromotionId = 'promo-1'

        act(() => {
            result.current.openProductView(testProduct, testBonusId, testPromotionId)
        })

        expect(result.current.isViewOpen).toBe(true)
        expect(result.current.selectedProduct).toBe(testProduct)
        expect(result.current.selectedBonusMeta.bonusDiscountLineItemId).toBe(testBonusId)
        expect(result.current.selectedBonusMeta.promotionId).toBe(testPromotionId)
    })

    test('closeProductView closes product view', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        act(() => {
            result.current.openProductView({id: 'product'}, 'bonus-1', 'promo-1')
        })

        act(() => {
            result.current.closeProductView()
        })

        expect(result.current.isViewOpen).toBe(false)
        expect(result.current.selectedProduct).toBeNull()
        expect(result.current.selectedBonusMeta.bonusDiscountLineItemId).toBeNull()
        expect(result.current.selectedBonusMeta.promotionId).toBeNull()
    })

    test('returnToSelection returns to selection view', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        act(() => {
            result.current.openProductView({id: 'product'}, 'bonus-1', 'promo-1')
        })

        act(() => {
            result.current.returnToSelection()
        })

        expect(result.current.isViewOpen).toBe(false)
        expect(result.current.selectedProduct).toBeNull()
    })

    test('setProductLoading sets loading state', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        act(() => {
            result.current.setProductLoading(true)
        })

        expect(result.current.isProductLoading).toBe(true)

        act(() => {
            result.current.setProductLoading(false)
        })

        expect(result.current.isProductLoading).toBe(false)
    })

    test('setWishlistLoading sets wishlist loading state', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        act(() => {
            result.current.setWishlistLoading(true)
        })

        expect(result.current.isWishlistLoading).toBe(true)
    })

    test('setError sets error state', () => {
        const {result} = renderHook(() => useBonusProductModalState())
        const testError = 'Test error'

        act(() => {
            result.current.setError(testError)
        })

        expect(result.current.error).toBe(testError)
    })

    test('setWishlistError sets wishlist error state', () => {
        const {result} = renderHook(() => useBonusProductModalState())
        const testError = 'Wishlist error'

        act(() => {
            result.current.setWishlistError(testError)
        })

        expect(result.current.wishlistError).toBe(testError)
    })

    test('resetState resets all state', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        act(() => {
            result.current.openSelectionModal({test: 'data'})
            result.current.setProductLoading(true)
            result.current.setError('error')
        })

        act(() => {
            result.current.resetState()
        })

        expect(result.current.isSelectionOpen).toBe(false)
        expect(result.current.isProductLoading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    test('handleClose resets state and closes modal', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        act(() => {
            result.current.openSelectionModal({test: 'data'})
            result.current.openProductView({id: 'product'}, 'bonus-1', 'promo-1')
        })

        act(() => {
            result.current.handleClose()
        })

        expect(result.current.isSelectionOpen).toBe(false)
        expect(result.current.isViewOpen).toBe(false)
        expect(mockModalState.onClose).toHaveBeenCalled()
    })

    test('returns all necessary functions and state', () => {
        const {result} = renderHook(() => useBonusProductModalState())

        const expectedFunctions = [
            'openSelectionModal',
            'closeSelectionModal',
            'openProductView',
            'closeProductView',
            'returnToSelection',
            'setProductLoading',
            'setWishlistLoading',
            'setError',
            'setWishlistError',
            'resetState',
            'handleClose'
        ]

        expectedFunctions.forEach((funcName) => {
            expect(typeof result.current[funcName]).toBe('function')
        })
    })
})
