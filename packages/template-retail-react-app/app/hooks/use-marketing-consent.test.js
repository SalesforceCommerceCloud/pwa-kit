/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useMarketingConsent} from '@salesforce/retail-react-app/../../app/hooks/use-marketing-consent'
import {
    useSubscriptions,
    useShopperConsentsMutation,
    ShopperConsentsMutations
} from '@salesforce/commerce-sdk-react'

// Mock the commerce-sdk-react hooks
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useSubscriptions: jest.fn(),
        useShopperConsentsMutation: jest.fn()
    }
})

const mockSubscriptionsData = {
    data: [
        {
            subscriptionId: 'marketing-email',
            channels: new Set(['email']),
            contactPointValue: 'customer@example.com'
        },
        {
            subscriptionId: 'marketing-sms',
            channels: new Set(['sms']),
            contactPointValue: '+15551234567'
        },
        {
            subscriptionId: 'newsletter',
            channels: new Set(['email', 'push']),
            contactPointValue: 'customer@example.com'
        }
    ]
}

const mockEmptySubscriptionsData = {
    data: []
}

const mockUseQueryResult = {
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: jest.fn()
}

const mockUseMutationResult = {
    mutateAsync: jest.fn(),
    isLoading: false,
    isSuccess: false,
    error: null
}

describe('useMarketingConsent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Default mock implementations
        useSubscriptions.mockReturnValue({
            ...mockUseQueryResult,
            data: mockSubscriptionsData
        })
        useShopperConsentsMutation.mockImplementation(() => {
            return mockUseMutationResult
        })
    })

    describe('Query functionality', () => {
        test('returns subscription data when query succeeds', () => {
            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.data).toEqual(mockSubscriptionsData)
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
        })

        test('returns loading state when query is loading', () => {
            useSubscriptions.mockReturnValue({
                ...mockUseQueryResult,
                data: undefined,
                isLoading: true
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isLoading).toBe(true)
            expect(result.current.data).toBeUndefined()
        })

        test('returns error state when query fails', () => {
            const mockError = new Error('Failed to fetch subscriptions')
            useSubscriptions.mockReturnValue({
                ...mockUseQueryResult,
                error: mockError
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.error).toEqual(mockError)
        })

        test('respects enabled option', () => {
            renderHook(() => useMarketingConsent({enabled: false}))

            expect(useSubscriptions).toHaveBeenCalledWith({parameters: {}}, {enabled: false})
        })

        test('defaults to enabled when no option provided', () => {
            renderHook(() => useMarketingConsent())

            expect(useSubscriptions).toHaveBeenCalledWith({parameters: {}}, {enabled: true})
        })
    })

    describe('Helper functions', () => {
        describe('getSubscriptionStatus', () => {
            test('returns opt_in when subscription has the channel', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const status = result.current.getSubscriptionStatus('marketing-email', 'email')
                expect(status).toBe('opt_in')
            })

            test('returns opt_out when subscription does not have the channel', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const status = result.current.getSubscriptionStatus('marketing-email', 'sms')
                expect(status).toBe('opt_out')
            })

            test('returns null when subscription does not exist', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const status = result.current.getSubscriptionStatus('non-existent', 'email')
                expect(status).toBeNull()
            })

            test('handles subscription with multiple channels', () => {
                const {result} = renderHook(() => useMarketingConsent())

                expect(result.current.getSubscriptionStatus('newsletter', 'email')).toBe('opt_in')
                expect(result.current.getSubscriptionStatus('newsletter', 'push')).toBe('opt_in')
                expect(result.current.getSubscriptionStatus('newsletter', 'sms')).toBe('opt_out')
            })

            test('handles empty subscriptions data', () => {
                useSubscriptions.mockReturnValue({
                    ...mockUseQueryResult,
                    data: mockEmptySubscriptionsData
                })

                const {result} = renderHook(() => useMarketingConsent())

                const status = result.current.getSubscriptionStatus('marketing-email', 'email')
                expect(status).toBeNull()
            })
        })

        describe('hasChannel', () => {
            test('returns true when subscription has the channel', () => {
                const {result} = renderHook(() => useMarketingConsent())

                expect(result.current.hasChannel('marketing-email', 'email')).toBe(true)
            })

            test('returns false when subscription does not have the channel', () => {
                const {result} = renderHook(() => useMarketingConsent())

                expect(result.current.hasChannel('marketing-email', 'sms')).toBe(false)
            })

            test('returns false when subscription does not exist', () => {
                const {result} = renderHook(() => useMarketingConsent())

                expect(result.current.hasChannel('non-existent', 'email')).toBe(false)
            })
        })

        describe('getSubscriptionsByContact', () => {
            test('returns subscriptions for a given contact point value', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions =
                    result.current.getSubscriptionsByContact('customer@example.com')
                expect(subscriptions).toHaveLength(2)
                expect(subscriptions[0].subscriptionId).toBe('marketing-email')
                expect(subscriptions[1].subscriptionId).toBe('newsletter')
            })

            test('returns empty array when no subscriptions match', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions =
                    result.current.getSubscriptionsByContact('nonexistent@example.com')
                expect(subscriptions).toHaveLength(0)
            })
        })
    })

    describe('Update single subscription', () => {
        test('calls updateSubscription mutation with correct parameters', async () => {
            const mockMutateAsync = jest.fn().mockResolvedValue({})
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscription) {
                    return {
                        ...mockUseMutationResult,
                        mutateAsync: mockMutateAsync
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            const subscriptionData = {
                subscriptionId: 'marketing-email',
                channel: 'email',
                status: 'opt_in',
                contactPointValue: 'customer@example.com'
            }

            await result.current.updateSubscription(subscriptionData)

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {},
                body: subscriptionData
            })
        })

        test('returns mutation result on success', async () => {
            const mockResponse = {success: true}
            const mockMutateAsync = jest.fn().mockResolvedValue(mockResponse)
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscription) {
                    return {
                        ...mockUseMutationResult,
                        mutateAsync: mockMutateAsync
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            const response = await result.current.updateSubscription({
                subscriptionId: 'marketing-email',
                channel: 'email',
                status: 'opt_out',
                contactPointValue: 'customer@example.com'
            })

            expect(response).toEqual(mockResponse)
        })

        test('reflects loading state during mutation', () => {
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscription) {
                    return {
                        ...mockUseMutationResult,
                        isLoading: true
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isUpdating).toBe(true)
        })

        test('reflects error state when mutation fails', () => {
            const mockError = new Error('Update failed')
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscription) {
                    return {
                        ...mockUseMutationResult,
                        error: mockError
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.updateError).toEqual(mockError)
        })
    })

    describe('Update multiple subscriptions', () => {
        test('calls updateSubscriptions mutation with correct parameters', async () => {
            const mockMutateAsync = jest.fn().mockResolvedValue({})
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscriptions) {
                    return {
                        ...mockUseMutationResult,
                        mutateAsync: mockMutateAsync
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            const subscriptionsData = [
                {
                    subscriptionId: 'marketing-email',
                    channel: 'email',
                    status: 'opt_in',
                    contactPointValue: 'customer@example.com'
                },
                {
                    subscriptionId: 'marketing-sms',
                    channel: 'sms',
                    status: 'opt_out',
                    contactPointValue: '+15551234567'
                }
            ]

            await result.current.updateSubscriptions(subscriptionsData)

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {},
                body: {
                    subscriptions: subscriptionsData
                }
            })
        })

        test('returns mutation result on success', async () => {
            const mockResponse = {success: true}
            const mockMutateAsync = jest.fn().mockResolvedValue(mockResponse)
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscriptions) {
                    return {
                        ...mockUseMutationResult,
                        mutateAsync: mockMutateAsync
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            const response = await result.current.updateSubscriptions([
                {
                    subscriptionId: 'marketing-email',
                    channel: 'email',
                    status: 'opt_in',
                    contactPointValue: 'customer@example.com'
                }
            ])

            expect(response).toEqual(mockResponse)
        })

        test('reflects loading state during mutation', () => {
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscriptions) {
                    return {
                        ...mockUseMutationResult,
                        isLoading: true
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isUpdating).toBe(true)
        })

        test('reflects error state when mutation fails', () => {
            const mockError = new Error('Bulk update failed')
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscriptions) {
                    return {
                        ...mockUseMutationResult,
                        error: mockError
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.updateError).toEqual(mockError)
        })
    })

    describe('Mutation hooks initialization', () => {
        test('initializes UpdateSubscription mutation hook', () => {
            renderHook(() => useMarketingConsent())

            expect(useShopperConsentsMutation).toHaveBeenCalledWith(
                ShopperConsentsMutations.UpdateSubscription
            )
        })

        test('initializes UpdateSubscriptions mutation hook', () => {
            renderHook(() => useMarketingConsent())

            expect(useShopperConsentsMutation).toHaveBeenCalledWith(
                ShopperConsentsMutations.UpdateSubscriptions
            )
        })

        test('initializes both mutation hooks', () => {
            renderHook(() => useMarketingConsent())

            expect(useShopperConsentsMutation).toHaveBeenCalledTimes(2)
        })
    })

    describe('Edge cases', () => {
        test('handles undefined data gracefully', () => {
            useSubscriptions.mockReturnValue({
                ...mockUseQueryResult,
                data: undefined
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.getSubscriptionStatus('marketing-email', 'email')).toBeNull()
            expect(result.current.hasChannel('marketing-email', 'email')).toBe(false)
            expect(result.current.getSubscriptionsByContact('customer@example.com')).toEqual([])
        })

        test('handles subscription without channels property', () => {
            useSubscriptions.mockReturnValue({
                ...mockUseQueryResult,
                data: {
                    data: [
                        {
                            subscriptionId: 'test-subscription',
                            contactPointValue: 'test@example.com'
                        }
                    ]
                }
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.hasChannel('test-subscription', 'email')).toBe(false)
        })

        test('exposes refetch function from query', () => {
            const mockRefetch = jest.fn()
            useSubscriptions.mockReturnValue({
                ...mockUseQueryResult,
                refetch: mockRefetch
            })

            const {result} = renderHook(() => useMarketingConsent())

            result.current.refetch()
            expect(mockRefetch).toHaveBeenCalled()
        })

        test('reflects success state after mutation completes', () => {
            useShopperConsentsMutation.mockImplementation((mutationType) => {
                if (mutationType === ShopperConsentsMutations.UpdateSubscription) {
                    return {
                        ...mockUseMutationResult,
                        isSuccess: true
                    }
                }
                return mockUseMutationResult
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isUpdateSuccess).toBe(true)
        })
    })
})
