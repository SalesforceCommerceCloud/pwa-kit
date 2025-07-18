/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act, waitFor} from '@testing-library/react'
import {useWishList} from './use-wish-list'
import {renderWithProviders} from '../utils/test-utils'

// Mock dependencies
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => require('../config/mocks/mock-config'))
}))

const mockCreateCustomerProductList = jest.fn()
const mockCreateCustomerProductListItem = jest.fn()
const mockDeleteCustomerProductListItem = jest.fn()
const mockToast = jest.fn()
const mockNavigate = jest.fn()
const mockFormatMessage = jest.fn((msg) => msg.defaultMessage || msg.id)

// Mock all the dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCustomerProductLists: jest.fn(),
    useShopperCustomersMutation: jest.fn((operation) => {
        switch (operation) {
            case 'createCustomerProductList':
                return {mutate: mockCreateCustomerProductList}
            case 'createCustomerProductListItem':
                return {mutateAsync: mockCreateCustomerProductListItem}
            case 'deleteCustomerProductListItem':
                return {mutateAsync: mockDeleteCustomerProductListItem}
            default:
                return {mutate: jest.fn(), mutateAsync: jest.fn()}
        }
    }),
    useCustomerId: jest.fn(() => 'test-customer-id')
}))

jest.mock('react-intl', () => ({
    useIntl: () => ({
        formatMessage: mockFormatMessage
    })
}))

jest.mock('./use-toast', () => jest.fn(() => mockToast))
jest.mock('./use-navigation', () => jest.fn(() => mockNavigate))

const mockWishlist = {
    id: 'wishlist-123',
    type: 'wish_list',
    customerProductListItems: [
        {id: 'item-1', productId: 'product-1'},
        {id: 'item-2', productId: 'product-2'}
    ]
}

const mockProductLists = {
    data: [mockWishlist],
    total: 1
}

const mockProduct = {
    id: 'product-3',
    productId: 'product-3'
}

const mockVariant = {
    productId: 'variant-product-id'
}

describe('useWishList', () => {
    const {useCustomerProductLists} = require('@salesforce/commerce-sdk-react')

    beforeEach(() => {
        jest.clearAllMocks()
        useCustomerProductLists.mockReturnValue({
            data: mockProductLists,
            isSuccess: true,
            isPending: false,
            error: null
        })
    })

    const renderHookWithProviders = (props = {}) => {
        return renderHook(() => useWishList(props), {
            wrapper: ({children}) => renderWithProviders(<div>{children}</div>).container
        })
    }

    describe('Basic functionality', () => {
        test('returns wishlist data and operations', () => {
            const {result} = renderHookWithProviders()

            expect(result.current.data).toEqual(mockWishlist)
            expect(typeof result.current.isItemInWishlist).toBe('function')
            expect(typeof result.current.addToWishlist).toBe('function')
            expect(typeof result.current.removeFromWishlist).toBe('function')
            expect(typeof result.current.toggleWishlist).toBe('function')
        })

        test('handles empty product lists', () => {
            useCustomerProductLists.mockReturnValue({
                data: {data: [], total: 0},
                isSuccess: true,
                isPending: false,
                error: null
            })

            const {result} = renderHookWithProviders()

            expect(result.current.data).toBeUndefined()
        })
    })

    describe('isItemInWishlist', () => {
        test('returns true for items in wishlist', () => {
            const {result} = renderHookWithProviders()

            const isInWishlist = result.current.isItemInWishlist({productId: 'product-1'})
            expect(isInWishlist).toBe(true)
        })

        test('returns false for items not in wishlist', () => {
            const {result} = renderHookWithProviders()

            const isInWishlist = result.current.isItemInWishlist({productId: 'product-999'})
            expect(isInWishlist).toBe(false)
        })

        test('handles variant productId correctly', () => {
            const {result} = renderHookWithProviders()

            const isInWishlist = result.current.isItemInWishlist(
                {id: 'product-999'},
                {productId: 'product-1'}
            )
            expect(isInWishlist).toBe(true)
        })

        test('returns false when no wishlist or product', () => {
            useCustomerProductLists.mockReturnValue({
                data: null,
                isSuccess: true,
                isPending: false,
                error: null
            })

            const {result} = renderHookWithProviders()

            expect(result.current.isItemInWishlist(null)).toBe(false)
            expect(result.current.isItemInWishlist(mockProduct)).toBe(false)
        })
    })

    describe('addToWishlist', () => {
        test('successfully adds new item to wishlist', async () => {
            mockCreateCustomerProductListItem.mockResolvedValue({})
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.addToWishlist(mockProduct)
            })

            expect(mockCreateCustomerProductListItem).toHaveBeenCalledWith({
                parameters: {
                    listId: 'wishlist-123',
                    customerId: 'test-customer-id'
                },
                body: {
                    quantity: 1,
                    productId: 'product-3',
                    public: false,
                    priority: 1,
                    type: 'product'
                }
            })

            expect(mockToast).toHaveBeenCalledWith({
                title: expect.any(String),
                type: 'success',
                action: expect.any(Object)
            })
        })

        test('shows already in wishlist message for existing items', async () => {
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.addToWishlist({productId: 'product-1'})
            })

            expect(mockCreateCustomerProductListItem).not.toHaveBeenCalled()
            expect(mockToast).toHaveBeenCalledWith({
                title: expect.any(String),
                type: 'info',
                action: expect.any(Object)
            })
        })

        test('handles variant productId correctly', async () => {
            mockCreateCustomerProductListItem.mockResolvedValue({})
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.addToWishlist(mockProduct, mockVariant, {quantity: 2})
            })

            expect(mockCreateCustomerProductListItem).toHaveBeenCalledWith({
                parameters: {
                    listId: 'wishlist-123',
                    customerId: 'test-customer-id'
                },
                body: {
                    quantity: 2,
                    productId: 'variant-product-id',
                    public: false,
                    priority: 1,
                    type: 'product'
                }
            })
        })

        test('handles error with custom showError function', async () => {
            const mockShowError = jest.fn()
            mockCreateCustomerProductListItem.mockRejectedValue(new Error('API Error'))
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.addToWishlist(mockProduct, null, {showError: mockShowError})
            })

            expect(mockShowError).toHaveBeenCalled()
            expect(mockToast).not.toHaveBeenCalled()
        })

        test('handles error with default error handling', async () => {
            mockCreateCustomerProductListItem.mockRejectedValue(new Error('API Error'))
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.addToWishlist(mockProduct)
            })

            expect(mockToast).toHaveBeenCalledWith({
                title: expect.any(String),
                type: 'error'
            })
        })

        test('returns early when no customer or wishlist', async () => {
            useCustomerProductLists.mockReturnValue({
                data: null,
                isSuccess: true,
                isPending: false,
                error: null
            })

            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.addToWishlist(mockProduct)
            })

            expect(mockCreateCustomerProductListItem).not.toHaveBeenCalled()
        })
    })

    describe('removeFromWishlist', () => {
        test('successfully removes item from wishlist', async () => {
            mockDeleteCustomerProductListItem.mockResolvedValue({})
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.removeFromWishlist({productId: 'product-1'})
            })

            expect(mockDeleteCustomerProductListItem).toHaveBeenCalledWith({
                body: {},
                parameters: {
                    customerId: 'test-customer-id',
                    listId: 'wishlist-123',
                    itemId: 'item-1'
                }
            })

            expect(mockToast).toHaveBeenCalledWith({
                title: expect.any(String),
                type: 'success'
            })
        })

        test('returns early when item not found', async () => {
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.removeFromWishlist({productId: 'product-999'})
            })

            expect(mockDeleteCustomerProductListItem).not.toHaveBeenCalled()
        })

        test('handles error with custom showError function', async () => {
            const mockShowError = jest.fn()
            mockDeleteCustomerProductListItem.mockRejectedValue(new Error('API Error'))
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.removeFromWishlist(
                    {productId: 'product-1'},
                    null,
                    {showError: mockShowError}
                )
            })

            expect(mockShowError).toHaveBeenCalled()
        })
    })

    describe('toggleWishlist', () => {
        test('adds item when not in wishlist', async () => {
            mockCreateCustomerProductListItem.mockResolvedValue({})
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.toggleWishlist(mockProduct)
            })

            expect(mockCreateCustomerProductListItem).toHaveBeenCalled()
        })

        test('removes item when in wishlist', async () => {
            mockDeleteCustomerProductListItem.mockResolvedValue({})
            const {result} = renderHookWithProviders()

            await act(async () => {
                await result.current.toggleWishlist({productId: 'product-1'})
            })

            expect(mockDeleteCustomerProductListItem).toHaveBeenCalled()
        })
    })

    describe('Wishlist creation', () => {
        test('creates wishlist when none exists', () => {
            useCustomerProductLists.mockReturnValue({
                data: {data: [], total: 0},
                isSuccess: true,
                isPending: false,
                error: null
            })

            renderHookWithProviders()

            expect(mockCreateCustomerProductList).toHaveBeenCalledWith({
                parameters: {customerId: 'test-customer-id'},
                body: {type: 'wish_list'}
            })
        })

        test('does not create wishlist when one already exists', () => {
            renderHookWithProviders()

            expect(mockCreateCustomerProductList).not.toHaveBeenCalled()
        })
    })

    describe('listId parameter', () => {
        test('returns specific wishlist when listId provided', () => {
            const secondWishlist = {
                id: 'wishlist-456',
                type: 'wish_list',
                customerProductListItems: []
            }

            useCustomerProductLists.mockReturnValue({
                data: {data: [mockWishlist, secondWishlist], total: 2},
                isSuccess: true,
                isPending: false,
                error: null
            })

            const {result} = renderHookWithProviders({listId: 'wishlist-456'})

            expect(result.current.data).toEqual(secondWishlist)
        })

        test('returns first wishlist when no listId provided', () => {
            const {result} = renderHookWithProviders()

            expect(result.current.data).toEqual(mockWishlist)
        })
    })
})