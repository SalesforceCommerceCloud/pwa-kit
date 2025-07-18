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
            currency: 'EUR'
        }

        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(mockUpdateBasket)
            .mockReturnValueOnce(mockUpdateCustomerForBasket)

        renderHook(() => useAppBasket(basketWithDifferentCurrency, mockCustomer, 'USD'))

        expect(mockUpdateBasket.mutate).toHaveBeenCalledWith({
            parameters: {basketId: 'test-basket'},
            body: {currency: 'USD'}
        })
    })

    test('updates customer email when it differs from basket customer email', () => {
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(mockUpdateBasket)
            .mockReturnValueOnce(mockUpdateCustomerForBasket)

        renderHook(() => useAppBasket(mockBasket, mockCustomer, 'USD'))

        expect(mockUpdateCustomerForBasket.mutate).toHaveBeenCalledWith({
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
    })

    test('handles null customer gracefully', () => {
        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(mockUpdateBasket)
            .mockReturnValueOnce(mockUpdateCustomerForBasket)

        const {result} = renderHook(() => useAppBasket(mockBasket, null, 'USD'))

        expect(result.current.updateBasket).toBe(mockUpdateBasket)
        expect(result.current.updateCustomerForBasket).toBe(mockUpdateCustomerForBasket)
    })

    test('returns correct loading states when mutations are pending', () => {
        // Create pending state mocks
        const pendingUpdateBasket = {
            ...mockUpdateBasket,
            isPending: true
        }
        const pendingUpdateCustomer = {
            ...mockUpdateCustomerForBasket,
            isPending: true
        }

        const {useShopperBasketsMutation} = require('@salesforce/commerce-sdk-react')
        useShopperBasketsMutation
            .mockReturnValueOnce(pendingUpdateBasket)
            .mockReturnValueOnce(pendingUpdateCustomer)

        const {result} = renderHook(() => useAppBasket(mockBasket, mockCustomer, 'USD'))

        expect(result.current.isUpdatingBasket).toBe(true)
        expect(result.current.isUpdatingCustomer).toBe(true)
    })
})
