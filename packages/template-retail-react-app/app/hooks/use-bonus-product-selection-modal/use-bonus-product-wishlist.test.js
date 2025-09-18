/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {useBonusProductWishlist} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-wishlist'

jest.mock('react-intl', () => ({
    useIntl: () => ({
        formatMessage: jest.fn((msg) => {
            if (msg.id === 'global.info.added_to_wishlist') {
                return 'bonus_product_modal.added_to_wishlist'
            }
            if (msg.id === 'global.info.removed_from_wishlist') {
                return 'bonus_product_modal.removed_from_wishlist'
            }
            if (msg.id === 'global.error.something_went_wrong') {
                return 'global.error.something_went_wrong'
            }
            if (msg.id === 'global.link.added_to_wishlist.view_wishlist') {
                return 'View'
            }
            return msg.defaultMessage || msg.id
        })
    }),
    defineMessage: jest.fn((msg) => msg)
}))

jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => ({
    // eslint-disable-next-line react/prop-types
    Button: ({children, onClick}) => <button onClick={onClick}>{children}</button>
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperCustomersMutation: jest.fn(),
    useCustomerId: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-wish-list', () => ({
    useWishList: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: jest.fn()
}))

import {useShopperCustomersMutation, useCustomerId} from '@salesforce/commerce-sdk-react'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

describe('useBonusProductWishlist', () => {
    const mockCreateMutation = {
        mutateAsync: jest.fn(),
        isLoading: false
    }
    const mockDeleteMutation = {
        mutateAsync: jest.fn(),
        isLoading: false
    }
    const mockToast = jest.fn()
    const mockNavigate = jest.fn()
    const mockWishlist = {
        id: 'wishlist-1',
        customerProductListItems: [
            {id: 'item-1', productId: 'product-1'},
            {id: 'item-2', productId: 'product-2'}
        ]
    }

    beforeEach(() => {
        jest.clearAllMocks()
        useCustomerId.mockReturnValue('customer-1')
        useWishList.mockReturnValue({data: mockWishlist})
        useShopperCustomersMutation.mockImplementation((type) => {
            if (type === 'createCustomerProductListItem') return mockCreateMutation
            if (type === 'deleteCustomerProductListItem') return mockDeleteMutation
            return {mutateAsync: jest.fn(), isLoading: false}
        })
        useToast.mockReturnValue(mockToast)
        useNavigation.mockReturnValue(mockNavigate)
    })

    test('returns wishlist data and functions', () => {
        const {result} = renderHook(() => useBonusProductWishlist())

        expect(result.current.wishlist).toBe(mockWishlist)
        expect(typeof result.current.handleAddToWishlist).toBe('function')
        expect(typeof result.current.handleRemoveFromWishlist).toBe('function')
        expect(typeof result.current.handleWishlistToggle).toBe('function')
        expect(typeof result.current.isProductInWishlist).toBe('function')
        expect(result.current.isLoading).toBe(false)
    })

    test('isProductInWishlist returns true for products in wishlist', () => {
        const {result} = renderHook(() => useBonusProductWishlist())

        expect(result.current.isProductInWishlist('product-1')).toBe(true)
        expect(result.current.isProductInWishlist('product-2')).toBe(true)
        expect(result.current.isProductInWishlist('product-3')).toBe(false)
    })

    test('isProductInWishlist returns false when no wishlist', () => {
        useWishList.mockReturnValue({data: null})
        const {result} = renderHook(() => useBonusProductWishlist())

        expect(result.current.isProductInWishlist('product-1')).toBe(false)
    })

    test('handleAddToWishlist adds product to wishlist', async () => {
        const {result} = renderHook(() => useBonusProductWishlist())
        const testProduct = {productId: 'product-3'}

        mockCreateMutation.mutateAsync.mockResolvedValue({})

        await act(async () => {
            await result.current.handleAddToWishlist(testProduct)
        })

        expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
            parameters: {
                listId: 'wishlist-1',
                customerId: 'customer-1'
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
            title: 'bonus_product_modal.added_to_wishlist',
            status: 'success',
            action: expect.any(Object)
        })
    })

    test('handleAddToWishlist shows error on failure', async () => {
        const {result} = renderHook(() => useBonusProductWishlist())
        const testProduct = {productId: 'product-3'}

        mockCreateMutation.mutateAsync.mockRejectedValue(new Error('API Error'))

        await act(async () => {
            await result.current.handleAddToWishlist(testProduct)
        })

        expect(mockToast).toHaveBeenCalledWith({
            title: 'global.error.something_went_wrong',
            status: 'error'
        })
    })

    test('handleAddToWishlist does nothing if no wishlist or customer', async () => {
        useWishList.mockReturnValue({data: null})
        const {result} = renderHook(() => useBonusProductWishlist())
        const testProduct = {productId: 'product-3'}

        await act(async () => {
            await result.current.handleAddToWishlist(testProduct)
        })

        expect(mockCreateMutation.mutateAsync).not.toHaveBeenCalled()
    })

    test('handleRemoveFromWishlist removes product from wishlist', async () => {
        const {result} = renderHook(() => useBonusProductWishlist())
        const testProduct = {productId: 'product-1'}

        mockDeleteMutation.mutateAsync.mockResolvedValue({})

        await act(async () => {
            await result.current.handleRemoveFromWishlist(testProduct)
        })

        expect(mockDeleteMutation.mutateAsync).toHaveBeenCalledWith({
            parameters: {
                customerId: 'customer-1',
                itemId: 'item-1',
                listId: 'wishlist-1'
            }
        })
        expect(mockToast).toHaveBeenCalledWith({
            title: 'bonus_product_modal.removed_from_wishlist',
            status: 'success'
        })
    })

    test('handleRemoveFromWishlist does nothing if product not in wishlist', async () => {
        const {result} = renderHook(() => useBonusProductWishlist())
        const testProduct = {productId: 'product-3'}

        await act(async () => {
            await result.current.handleRemoveFromWishlist(testProduct)
        })

        expect(mockDeleteMutation.mutateAsync).not.toHaveBeenCalled()
    })

    test('handleWishlistToggle adds when shouldAdd is true', async () => {
        const {result} = renderHook(() => useBonusProductWishlist())
        const testProduct = {productId: 'product-3'}

        mockCreateMutation.mutateAsync.mockResolvedValue({})

        await act(async () => {
            await result.current.handleWishlistToggle(testProduct, true)
        })

        expect(mockCreateMutation.mutateAsync).toHaveBeenCalled()
    })

    test('handleWishlistToggle removes when shouldAdd is false', async () => {
        const {result} = renderHook(() => useBonusProductWishlist())
        const testProduct = {productId: 'product-1'}

        mockDeleteMutation.mutateAsync.mockResolvedValue({})

        await act(async () => {
            await result.current.handleWishlistToggle(testProduct, false)
        })

        expect(mockDeleteMutation.mutateAsync).toHaveBeenCalled()
    })

    test('isLoading returns true when mutations are loading', () => {
        mockCreateMutation.isLoading = true
        const {result} = renderHook(() => useBonusProductWishlist())

        expect(result.current.isLoading).toBe(true)
    })
})
