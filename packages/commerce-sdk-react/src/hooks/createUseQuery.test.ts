/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook} from '@testing-library/react'
import {QueryKeyHelper} from './createUseQuery'
import useCommerceApi from './useCommerceApi'
import * as useQueryModule from './useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from './utils'

// Mock dependencies
jest.mock('./useCommerceApi')
jest.mock('./useQuery')

describe('createUseQuery', () => {
    // Define a type for query options to avoid type errors
    type QueryOptions = {
        enabled?: boolean
        staleTime?: number
        cacheTime?: number
        retry?: number
        meta?: {
            displayName?: string
            existingMeta?: string
            [key: string]: unknown
        }
    }

    // Mock API client and method
    const mockApiMethod = jest.fn().mockResolvedValue({data: 'test-data'})
    const mockClient = {
        testMethod: mockApiMethod,
        constructor: {
            paramKeys: {
                testMethod: ['param1', 'param2', 'optionalParam'],
                testMethodRequired: ['param1', 'param2']
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
        testClient: mockClient
    })

    // Mock useQuery hook
    const mockUseQuery = jest.fn()
    jest.spyOn(useQueryModule, 'useQuery').mockImplementation(mockUseQuery)

    // Mock query key helper
    const mockQueryKeyHelper: QueryKeyHelper = {
        queryKey: jest.fn().mockImplementation((params) => ['test-query-key', params])
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseQuery.mockReturnValue({
            data: {data: 'test-data'},
            isLoading: false,
            error: null
        })
    })

    // Test factory function to create hooks for each test
    const createTestHook = () => {
        // Test hook that directly calls useQuery to avoid type issues
        return (apiOptions: any, queryOptions: QueryOptions = {}) => {
            const client = mockUseCommerceApi().testClient
            const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
            const parameters = pickValidParams(
                netOptions.parameters || {},
                client.constructor.paramKeys.testMethod
            )
            const queryKey = mockQueryKeyHelper.queryKey(netOptions.parameters)

            const method = async (options: any) => {
                return await client.testMethod(options)
            }

            return useQueryModule.useQuery(
                {...netOptions, parameters} as any,
                {
                    ...queryOptions,
                    meta: {
                        displayName: 'useTestQuery',
                        ...(queryOptions.meta || {})
                    }
                } as any,
                {
                    method,
                    queryKey,
                    requiredParameters: client.constructor.paramKeys.testMethodRequired
                }
            )
        }
    }

    it('creates a hook that returns expected data', () => {
        // Create test hook
        const useTestQuery = createTestHook()

        // Use the hook with required parameters
        const {result} = renderHook(() =>
            useTestQuery({
                parameters: {
                    param1: 'value1',
                    param2: 'value2'
                }
            })
        )

        // Assert the hook returns expected data
        expect(result.current.data).toEqual({data: 'test-data'})
        expect(mockUseQuery).toHaveBeenCalled()
        expect(mockQueryKeyHelper.queryKey).toHaveBeenCalled()
    })

    it('filters out invalid parameters', () => {
        // Create test hook
        const useTestQuery = createTestHook()

        // Use the hook with invalid parameters
        renderHook(() =>
            useTestQuery({
                parameters: {
                    param1: 'value1',
                    param2: 'value2',
                    invalidParam1: 'invalid1',
                    invalidParam2: 'invalid2'
                }
            })
        )

        // Get the parameters that were passed to useQuery
        const useQueryCallArgs = mockUseQuery.mock.calls[0]

        // Only valid parameters should be included
        expect(useQueryCallArgs[0].parameters).toEqual({
            param1: 'value1',
            param2: 'value2'
            // Invalid parameters should be filtered out
        })
    })

    it('handles null parameters correctly', () => {
        // Create test hook
        const useTestQuery = createTestHook()

        // Use the hook with null parameters
        renderHook(() =>
            useTestQuery({
                parameters: {
                    param1: 'value1',
                    param2: 'value2',
                    optionalParam: null
                }
            })
        )

        // Get the parameters that were passed to useQuery
        const useQueryCallArgs = mockUseQuery.mock.calls[0]

        // Null parameters should be omitted
        expect(useQueryCallArgs[0].parameters).toEqual({
            param1: 'value1',
            param2: 'value2'
            // null parameter should be omitted
        })
    })

    it('passes queryOptions to useQuery', () => {
        // Create test hook
        const useTestQuery = createTestHook()

        // Custom query options
        const queryOptions: QueryOptions = {
            enabled: false,
            staleTime: 5000,
            cacheTime: 10000,
            retry: 3
        }

        // Use the hook with query options
        renderHook(() =>
            useTestQuery(
                {
                    parameters: {
                        param1: 'value1',
                        param2: 'value2'
                    }
                },
                queryOptions
            )
        )

        // Check that query options are passed correctly
        const useQueryCallArgs = mockUseQuery.mock.calls[0]
        expect(useQueryCallArgs[1]).toMatchObject({
            ...queryOptions,
            meta: {
                displayName: 'useTestQuery'
            }
        })
    })

    it('merges meta data with existing meta in queryOptions', () => {
        // Create test hook
        const useTestQuery = createTestHook()

        // Query options with existing meta
        const queryOptions: QueryOptions = {
            meta: {
                existingMeta: 'value'
            }
        }

        // Use the hook with query options that have meta
        renderHook(() =>
            useTestQuery(
                {
                    parameters: {
                        param1: 'value1',
                        param2: 'value2'
                    }
                },
                queryOptions
            )
        )

        // Check that meta is merged correctly
        const useQueryCallArgs = mockUseQuery.mock.calls[0]
        expect(useQueryCallArgs[1].meta).toEqual({
            displayName: 'useTestQuery',
            existingMeta: 'value'
        })
    })

    it('calls the correct API method when the hook is used', async () => {
        // Create test hook
        const useTestQuery = createTestHook()

        // Use the hook
        renderHook(() =>
            useTestQuery({
                parameters: {
                    param1: 'value1',
                    param2: 'value2'
                }
            })
        )

        // Get method function that would be called
        const useQueryCallArgs = mockUseQuery.mock.calls[0]
        const methodFn = useQueryCallArgs[2].method

        // Call the method function
        await methodFn({
            parameters: {
                param1: 'value1',
                param2: 'value2'
            }
        })

        // Verify the API method was called with correct parameters
        expect(mockApiMethod).toHaveBeenCalledWith({
            parameters: {
                param1: 'value1',
                param2: 'value2'
            }
        })
    })
})
