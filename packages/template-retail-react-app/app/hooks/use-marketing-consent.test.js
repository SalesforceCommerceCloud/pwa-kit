/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'
import {
    useSubscriptions,
    useConfigurations,
    useShopperConsentsMutation,
    ShopperConsentsMutations
} from '@salesforce/commerce-sdk-react'

// Mock the commerce-sdk-react hooks
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useSubscriptions: jest.fn(),
        useConfigurations: jest.fn(),
        useShopperConsentsMutation: jest.fn()
    }
})

const mockSubscriptionsData = {
    data: [
        {
            subscriptionId: 'marketing-email',
            channels: ['email'],
            tags: ['homepage_banner', 'footer'],
            contactPointValue: 'customer@example.com'
        },
        {
            subscriptionId: 'marketing-sms',
            channels: ['sms'],
            tags: ['checkout_page'],
            contactPointValue: '+15551234567'
        },
        {
            subscriptionId: 'newsletter',
            channels: ['email', 'push'],
            tags: ['homepage_banner', 'registration'],
            contactPointValue: 'customer@example.com'
        },
        {
            subscriptionId: 'promotional-offers',
            channels: ['email'],
            tags: ['homepage_banner'],
            contactPointValue: 'customer@example.com'
        }
    ]
}

const mockExpandedSubscriptionsData = {
    data: [
        {
            subscriptionId: 'marketing-email',
            channels: ['email'],
            tags: ['homepage_banner', 'footer'],
            defaultStatus: 'opt_out',
            status: [
                {
                    channel: 'email',
                    contactPointValue: 'customer@example.com',
                    status: 'opt_in'
                }
            ]
        },
        {
            subscriptionId: 'marketing-sms',
            channels: ['sms'],
            tags: ['checkout_page'],
            defaultStatus: 'opt_out',
            status: [
                {
                    channel: 'sms',
                    contactPointValue: '+15551234567',
                    status: 'opt_out'
                }
            ]
        },
        {
            subscriptionId: 'newsletter',
            channels: ['email', 'push'],
            tags: ['homepage_banner', 'registration'],
            defaultStatus: 'opt_out',
            status: [
                {
                    channel: 'email',
                    contactPointValue: 'customer@example.com',
                    status: 'opt_in'
                }
            ]
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

const mockConfigurationsEnabled = {
    configurations: [
        {
            configurationType: 'globalConfiguration',
            id: 'EnableConsentWithMarketingCloud',
            value: true
        }
    ]
}

const mockConfigurationsDisabled = {
    configurations: [
        {
            configurationType: 'globalConfiguration',
            id: 'EnableConsentWithMarketingCloud',
            value: false
        }
    ]
}

describe('useMarketingConsent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Default mock implementations
        useSubscriptions.mockReturnValue({
            ...mockUseQueryResult,
            data: mockSubscriptionsData
        })
        useConfigurations.mockReturnValue({
            data: mockConfigurationsEnabled
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

        test('passes tags parameter when provided as array', () => {
            renderHook(() => useMarketingConsent({tags: ['homepage_banner', 'footer']}))

            expect(useSubscriptions).toHaveBeenCalledWith(
                {parameters: {tags: 'homepage_banner,footer'}},
                {enabled: true}
            )
        })

        test('passes single tag parameter when provided', () => {
            renderHook(() => useMarketingConsent({tags: ['homepage_banner']}))

            expect(useSubscriptions).toHaveBeenCalledWith(
                {parameters: {tags: 'homepage_banner'}},
                {enabled: true}
            )
        })

        test('handles empty tags array', () => {
            renderHook(() => useMarketingConsent({tags: []}))

            expect(useSubscriptions).toHaveBeenCalledWith({parameters: {}}, {enabled: true})
        })

        test('combines tags and enabled options', () => {
            renderHook(() =>
                useMarketingConsent({tags: ['homepage_banner', 'footer'], enabled: false})
            )

            expect(useSubscriptions).toHaveBeenCalledWith(
                {parameters: {tags: 'homepage_banner,footer'}},
                {enabled: false}
            )
        })

        test('passes expand parameter when provided as string', () => {
            renderHook(() => useMarketingConsent({expand: 'consentStatus'}))

            expect(useSubscriptions).toHaveBeenCalledWith(
                {parameters: {expand: 'consentStatus'}},
                {enabled: true}
            )
        })

        test('does not pass expand parameter when not provided', () => {
            renderHook(() => useMarketingConsent())

            expect(useSubscriptions).toHaveBeenCalledWith({parameters: {}}, {enabled: true})
        })

        test('does not pass expand parameter when set to undefined', () => {
            renderHook(() => useMarketingConsent({expand: undefined}))

            expect(useSubscriptions).toHaveBeenCalledWith({parameters: {}}, {enabled: true})
        })

        test('combines expand, tags, and enabled options', () => {
            renderHook(() =>
                useMarketingConsent({
                    tags: ['account'],
                    expand: 'consentStatus',
                    enabled: true
                })
            )

            expect(useSubscriptions).toHaveBeenCalledWith(
                {parameters: {tags: 'account', expand: 'consentStatus'}},
                {enabled: true}
            )
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

            test('returns actual status from expanded data when contactPointValue provided', () => {
                useSubscriptions.mockReturnValue({
                    ...mockUseQueryResult,
                    data: mockExpandedSubscriptionsData
                })

                const {result} = renderHook(() => useMarketingConsent({expand: 'consentStatus'}))

                // marketing-email has status: 'opt_in' for email channel
                const status = result.current.getSubscriptionStatus(
                    'marketing-email',
                    'email',
                    'customer@example.com'
                )
                expect(status).toBe('opt_in')
            })

            test('returns actual opt_out status from expanded data', () => {
                useSubscriptions.mockReturnValue({
                    ...mockUseQueryResult,
                    data: mockExpandedSubscriptionsData
                })

                const {result} = renderHook(() => useMarketingConsent({expand: 'consentStatus'}))

                // marketing-sms has status: 'opt_out' for sms channel
                const status = result.current.getSubscriptionStatus(
                    'marketing-sms',
                    'sms',
                    '+15551234567'
                )
                expect(status).toBe('opt_out')
            })

            test('falls back to defaultStatus when status not found in expanded data', () => {
                useSubscriptions.mockReturnValue({
                    ...mockUseQueryResult,
                    data: {
                        data: [
                            {
                                subscriptionId: 'test-sub',
                                channels: ['email'],
                                defaultStatus: 'opt_out',
                                status: []
                            }
                        ]
                    }
                })

                const {result} = renderHook(() => useMarketingConsent({expand: 'consentStatus'}))

                const status = result.current.getSubscriptionStatus(
                    'test-sub',
                    'email',
                    'different@example.com'
                )
                expect(status).toBe('opt_out')
            })

            test('uses defaultStatus when no status array and no contactPointValue', () => {
                useSubscriptions.mockReturnValue({
                    ...mockUseQueryResult,
                    data: {
                        data: [
                            {
                                subscriptionId: 'test-sub',
                                channels: ['email'],
                                defaultStatus: 'opt_in'
                            }
                        ]
                    }
                })

                const {result} = renderHook(() => useMarketingConsent({expand: 'consentStatus'}))

                const status = result.current.getSubscriptionStatus('test-sub', 'email')
                expect(status).toBe('opt_in')
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
                expect(subscriptions).toHaveLength(3)
                expect(subscriptions[0].subscriptionId).toBe('marketing-email')
                expect(subscriptions[1].subscriptionId).toBe('newsletter')
                expect(subscriptions[2].subscriptionId).toBe('promotional-offers')
            })

            test('returns empty array when no subscriptions match', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions =
                    result.current.getSubscriptionsByContact('nonexistent@example.com')
                expect(subscriptions).toHaveLength(0)
            })
        })

        describe('getSubscriptionsByTagAndChannel', () => {
            test('returns subscriptions matching both tag and channel', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions = result.current.getSubscriptionsByTagAndChannel(
                    'homepage_banner',
                    'email'
                )
                expect(subscriptions).toHaveLength(3)
                expect(subscriptions[0].subscriptionId).toBe('marketing-email')
                expect(subscriptions[1].subscriptionId).toBe('newsletter')
                expect(subscriptions[2].subscriptionId).toBe('promotional-offers')
            })

            test('filters out subscriptions with wrong channel', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions = result.current.getSubscriptionsByTagAndChannel(
                    'homepage_banner',
                    'sms'
                )
                expect(subscriptions).toHaveLength(0)
            })

            test('filters out subscriptions with wrong tag', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions = result.current.getSubscriptionsByTagAndChannel(
                    'checkout_page',
                    'email'
                )
                expect(subscriptions).toHaveLength(0)
            })

            test('returns subscriptions matching tag across multiple channels', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions = result.current.getSubscriptionsByTagAndChannel(
                    'checkout_page',
                    'sms'
                )
                expect(subscriptions).toHaveLength(1)
                expect(subscriptions[0].subscriptionId).toBe('marketing-sms')
            })

            test('returns empty array when no subscriptions match both criteria', () => {
                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions = result.current.getSubscriptionsByTagAndChannel(
                    'nonexistent_tag',
                    'email'
                )
                expect(subscriptions).toHaveLength(0)
            })

            test('handles subscriptions without tags property', () => {
                useSubscriptions.mockReturnValue({
                    ...mockUseQueryResult,
                    data: {
                        data: [
                            {
                                subscriptionId: 'no-tags-sub',
                                channels: ['email']
                            }
                        ]
                    }
                })

                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions = result.current.getSubscriptionsByTagAndChannel(
                    'homepage_banner',
                    'email'
                )
                expect(subscriptions).toHaveLength(0)
            })

            test('handles subscriptions without channels property', () => {
                useSubscriptions.mockReturnValue({
                    ...mockUseQueryResult,
                    data: {
                        data: [
                            {
                                subscriptionId: 'no-channels-sub',
                                tags: ['homepage_banner']
                            }
                        ]
                    }
                })

                const {result} = renderHook(() => useMarketingConsent())

                const subscriptions = result.current.getSubscriptionsByTagAndChannel(
                    'homepage_banner',
                    'email'
                )
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

        test('throws when bulk response contains failed items (207 Multi-Status)', async () => {
            const mock207Response = {
                results: [
                    {
                        channel: 'email',
                        contactPointValue: 'customer@example.com',
                        error: {
                            code: 'UPDATE_FAILED',
                            message: 'Failed to update consent subscription'
                        },
                        status: 'opt_in',
                        subscriptionId: 'marketing-email',
                        success: false
                    }
                ]
            }
            const mockMutateAsync = jest.fn().mockResolvedValue(mock207Response)
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

            await expect(
                result.current.updateSubscriptions([
                    {
                        subscriptionId: 'marketing-email',
                        channel: 'email',
                        status: 'opt_in',
                        contactPointValue: 'customer@example.com'
                    }
                ])
            ).rejects.toThrow('1 of 1 subscription update(s) failed.')
        })

        test('attaches response and failures to error thrown on 207', async () => {
            const mock207Response = {
                results: [
                    {
                        subscriptionId: 'marketing-email',
                        success: false,
                        error: {code: 'UPDATE_FAILED', message: 'Failed'}
                    },
                    {
                        subscriptionId: 'marketing-sms',
                        success: true
                    }
                ]
            }
            const mockMutateAsync = jest.fn().mockResolvedValue(mock207Response)
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

            const promise = result.current.updateSubscriptions([
                {
                    subscriptionId: 'marketing-email',
                    channel: 'email',
                    status: 'opt_in',
                    contactPointValue: 'customer@example.com'
                }
            ])

            await expect(promise).rejects.toThrow('1 of 2 subscription update(s) failed.')

            const err = await promise.catch((e) => e)
            expect(err.response).toEqual(mock207Response)
            expect(err.failures).toHaveLength(1)
            expect(err.failures[0].subscriptionId).toBe('marketing-email')
        })

        test('resolves successfully when all results have success: true', async () => {
            const allSuccessResponse = {
                results: [
                    {subscriptionId: 'marketing-email', success: true},
                    {subscriptionId: 'marketing-sms', success: true}
                ]
            }
            const mockMutateAsync = jest.fn().mockResolvedValue(allSuccessResponse)
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

            expect(response).toEqual(allSuccessResponse)
        })

        test('resolves successfully when response has no results array', async () => {
            const noResultsResponse = {success: true}
            const mockMutateAsync = jest.fn().mockResolvedValue(noResultsResponse)
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

            expect(response).toEqual(noResultsResponse)
        })

        test('logs each failed item error to console on 207', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
            const mock207Response = {
                results: [
                    {
                        subscriptionId: 'marketing-email',
                        success: false,
                        error: {code: 'UPDATE_FAILED', message: 'Failed'}
                    }
                ]
            }
            const mockMutateAsync = jest.fn().mockResolvedValue(mock207Response)
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

            try {
                await result.current.updateSubscriptions([
                    {
                        subscriptionId: 'marketing-email',
                        channel: 'email',
                        status: 'opt_in',
                        contactPointValue: 'customer@example.com'
                    }
                ])
            } catch {
                // expected
            }

            expect(consoleSpy).toHaveBeenCalledWith(
                '[useMarketingConsent] Bulk update item failed:',
                {code: 'UPDATE_FAILED', message: 'Failed'}
            )
            consoleSpy.mockRestore()
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

    describe('Feature flag (EnableConsentWithMarketingCloud)', () => {
        test('isFeatureEnabled is true when configuration value is true', () => {
            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isFeatureEnabled).toBe(true)
        })

        test('isFeatureEnabled is false when configuration value is false', () => {
            useConfigurations.mockReturnValue({
                data: mockConfigurationsDisabled
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isFeatureEnabled).toBe(false)
        })

        test('isFeatureEnabled is false when configuration is missing', () => {
            useConfigurations.mockReturnValue({
                data: {configurations: []}
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isFeatureEnabled).toBe(false)
        })

        test('isFeatureEnabled is false when configurations data is undefined', () => {
            useConfigurations.mockReturnValue({data: undefined})

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isFeatureEnabled).toBe(false)
        })

        test('isFeatureEnabled is false when value is string "true" (must be boolean)', () => {
            useConfigurations.mockReturnValue({
                data: {
                    configurations: [{id: 'EnableConsentWithMarketingCloud', value: 'true'}]
                }
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isFeatureEnabled).toBe(false)
        })
    })
})
