/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useIntl} from 'react-intl'
import {
    useCustomerProductLists,
    useShopperCustomersMutation,
    useCustomerId
} from '@salesforce/commerce-sdk-react'
import {useWishList} from './use-wish-list'
import useToast from './use-toast'
import useNavigation from './use-navigation'

// Mock dependencies
jest.mock('react-intl')
jest.mock('@salesforce/commerce-sdk-react')
jest.mock('./use-toast')
jest.mock('./use-navigation')

const mockToast = jest.fn()
const mockNavigate = jest.fn()
const mockFormatMessage = jest.fn(() => 'test message')
const mockCreateCustomerProductList = {mutate: jest.fn(), mutateAsync: jest.fn()}
const mockCreateCustomerProductListItem = {mutate: jest.fn(), mutateAsync: jest.fn()}
const mockDeleteCustomerProductListItem = {mutate: jest.fn(), mutateAsync: jest.fn()}

const mockProductLists = {
    data: [
        {
            id: 'wishlist-1',
            type: 'wish_list',
            customerProductListItems: [
                {id: 'item-1', productId: 'product-1'},
                {id: 'item-2', productId: 'product-2'}
            ]
        }
    ],
    total: 1
}

describe('useWishList', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        useIntl.mockReturnValue({formatMessage: mockFormatMessage})
        useToast.mockReturnValue(mockToast)
        useNavigation.mockReturnValue(mockNavigate)
        useCustomerId.mockReturnValue('customer-123')
        useShopperCustomersMutation.mockImplementation((type) => {
            switch (type) {
                case 'createCustomerProductList':
                    return mockCreateCustomerProductList
                case 'createCustomerProductListItem':
                    return mockCreateCustomerProductListItem
                case 'deleteCustomerProductListItem':
                    return mockDeleteCustomerProductListItem
                default:
                    return {mutate: jest.fn(), mutateAsync: jest.fn()}
            }
        })
        useCustomerProductLists.mockReturnValue({
            data: mockProductLists,
            isSuccess: true,
            isLoading: false,
            error: null
        })
    })

    it('should return wishlist data and utility functions', () => {
        const {result} = renderHook(() => useWishList())

        expect(result.current.data).toBeDefined()
        expect(typeof result.current.isItemInWishlist).toBe('function')
        expect(typeof result.current.addToWishlist).toBe('function')
        expect(typeof result.current.removeFromWishlist).toBe('function')
        expect(typeof result.current.toggleWishlist).toBe('function')
    })

    it('should return the first wishlist when no listId is provided', () => {
        const {result} = renderHook(() => useWishList())

        expect(result.current.data).toEqual(mockProductLists.data[0])
    })

    it('should return specific wishlist when listId is provided', () => {
        const {result} = renderHook(() => useWishList({listId: 'wishlist-1'}))

        expect(result.current.data).toEqual(mockProductLists.data[0])
    })

    it('should check if item is in wishlist correctly', () => {
        const {result} = renderHook(() => useWishList())

        const productInWishlist = {id: 'product-1'}
        const productNotInWishlist = {id: 'product-3'}

        expect(result.current.isItemInWishlist(productInWishlist)).toBe(true)
        expect(result.current.isItemInWishlist(productNotInWishlist)).toBe(false)
    })

    it('should check item in wishlist with variant', () => {
        const {result} = renderHook(() => useWishList())

        const product = {id: 'base-product'}
        const variant = {productId: 'product-1'}

        expect(result.current.isItemInWishlist(product, variant)).toBe(true)
    })

    it('should add item to wishlist successfully', async () => {
        mockCreateCustomerProductListItem.mutateAsync.mockResolvedValue({})

        const {result} = renderHook(() => useWishList())

        const product = {id: 'new-product'}

        await act(async () => {
            await result.current.addToWishlist(product)
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).toHaveBeenCalledWith({
            parameters: {
                listId: 'wishlist-1',
                customerId: 'customer-123'
            },
            body: {
                quantity: 1,
                productId: 'new-product',
                public: false,
                priority: 1,
                type: 'product'
            }
        })
        expect(mockToast).toHaveBeenCalledWith({
            title: 'test message',
            type: 'success',
            action: expect.any(Object)
        })
    })

    it('should show info toast when item already in wishlist', async () => {
        const {result} = renderHook(() => useWishList())

        const product = {id: 'product-1'}

        await act(async () => {
            await result.current.addToWishlist(product)
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).not.toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith({
            title: 'test message',
            type: 'info',
            action: expect.any(Object)
        })
    })

    it('should handle add to wishlist error', async () => {
        mockCreateCustomerProductListItem.mutateAsync.mockRejectedValue(new Error('API Error'))

        const {result} = renderHook(() => useWishList())

        const product = {id: 'new-product'}

        await act(async () => {
            await result.current.addToWishlist(product)
        })

        expect(mockToast).toHaveBeenCalledWith({
            title: 'test message',
            type: 'error'
        })
    })

    it('should remove item from wishlist successfully', async () => {
        mockDeleteCustomerProductListItem.mutateAsync.mockResolvedValue({})

        const {result} = renderHook(() => useWishList())

        const product = {id: 'product-1'}

        await act(async () => {
            await result.current.removeFromWishlist(product)
        })

        expect(mockDeleteCustomerProductListItem.mutateAsync).toHaveBeenCalledWith({
            body: {},
            parameters: {
                customerId: 'customer-123',
                listId: 'wishlist-1',
                itemId: 'item-1'
            }
        })
        expect(mockToast).toHaveBeenCalledWith({
            title: 'test message',
            type: 'success'
        })
    })

    it('should not remove item that is not in wishlist', async () => {
        const {result} = renderHook(() => useWishList())

        const product = {id: 'product-not-in-list'}

        await act(async () => {
            await result.current.removeFromWishlist(product)
        })

        expect(mockDeleteCustomerProductListItem.mutateAsync).not.toHaveBeenCalled()
    })

    it('should handle remove from wishlist error', async () => {
        mockDeleteCustomerProductListItem.mutateAsync.mockRejectedValue(new Error('API Error'))

        const {result} = renderHook(() => useWishList())

        const product = {id: 'product-1'}

        await act(async () => {
            await result.current.removeFromWishlist(product)
        })

        expect(mockToast).toHaveBeenCalledWith({
            title: 'test message',
            type: 'error'
        })
    })

    it('should toggle wishlist - add when not in wishlist', async () => {
        mockCreateCustomerProductListItem.mutateAsync.mockResolvedValue({})

        const {result} = renderHook(() => useWishList())

        const product = {id: 'new-product'}

        await act(async () => {
            await result.current.toggleWishlist(product)
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).toHaveBeenCalled()
    })

    it('should toggle wishlist - remove when in wishlist', async () => {
        mockDeleteCustomerProductListItem.mutateAsync.mockResolvedValue({})

        const {result} = renderHook(() => useWishList())

        const product = {id: 'product-1'}

        await act(async () => {
            await result.current.toggleWishlist(product)
        })

        expect(mockDeleteCustomerProductListItem.mutateAsync).toHaveBeenCalled()
    })

    it('should handle no customerId gracefully', () => {
        useCustomerId.mockReturnValue(null)

        const {result} = renderHook(() => useWishList())

        act(() => {
            result.current.addToWishlist({id: 'product'})
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).not.toHaveBeenCalled()
    })

    it('should handle no wishlist gracefully', () => {
        useCustomerProductLists.mockReturnValue({
            data: null,
            isSuccess: true,
            isLoading: false,
            error: null
        })

        const {result} = renderHook(() => useWishList())

        act(() => {
            result.current.addToWishlist({id: 'product'})
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).not.toHaveBeenCalled()
    })

    it('should create wishlist when no lists exist', () => {
        useCustomerProductLists.mockReturnValue({
            data: {data: [], total: 0},
            isSuccess: true,
            isLoading: false,
            error: null
        })

        renderHook(() => useWishList())

        expect(mockCreateCustomerProductList.mutate).toHaveBeenCalledWith({
            parameters: {customerId: 'customer-123'},
            body: {type: 'wish_list'}
        })
    })

    it('should handle custom quantity in addToWishlist', async () => {
        mockCreateCustomerProductListItem.mutateAsync.mockResolvedValue({})

        const {result} = renderHook(() => useWishList())

        const product = {id: 'new-product'}

        await act(async () => {
            await result.current.addToWishlist(product, null, 3)
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                body: expect.objectContaining({
                    quantity: 3
                })
            })
        )
    })
})
