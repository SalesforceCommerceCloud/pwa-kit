/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import {useCartWishlist} from './use-cart-wishlist'
import {useWishList} from '../use-wish-list'

// Get reference to the mocked function
const mockUseWishList = jest.mocked(useWishList)

const mockCustomer = {
    customerId: 'customer-1',
    email: 'test@example.com'
}

// Mock the commerce SDK hooks
const mockCreateCustomerProductListItem = {
    mutateAsync: jest.fn()
}

const mockNavigate = jest.fn()

let storedAction = null
const mockToast = jest.fn().mockImplementation((toastParams) => {
    storedAction = toastParams.action
    return {
        title: toastParams.title,
        type: toastParams.type,
        action: toastParams.action,
        triggerAction: () => {
            if (storedAction && storedAction.props && storedAction.props.onClick) {
                storedAction.props.onClick()
            }
        }
    }
})

jest.mock('@salesforce/commerce-sdk-react', () => ({
    __esModule: true,
    useShopperBasketsMutation: jest.fn(),
    useShopperCustomersMutation: jest.fn(() => mockCreateCustomerProductListItem)
}))

// Mock the toast hook
jest.mock('../use-toast', () => ({
    __esModule: true,
    default: jest.fn(() => {
        return mockToast
    })
}))

// Mock the react-intl hook
jest.mock('react-intl', () => ({
    defineMessages: jest.fn(),
    defineMessage: jest.fn(),
    useIntl: jest.fn(() => ({
        formatMessage: jest.fn((message) => {
            const result = message.defaultMessage || message.id || 'Mocked message'
            return result
        })
    }))
}))

// Mock the navigation hook
jest.mock('../use-navigation', () => ({
    __esModule: true,
    default: jest.fn(() => mockNavigate)
}))

// Mock the wishlist hook
jest.mock('../use-wish-list', () => ({
    __esModule: true,
    useWishList: jest.fn()
}))

// Mock the current customer hook
jest.mock('../use-current-customer', () => ({
    __esModule: true,
    useCurrentCustomer: jest.fn(() => ({
        data: mockCustomer
    }))
}))

// Mock the constants
jest.mock('../../constants', () => ({
    TOAST_ACTION_VIEW_WISHLIST: {
        id: 'toast.action.view_wishlist',
        defaultMessage: 'View Wishlist'
    },
    TOAST_MESSAGE_ADDED_TO_WISHLIST: {
        id: 'toast.message.added_to_wishlist',
        defaultMessage: 'Product added to wishlist'
    },
    TOAST_MESSAGE_ALREADY_IN_WISHLIST: {
        id: 'toast.message.already_in_wishlist',
        defaultMessage: 'Product is already in your wishlist'
    }
}))

describe('useCartWishlist', () => {
    let mockShowError

    const mockWishlist = {
        id: 'wishlist-1',
        customerProductListItems: [
            {
                id: 'wishlist-item-1',
                productId: 'product-1',
                quantity: 1
            },
            {
                id: 'wishlist-item-2',
                productId: 'product-2',
                quantity: 2
            }
        ]
    }

    beforeEach(() => {
        mockShowError = jest.fn()
        // Reset specific mocks without clearing their implementations
        mockCreateCustomerProductListItem.mutateAsync.mockClear()
        mockToast.mockClear()
        mockNavigate.mockClear()

        // Reset mockCustomer to its default state
        // mockCustomer.customerId = 'customer-1'
        // mockCustomer.email = 'test@example.com'

        // Set default mock implementation
        mockUseWishList.mockReturnValue({
            data: mockWishlist
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should add wishlist item to cart successfully', async () => {
        const {result} = renderHook(() => useCartWishlist(mockShowError))

        await act(async () => {
            await result.current.handleAddToWishlist({
                id: 'product-3',
                productId: 'product-3',
                quantity: 1
            })
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).toHaveBeenCalledWith({
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
            title: 'Product added to wishlist',
            type: 'success',
            action: expect.any(Object)
        })
    })

    it('should navigate to wishlist page when toast action is clicked', async () => {
        const {result} = renderHook(() => useCartWishlist(mockShowError))
        await act(async () => {
            await result.current.handleAddToWishlist({
                id: 'product-3',
                productId: 'product-3',
                quantity: 1
            })
        })

        // Get the return value from the toast call
        const toastResult = mockToast.mock.results[0].value

        // Trigger the action button click
        act(() => {
            toastResult.triggerAction()
        })

        expect(mockNavigate).toHaveBeenCalledWith('/account/wishlist')
    })

    it('should navigate to wishlist page when item is already in wishlist and toast action is clicked', async () => {
        const {result} = renderHook(() => useCartWishlist(mockShowError))
        await act(async () => {
            await result.current.handleAddToWishlist({
                id: 'product-1',
                productId: 'product-1',
                quantity: 1
            })
        })

        const toastResult = mockToast.mock.results[0].value
        act(() => {
            toastResult.triggerAction()
        })

        expect(mockNavigate).toHaveBeenCalledWith('/account/wishlist')
    })

    it('should call showError when adding wishlist item fails', async () => {
        mockCreateCustomerProductListItem.mutateAsync.mockRejectedValue(new Error('API Error'))

        const {result} = renderHook(() => useCartWishlist(mockShowError))

        await act(async () => {
            await result.current.handleAddToWishlist({
                id: 'product-3',
                productId: 'product-3',
                quantity: 1
            })
        })

        expect(mockShowError).toHaveBeenCalled()
    })

    it('should handle adding item already in wishlist', async () => {
        const {result} = renderHook(() => useCartWishlist(mockShowError))

        await act(async () => {
            await result.current.handleAddToWishlist({
                id: 'product-1',
                productId: 'product-1',
                quantity: 3
            })
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).not.toHaveBeenCalled()

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Product is already in your wishlist',
            type: 'info',
            action: expect.any(Object)
        })
    })

    it('should return early if customer is not logged in', async () => {
        mockCustomer.customerId = null
        const {result} = renderHook(() => useCartWishlist(mockShowError))
        await act(async () => {
            await result.current.handleAddToWishlist({
                id: 'product-3',
                productId: 'product-3',
                quantity: 1
            })
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).not.toHaveBeenCalled()
        expect(mockToast).not.toHaveBeenCalled()
    })

    it('should return early if wishlist is not found', async () => {
        // Override the mock for this specific test
        mockUseWishList.mockReturnValue({
            data: null
        })

        const {result} = renderHook(() => useCartWishlist(mockShowError))
        await act(async () => {
            await result.current.handleAddToWishlist({
                id: 'product-3',
                productId: 'product-3',
                quantity: 1
            })
        })

        expect(mockCreateCustomerProductListItem.mutateAsync).not.toHaveBeenCalled()
        expect(mockToast).not.toHaveBeenCalled()
    })
})
