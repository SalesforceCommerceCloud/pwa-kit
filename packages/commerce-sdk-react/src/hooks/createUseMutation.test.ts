/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook} from '@testing-library/react'
import useCommerceApi from './useCommerceApi'
import * as useMutationModule from './useMutation'
import {createUseMutation, MethodsOf} from './createUseMutation'
import {ApiClients} from './types'

// Mock dependencies
jest.mock('./useCommerceApi')
jest.mock('./useMutation')

describe('createUseMutation', () => {
    // Define the ShopperBasketsMutation type
    type ShopperBasketsMutation = MethodsOf<ApiClients['shopperBaskets']>

    // Mock API client and method
    const mockApiMethod = jest.fn().mockResolvedValue({data: 'test-data'})
    const mockClient = {
        createBasket: mockApiMethod,
        constructor: {
            paramKeys: {
                createBasket: ['param1', 'param2']
            }
        },
        clientConfig: {
            parameters: {},
            headers: {}
        }
    }

    // Mock useCommerceApi hook
    const mockUseCommerceApi = useCommerceApi as jest.Mock
    mockUseCommerceApi.mockReturnValue({
        shopperBaskets: mockClient
    })

    // Mock useMutation hook
    const mockUseMutation = jest.fn()
    jest.spyOn(useMutationModule, 'useMutation').mockImplementation(mockUseMutation)

    // Mock cache update getter
    const mockCacheUpdateGetter = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseMutation.mockReturnValue({
            data: {data: 'test-data'},
            isLoading: false,
            error: null,
            mutate: jest.fn(),
            mutateAsync: jest.fn()
        })
    })

    it('calls useMutation with the correct arguments', () => {
        // Create the mutation hook
        const useTestMutation = createUseMutation<'shopperBaskets', ShopperBasketsMutation>({
            clientKey: 'shopperBaskets',
            getCacheUpdates: mockCacheUpdateGetter
        })

        // Use the hook
        renderHook(() => useTestMutation('createBasket'))

        // Verify useMutation was called with correct parameters
        expect(mockUseMutation).toHaveBeenCalledTimes(1)

        const useMutationCallArgs = mockUseMutation.mock.calls[0][0]

        // Verify client is correctly passed
        expect(useMutationCallArgs.client).toBe(mockClient)

        // Verify method is correctly bound to the client
        expect(useMutationCallArgs.method).toBeDefined()
        expect(typeof useMutationCallArgs.method).toBe('function')

        // Verify getCacheUpdates function is passed
        expect(useMutationCallArgs.getCacheUpdates).toBeDefined()
        expect(typeof useMutationCallArgs.getCacheUpdates).toBe('function')
    })

    it('correctly processes cache updates', () => {
        // Create a mock cache update getter that returns a function
        const mockCacheUpdateFn = jest.fn().mockReturnValue({
            update: ['test-update'],
            invalidate: ['test-invalidate'],
            remove: ['test-remove'],
            clear: true
        })
        mockCacheUpdateGetter.mockReturnValue(mockCacheUpdateFn)

        // Create the mutation hook
        const useTestMutation = createUseMutation<'shopperBaskets', ShopperBasketsMutation>({
            clientKey: 'shopperBaskets',
            getCacheUpdates: mockCacheUpdateGetter
        })

        // Use the hook
        renderHook(() => useTestMutation('createBasket'))

        // Extract the getCacheUpdates function passed to useMutation
        const getCacheUpdatesFn = mockUseMutation.mock.calls[0][0].getCacheUpdates

        // Test with valid update function
        const customerId = 'test-customer'
        const options = {param: 'value'}
        const data = {result: 'success'}

        const result = getCacheUpdatesFn(customerId, options, data)

        // Verify mockCacheUpdateGetter was called with the mutation
        expect(mockCacheUpdateGetter).toHaveBeenCalledWith('createBasket')

        // Verify the update function was called with the right params
        expect(mockCacheUpdateFn).toHaveBeenCalledWith(customerId, options, data)

        // Verify the result matches what the update function returned
        expect(result).toEqual({
            update: ['test-update'],
            invalidate: ['test-invalidate'],
            remove: ['test-remove'],
            clear: true
        })
    })

    it('returns default cache updates when no update function is provided', () => {
        // Mock getCacheUpdates to return undefined (no cache updates for this mutation)
        mockCacheUpdateGetter.mockReturnValue(undefined)

        // Create the mutation hook
        const useTestMutation = createUseMutation<'shopperBaskets', ShopperBasketsMutation>({
            clientKey: 'shopperBaskets',
            getCacheUpdates: mockCacheUpdateGetter
        })

        // Use the hook
        renderHook(() => useTestMutation('createBasket'))

        // Extract the getCacheUpdates function passed to useMutation
        const getCacheUpdatesFn = mockUseMutation.mock.calls[0][0].getCacheUpdates

        // Test with undefined update function
        const result = getCacheUpdatesFn('customer-id', {}, {})

        // Verify default updates are returned
        expect(result).toEqual({
            update: [],
            invalidate: [],
            remove: [],
            clear: false
        })
    })
})
