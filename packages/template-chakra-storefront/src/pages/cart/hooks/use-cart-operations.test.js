/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import {useCartOperations} from './use-cart-operations'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

// Mock the commerce SDK hooks
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn()
}))

// Mock the toast hook
jest.mock('../../../hooks/use-toast', () => ({
    __esModule: true,
    useToast: jest.fn(() => ({
        add: jest.fn(),
        close: jest.fn()
    }))
}))
// Mock the react-intl hook
jest.mock('react-intl', () => ({
    defineMessages: jest.fn(),
    defineMessage: jest.fn(),
    useIntl: jest.fn(() => ({
        formatMessage: jest.fn((message) => {
            if (!message) return ''
            return message.defaultMessage || message.id || ''
        })
    }))
}))

describe('useCartOperations', () => {
    let mockUpdateItemInBasketMutation
    let mockUpdateItemsInBasketMutation
    let mockRemoveItemFromBasketMutation
    let mockShowError

    const mockBasket = {
        basketId: 'test-basket-id',
        productItems: [
            {
                id: 'product-1',
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 2,
                price: 29.99
            },
            {
                id: 'product-2',
                itemId: 'item-2',
                productId: 'product-2',
                quantity: 1,
                price: 49.99
            }
        ]
    }

    const mockProductsByItemId = {
        'item-1': {
            id: 'product-1',
            name: 'Test Product 1',
            price: 29.99
        },
        'item-2': {
            id: 'product-2',
            name: 'Test Product 2',
            price: 49.99
        }
    }

    beforeEach(() => {
        mockShowError = jest.fn()

        // Don't clear mockSetCartItemLoading since we want to check its calls

        mockUpdateItemInBasketMutation = {
            mutateAsync: jest.fn(),
            isLoading: false
        }

        mockUpdateItemsInBasketMutation = {
            mutateAsync: jest.fn(),
            isLoading: false
        }

        mockRemoveItemFromBasketMutation = {
            mutateAsync: jest.fn(),
            isLoading: false
        }

        useShopperBasketsMutation.mockImplementation((mutationType) => {
            switch (mutationType) {
                case 'updateItemInBasket':
                    return mockUpdateItemInBasketMutation
                case 'updateItemsInBasket':
                    return mockUpdateItemsInBasketMutation
                case 'removeItemFromBasket':
                    return mockRemoveItemFromBasketMutation
                default:
                    return {}
            }
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('handleUpdateCart', () => {
        it('should update item quantity when same variant with different quantity', async () => {
            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const selectedItem = mockBasket.productItems[0]
            const variant = {productId: 'product-1', price: 29.99}
            const quantity = 3

            await act(async () => {
                await result.current.setSelectedItem(selectedItem)
            })

            await act(async () => {
                await result.current.handleUpdateCart(variant, quantity)
                result.current.changeItemQuantity.flush()
            })

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith(
                {
                    parameters: {
                        basketId: 'test-basket-id',
                        itemId: 'item-1'
                    },
                    body: {
                        productId: 'product-1',
                        quantity: 3
                    }
                },
                expect.any(Object)
            )
        })

        it('should add new variant to basket when variant does not exist', async () => {
            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const selectedItem = mockBasket.productItems[0]
            const variant = {productId: 'new-product', price: 39.99}
            const quantity = 1

            await act(async () => {
                await result.current.setSelectedItem(selectedItem)
            })

            await act(async () => {
                await result.current.handleUpdateCart(variant, quantity)
            })

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'new-product',
                    quantity: 1,
                    price: 39.99
                }
            })
        })

        it('should remove existing item and update quantity when variant already exists', async () => {
            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const selectedItem = mockBasket.productItems[0]
            const variant = {productId: 'product-2', price: 49.99}
            const quantity = 2

            await act(async () => {
                await result.current.setSelectedItem(selectedItem)
            })

            await act(async () => {
                await result.current.handleUpdateCart(variant, quantity)
                await result.current.changeItemQuantity.flush()
            })

            expect(mockRemoveItemFromBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                }
            })

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith(
                {
                    parameters: {
                        basketId: 'test-basket-id',
                        itemId: 'item-2'
                    },
                    body: {
                        productId: 'product-2',
                        quantity: 3 // 1 existing + 2 new
                    }
                },
                expect.any(Object)
            )
        })

        it('should call showError when mutation fails', async () => {
            // Mock the mutation to reject AND call the onError callback if it uses callbacks
            mockUpdateItemInBasketMutation.mutateAsync.mockRejectedValue(new Error('API Error'))

            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const selectedItem = mockBasket.productItems[0]
            const variant = {productId: 'product-1', price: 29.99}
            const quantity = 3

            await act(async () => {
                result.current.setSelectedItem(selectedItem)
                await result.current.handleUpdateCart(variant, quantity)
            })

            expect(mockShowError).toHaveBeenCalled()
        })
    })

    describe('handleUpdateBundle', () => {
        it('should update bundle with child products', async () => {
            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const bundle = {
                productId: 'bundle-1',
                price: 99.99
            }
            const bundleQuantity = 2
            const childProducts = [
                {productId: 'child-1', quantity: 1},
                {productId: 'child-2', quantity: 2}
            ]

            await act(async () => {
                await result.current.handleUpdateBundle(bundle, bundleQuantity, childProducts)
            })

            expect(mockUpdateItemsInBasketMutation.mutateAsync).toHaveBeenCalled()
        })

        it('should call showError when bundle update fails', async () => {
            // Mock the mutation to reject AND call the onError callback if it uses callbacks
            mockUpdateItemsInBasketMutation.mutateAsync.mockRejectedValue(new Error('API Error'))

            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const bundle = {
                productId: 'bundle-1',
                price: 99.99
            }
            const bundleQuantity = 2
            const childProducts = [{productId: 'child-1', quantity: 1}]

            await act(async () => {
                await result.current.handleUpdateBundle(bundle, bundleQuantity, childProducts)
            })

            expect(mockShowError).toHaveBeenCalled()
        })
    })

    describe('changeItemQuantity', () => {
        it('should update item quantity successfully', async () => {
            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const item = mockBasket.productItems[0]
            const newQuantity = 5

            await act(async () => {
                await result.current.changeItemQuantity(newQuantity, item)
                result.current.changeItemQuantity.flush()
            })

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith(
                {
                    parameters: {
                        basketId: 'test-basket-id',
                        itemId: 'item-1'
                    },
                    body: {
                        productId: 'product-1',
                        quantity: 5
                    }
                },
                expect.any(Object)
            )
        })

        it('should update item quantity successfully with onSettled callback', async () => {
            let onSettledCalled = false

            // Mock the mutation to call the onSettled callback
            mockUpdateItemInBasketMutation.mutateAsync.mockImplementation((params, options) => {
                if (options && options.onSettled) {
                    onSettledCalled = true
                    options.onSettled()
                }
                return Promise.resolve()
            })

            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const item = mockBasket.productItems[0]
            const newQuantity = 5

            await act(async () => {
                await result.current.changeItemQuantity(newQuantity, item)
                result.current.changeItemQuantity.flush()
            })

            expect(onSettledCalled).toBe(true)
        })

        it('should update item quantity successfully with onSuccess callback', async () => {
            let onSuccessCalled = false

            // Mock the mutation to call the onSuccess callback
            mockUpdateItemInBasketMutation.mutateAsync.mockImplementation((params, options) => {
                if (options && options.onSuccess) {
                    onSuccessCalled = true
                    options.onSuccess()
                }
                return Promise.resolve()
            })

            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const item = mockBasket.productItems[0]
            const newQuantity = 5

            await act(async () => {
                await result.current.changeItemQuantity(newQuantity, item)
                result.current.changeItemQuantity.flush()
            })

            expect(onSuccessCalled).toBe(true)
        })

        it('should handle quantity update to 0', async () => {
            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const item = mockBasket.productItems[0]
            const newQuantity = 0

            await act(async () => {
                const changeResult = await result.current.handleChangeItemQuantity(
                    item,
                    newQuantity
                )
                expect(changeResult).toBe(false)
            })
        })

        it('should handle quantity update to 1', async () => {
            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const item = mockBasket.productItems[0]
            const newQuantity = 1

            await act(async () => {
                const changeResult = await result.current.handleChangeItemQuantity(
                    item,
                    newQuantity
                )
                expect(changeResult).toBe(true)
            })
        })

        it('should call showError when quantity update fails', async () => {
            // Mock the mutation to reject AND call the onError callback
            mockUpdateItemInBasketMutation.mutateAsync.mockImplementation((params, options) => {
                options.onError()
            })

            const {result} = renderHook(() =>
                useCartOperations(mockBasket, mockProductsByItemId, mockShowError)
            )

            const item = mockBasket.productItems[0]
            const newQuantity = 5

            await act(async () => {
                await result.current.changeItemQuantity(newQuantity, item)
                result.current.changeItemQuantity.flush()
            })

            expect(mockShowError).toHaveBeenCalled()
        })
    })
})
