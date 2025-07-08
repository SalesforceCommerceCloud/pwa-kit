/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import {useCartGiftItems} from './use-cart-gift-items'

let mockSetLocalIsGiftItems
jest.mock('react', () => {
    const actualReact = jest.requireActual('react')
    return {
        ...actualReact,
        useState: jest.fn((init) => {
            mockSetLocalIsGiftItems = jest.fn()
            return [init, mockSetLocalIsGiftItems]
        })
    }
})

// Mock the commerce SDK at the top level
const mockUpdateItemInBasketMutation = {
    mutateAsync: jest.fn()
}

jest.mock('@salesforce/commerce-sdk-react', () => ({
    __esModule: true,
    useShopperBasketsMutation: jest.fn(() => mockUpdateItemInBasketMutation)
}))

describe('useCartGiftItems', () => {
    let mockSetCartItemLoading
    let mockSetSelectedItem
    let mockShowError

    const mockBasket = {
        basketId: 'basket-1'
    }

    const product = {
        id: 'product-1',
        itemId: 'item-1',
        quantity: 2
    }

    beforeEach(() => {
        mockSetCartItemLoading = jest.fn()
        mockSetSelectedItem = jest.fn()
        mockShowError = jest.fn()

        // Clear the mock implementations
        mockUpdateItemInBasketMutation.mutateAsync.mockClear()
    })

    it('should call showError and reset loading/selected state if updateItemInBasketMutation.mutateAsync throws', async () => {
        // Arrange: make mutateAsync throw
        mockUpdateItemInBasketMutation.mutateAsync.mockRejectedValue(new Error('API Error'))

        const {result} = renderHook(() =>
            useCartGiftItems(mockBasket, mockSetCartItemLoading, mockSetSelectedItem, mockShowError)
        )

        // Act
        await act(async () => {
            await result.current.handleIsAGiftChange(product, true)
        })

        // Assert
        expect(mockShowError).toHaveBeenCalled()
        expect(mockSetCartItemLoading).toHaveBeenCalledWith(false)
        expect(mockSetSelectedItem).toHaveBeenCalledWith(undefined)
    })

    it('should call onSettled when updateItemInBasketMutation.mutateAsync is called', async () => {
        // Spy mutateAsync to call onSettled when invoked
        mockUpdateItemInBasketMutation.mutateAsync.mockImplementation(async (_args, options) => {
            if (options && typeof options.onSettled === 'function') {
                options.onSettled()
            }
            return Promise.resolve()
        })
        const {result} = renderHook(() =>
            useCartGiftItems(mockBasket, mockSetCartItemLoading, mockSetSelectedItem, mockShowError)
        )

        // Act
        await act(async () => {
            await result.current.handleIsAGiftChange(product, true)
        })

        // Assert
        expect(mockSetCartItemLoading).toHaveBeenCalledWith(false)
        expect(mockSetSelectedItem).toHaveBeenCalledWith(undefined)
    })

    it('should call onSuccess when updateItemInBasketMutation.mutateAsync is successful', async () => {
        // Spy mutateAsync to call onSuccess when invoked
        mockUpdateItemInBasketMutation.mutateAsync.mockImplementation(async (_args, options) => {
            if (options && typeof options.onSuccess === 'function') {
                options.onSuccess()
            }
            return Promise.resolve()
        })

        const {result} = renderHook(() =>
            useCartGiftItems(mockBasket, mockSetCartItemLoading, mockSetSelectedItem, mockShowError)
        )

        // Act
        await act(async () => {
            await result.current.handleIsAGiftChange(product, true)
        })

        // Assert
        expect(mockSetLocalIsGiftItems).toHaveBeenCalled()
    })

    it('should call onError when updateItemInBasketMutation.mutateAsync result is error', async () => {
        // Spy mutateAsync to call onError when invoked
        mockUpdateItemInBasketMutation.mutateAsync.mockImplementation(async (_args, options) => {
            if (options && typeof options.onError === 'function') {
                options.onError()
            }
            return Promise.resolve()
        })

        const {result} = renderHook(() =>
            useCartGiftItems(mockBasket, mockSetCartItemLoading, mockSetSelectedItem, mockShowError)
        )

        // Act
        await act(async () => {
            await result.current.handleIsAGiftChange(product, true)
        })

        // Assert
        expect(mockSetLocalIsGiftItems).toHaveBeenCalled()
        expect(mockShowError).toHaveBeenCalled()
    })
})
