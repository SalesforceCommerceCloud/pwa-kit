/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useCleanupTemporaryBaskets} from '@salesforce/retail-react-app/app/hooks/use-cleanup-temporary-baskets'
import {
    useCustomerId,
    useCustomerBaskets,
    useShopperBasketsV2Mutation as useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

const MOCK_USE_QUERY_RESULT = {
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isIdle: false,
    isLoading: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    status: 'success',
    refetch: jest.fn(),
    remove: jest.fn()
}

const mockDeleteBasket = jest.fn()
const mockRefetch = jest.fn()

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useCustomerId: jest.fn(),
        useCustomerBaskets: jest.fn(),
        useShopperBasketsV2Mutation: jest.fn()
    }
})

jest.mock('@salesforce/retail-react-app/app/utils/utils', () => ({
    isServer: false
}))

jest.mock('@salesforce/retail-react-app/app/utils/logger-instance', () => ({
    error: jest.fn()
}))

describe('useCleanupTemporaryBaskets', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockDeleteBasket.mockResolvedValue({})
        mockRefetch.mockResolvedValue({})
        useCustomerId.mockReturnValue('test-customer-id')
        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: []
            },
            refetch: mockRefetch
        })
        useShopperBasketsMutation.mockReturnValue({
            mutateAsync: mockDeleteBasket
        })
    })

    test('returns cleanup function', () => {
        const {result} = renderHook(() => useCleanupTemporaryBaskets())
        expect(typeof result.current).toBe('function')
    })

    test('cleans up temporary baskets when they exist', async () => {
        const temporaryBaskets = [
            {basketId: 'temp-1', temporaryBasket: true},
            {basketId: 'temp-2', temporaryBasket: true}
        ]
        const regularBaskets = [{basketId: 'regular-1', temporaryBasket: false}]

        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: [...temporaryBaskets, ...regularBaskets]
            },
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).toHaveBeenCalledTimes(2)
        expect(mockDeleteBasket).toHaveBeenCalledWith({
            parameters: {basketId: 'temp-1'}
        })
        expect(mockDeleteBasket).toHaveBeenCalledWith({
            parameters: {basketId: 'temp-2'}
        })
        expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    test('does not delete regular baskets', async () => {
        const regularBaskets = [
            {basketId: 'regular-1', temporaryBasket: false},
            {basketId: 'regular-2', temporaryBasket: false}
        ]

        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: regularBaskets
            },
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).not.toHaveBeenCalled()
        expect(mockRefetch).not.toHaveBeenCalled()
    })

    test('does nothing when no customerId', async () => {
        useCustomerId.mockReturnValue(null)

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).not.toHaveBeenCalled()
        expect(mockRefetch).not.toHaveBeenCalled()
    })

    test('does nothing when no baskets', async () => {
        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: []
            },
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).not.toHaveBeenCalled()
        expect(mockRefetch).not.toHaveBeenCalled()
    })

    test('does nothing when basketsData is undefined', async () => {
        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: undefined,
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).not.toHaveBeenCalled()
        expect(mockRefetch).not.toHaveBeenCalled()
    })

    test('handles 404 errors silently', async () => {
        const error404 = new Error('Not Found')
        error404.response = {status: 404}
        mockDeleteBasket.mockRejectedValueOnce(error404)

        const temporaryBaskets = [{basketId: 'temp-1', temporaryBasket: true}]

        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: temporaryBaskets
            },
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).toHaveBeenCalledTimes(1)
        expect(logger.error).not.toHaveBeenCalled()
        expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    test('logs non-404 errors', async () => {
        const error500 = new Error('Server Error')
        error500.response = {status: 500}
        mockDeleteBasket.mockRejectedValueOnce(error500)

        const temporaryBaskets = [{basketId: 'temp-1', temporaryBasket: true}]

        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: temporaryBaskets
            },
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).toHaveBeenCalledTimes(1)
        expect(logger.error).toHaveBeenCalledWith('Error deleting temporary basket temp-1:', {
            namespace: 'useCleanupTemporaryBaskets'
        })
        expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    test('handles errors without response status', async () => {
        const error = new Error('Network Error')
        mockDeleteBasket.mockRejectedValueOnce(error)

        const temporaryBaskets = [{basketId: 'temp-1', temporaryBasket: true}]

        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: temporaryBaskets
            },
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).toHaveBeenCalledTimes(1)
        expect(logger.error).toHaveBeenCalledWith('Error deleting temporary basket temp-1:', {
            namespace: 'useCleanupTemporaryBaskets'
        })
        expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    test('deletes multiple temporary baskets in parallel', async () => {
        const temporaryBaskets = [
            {basketId: 'temp-1', temporaryBasket: true},
            {basketId: 'temp-2', temporaryBasket: true},
            {basketId: 'temp-3', temporaryBasket: true}
        ]

        useCustomerBaskets.mockReturnValue({
            ...MOCK_USE_QUERY_RESULT,
            data: {
                baskets: temporaryBaskets
            },
            refetch: mockRefetch
        })

        const {result} = renderHook(() => useCleanupTemporaryBaskets())

        await result.current()

        expect(mockDeleteBasket).toHaveBeenCalledTimes(3)
        expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
})
