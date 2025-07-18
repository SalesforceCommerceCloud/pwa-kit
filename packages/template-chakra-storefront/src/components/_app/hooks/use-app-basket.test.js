/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppBasket} from './use-app-basket'

// Mock dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn()
}))

const mockUpdateBasket = {
    mutate: jest.fn(),
    isPending: false
}

const mockUpdateCustomerForBasket = {
    mutate: jest.fn(),
    isPending: false
}

const mockBasket = {
    basketId: 'test-basket',
    currency: 'USD',
    customerInfo: {
        email: 'old@example.com'
    }
}

const mockCustomer = {
    isRegistered: true,
    email: 'new@example.com'
}

describe('useAppBasket', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Setup fresh mocks for each test - recreate mock objects to avoid cross-test contamination
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')

        // Reset and setup default mocks
        useShopperBasketsMutation.mockImplementation((operation) => {
            if (operation === 'updateBasket') {
                return {
                    mutate: jest.fn(),
                    isPending: false
                }
            }
            if (operation === 'updateCustomerForBasket') {
                return {
                    mutate: jest.fn(),
                    isPending: false
                }
            }
            return {
                mutate: jest.fn(),
                isPending: false
            }
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('returns basket mutation functions and loading states', () => {
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(mockUpdateBasket)
            .mockReturnValueOnce(mockUpdateCustomerForBasket)

        const {result} = renderHook(() => useAppBasket(mockBasket, mockCustomer, 'USD'))

        expect(result.current.updateBasket).toBe(mockUpdateBasket)
        expect(result.current.updateCustomerForBasket).toBe(mockUpdateCustomerForBasket)
        expect(result.current.isUpdatingBasket).toBe(false)
        expect(result.current.isUpdatingCustomer).toBe(false)
    })

    test('calls useShopperBasketsMutation with correct parameters', () => {
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(mockUpdateBasket)
            .mockReturnValueOnce(mockUpdateCustomerForBasket)

        renderHook(() => useAppBasket(mockBasket, mockCustomer, 'USD'))

        expect(useShopperBasketsMutation).toHaveBeenCalledWith('updateBasket')
        expect(useShopperBasketsMutation).toHaveBeenCalledWith('updateCustomerForBasket')
    })

    test('updates basket currency when it differs from current currency', () => {
        const basketWithDifferentCurrency = {
            ...mockBasket,
            basketId: 'test-basket',
            currency: 'EUR'
        }

        // Set up spy to track the mutate call
        const mutateSpy = jest.fn()
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation.mockImplementation((operation) => {
            if (operation === 'updateBasket') {
                return {mutate: mutateSpy, isPending: false}
            }
            return {mutate: jest.fn(), isPending: false}
        })

        renderHook(() => useAppBasket(basketWithDifferentCurrency, mockCustomer, 'USD'))

        expect(mutateSpy).toHaveBeenCalledWith({
            parameters: {basketId: 'test-basket'},
            body: {currency: 'USD'}
        })
    })

    test('updates customer email when it differs from basket customer email', () => {
        const basketWithDifferentEmail = {
            ...mockBasket,
            basketId: 'test-basket',
            customerInfo: {
                email: 'old@example.com'
            }
        }

        const customerWithNewEmail = {
            ...mockCustomer,
            isRegistered: true,
            email: 'new@example.com'
        }

        // Set up spy to track the mutate call
        const mutateSpy = jest.fn()
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation.mockImplementation((operation) => {
            if (operation === 'updateCustomerForBasket') {
                return {mutate: mutateSpy, isPending: false}
            }
            return {mutate: jest.fn(), isPending: false}
        })

        renderHook(() => useAppBasket(basketWithDifferentEmail, customerWithNewEmail, 'USD'))

        expect(mutateSpy).toHaveBeenCalledWith({
            parameters: {basketId: 'test-basket'},
            body: {email: 'new@example.com'}
        })
    })

    test('handles null basket gracefully', () => {
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(mockUpdateBasket)
            .mockReturnValueOnce(mockUpdateCustomerForBasket)

        const {result} = renderHook(() => useAppBasket(null, mockCustomer, 'USD'))

        expect(result.current.updateBasket).toBe(mockUpdateBasket)
        expect(result.current.updateCustomerForBasket).toBe(mockUpdateCustomerForBasket)
        expect(mockUpdateBasket.mutate).not.toHaveBeenCalled()
        expect(mockUpdateCustomerForBasket.mutate).not.toHaveBeenCalled()
    })

    test('handles null customer gracefully', () => {
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(mockUpdateBasket)
            .mockReturnValueOnce(mockUpdateCustomerForBasket)

        const {result} = renderHook(() => useAppBasket(mockBasket, null, 'USD'))

        expect(result.current.updateBasket).toBe(mockUpdateBasket)
        expect(result.current.updateCustomerForBasket).toBe(mockUpdateCustomerForBasket)
        expect(mockUpdateCustomerForBasket.mutate).not.toHaveBeenCalled()
    })

    test('returns correct loading states when mutations are pending', () => {
        // Clear previous calls and set up mocks for this test
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')

        // Mock the hook to return pending states
        useShopperBasketsMutation.mockImplementation((operation) => {
            if (operation === 'updateBasket') {
                return {
                    mutate: jest.fn(),
                    isPending: true
                }
            }
            if (operation === 'updateCustomerForBasket') {
                return {
                    mutate: jest.fn(),
                    isPending: true
                }
            }
            return {
                mutate: jest.fn(),
                isPending: false
            }
        })

        const {result} = renderHook(() => useAppBasket(mockBasket, mockCustomer, 'USD'))

        expect(result.current.isUpdatingBasket).toBe(true)
        expect(result.current.isUpdatingCustomer).toBe(true)
    })
})
