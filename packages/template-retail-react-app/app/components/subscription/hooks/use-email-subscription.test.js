/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {useEmailSubscription} from '@salesforce/retail-react-app/app/components/subscription/hooks/use-email-subscription'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-marketing-consent')

// Create a wrapper component that provides IntlProvider with mocked formatMessage
const createWrapper = () => {
    // eslint-disable-next-line react/prop-types
    const Wrapper = ({children}) => (
        <IntlProvider
            locale="en-US"
            defaultLocale="en-US"
            messages={{}}
            // Override formatMessage to return plain strings
            onError={() => {}}
        >
            {children}
        </IntlProvider>
    )
    Wrapper.displayName = 'IntlWrapper'
    return Wrapper
}

// Mock formatMessage globally to ensure it returns plain strings
const originalFormatMessage = IntlProvider.prototype.formatMessage
beforeAll(() => {
    // Mock formatMessage on IntlProvider
    IntlProvider.prototype.formatMessage = function (msg) {
        return msg.defaultMessage || msg.id
    }
})
afterAll(() => {
    IntlProvider.prototype.formatMessage = originalFormatMessage
})

// Mock console.error and console.log to avoid cluttering test output
const originalConsoleError = console.error
const originalConsoleLog = console.log
beforeAll(() => {
    console.error = jest.fn()
    console.log = jest.fn()
})
afterAll(() => {
    console.error = originalConsoleError
    console.log = originalConsoleLog
})

describe('useEmailSubscription', () => {
    const mockUpdateSubscriptions = jest.fn()
    const mockGetSubscriptionsByTagAndChannel = jest.fn()

    const mockMatchingSubscriptions = [
        {
            subscriptionId: 'weekly-newsletter',
            channels: ['email'],
            tags: ['email_capture']
        },
        {
            subscriptionId: 'promotional-offers',
            channels: ['email'],
            tags: ['email_capture']
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()

        // Default mock implementations
        mockGetSubscriptionsByTagAndChannel.mockReturnValue(mockMatchingSubscriptions)

        useMarketingConsent.mockReturnValue({
            data: {data: mockMatchingSubscriptions},
            isLoading: false,
            isFeatureEnabled: true,
            refetch: jest.fn().mockResolvedValue({data: {data: mockMatchingSubscriptions}}),
            updateSubscriptions: mockUpdateSubscriptions,
            isUpdating: false,
            getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
        })
    })

    describe('Initial state', () => {
        test('returns correct initial state', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.email).toBe('')
            expect(result.current.state.isLoading).toBe(false)
            expect(result.current.state.feedback.message).toBeNull()
            expect(result.current.state.feedback.type).toBe('success')
        })

        test('provides setEmail and submit actions', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            expect(typeof result.current.actions.setEmail).toBe('function')
            expect(typeof result.current.actions.submit).toBe('function')
        })

        test('passes tags to useMarketingConsent when tag is a string', () => {
            renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            expect(useMarketingConsent).toHaveBeenCalledWith({
                tags: ['email_capture'],
                enabled: false
            })
        })

        test('passes tags to useMarketingConsent when tag is an array', () => {
            renderHook(() => useEmailSubscription({tag: ['email_capture', 'account']}), {
                wrapper: createWrapper()
            })

            expect(useMarketingConsent).toHaveBeenCalledWith({
                tags: ['email_capture', 'account'],
                enabled: false
            })
        })

        test('handles empty tag gracefully', () => {
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([])
            const {result} = renderHook(() => useEmailSubscription({tag: undefined}), {
                wrapper: createWrapper()
            })

            // Should not throw error with undefined tag
            expect(result.current.state.email).toBe('')
            expect(result.current.state.isLoading).toBe(false)
        })
    })

    describe('setEmail action', () => {
        test('updates email state', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('user@example.com')
            })

            expect(result.current.state.email).toBe('user@example.com')
        })

        test('allows email to be cleared', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('user@example.com')
            })
            expect(result.current.state.email).toBe('user@example.com')

            act(() => {
                result.current.actions.setEmail('')
            })
            expect(result.current.state.email).toBe('')
        })
    })

    describe('submit action - validation', () => {
        test('shows error for empty email', async () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(result.current.state.feedback.type).toBe('error')
            expect(result.current.state.feedback.message).toBe('Enter a valid email address.')
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })

        test('shows error for invalid email format', async () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('invalid-email')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(result.current.state.feedback.type).toBe('error')
            expect(result.current.state.feedback.message).toBe('Enter a valid email address.')
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })

        test('accepts valid email format', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('user@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(mockUpdateSubscriptions).toHaveBeenCalled()
        })
    })

    describe('submit action - no matching subscriptions', () => {
        test('shows error when no subscriptions match tag', async () => {
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([])
            const {result} = renderHook(() => useEmailSubscription({tag: 'nonexistent_tag'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(result.current.state.feedback.type).toBe('error')
            expect(result.current.state.feedback.message).toBe(
                "We couldn't process the subscription. Try again."
            )
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })

        test('logs developer-friendly error message with single tag', async () => {
            const mockRefetch = jest.fn().mockResolvedValue({data: {data: []}})

            useMarketingConsent.mockReturnValue({
                data: {data: []},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[useEmailSubscription] No subscriptions found')
            )
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('tag(s) "email_capture"')
            )
        })

        test('logs developer-friendly error message with multiple tags', async () => {
            const mockRefetch = jest.fn().mockResolvedValue({data: {data: []}})

            useMarketingConsent.mockReturnValue({
                data: {data: []},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })
            const {result} = renderHook(
                () => useEmailSubscription({tag: ['email_capture', 'account']}),
                {
                    wrapper: createWrapper()
                }
            )

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[useEmailSubscription] No subscriptions found')
            )
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('tag(s) "email_capture, account"')
            )
        })
    })

    describe('submit action - successful bulk subscription', () => {
        test('calls updateSubscriptions with ALL matching subscriptions', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(mockUpdateSubscriptions).toHaveBeenCalledWith([
                {
                    subscriptionId: 'weekly-newsletter',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                },
                {
                    subscriptionId: 'promotional-offers',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                }
            ])
        })

        test('logs subscription details to console', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('[useEmailSubscription] Opting in to 2 subscription(s)'),
                expect.any(Array)
            )
        })

        test('shows success message after successful submission', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(result.current.state.feedback.type).toBe('success')
                expect(result.current.state.feedback.message).toBe('Thanks for subscribing!')
            })
        })

        test('clears email field after successful submission', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(result.current.state.email).toBe('')
            })
        })

        test('handles single subscription in bulk update', async () => {
            const mockRefetch = jest
                .fn()
                .mockResolvedValue({data: {data: [mockMatchingSubscriptions[0]]}})
            mockUpdateSubscriptions.mockResolvedValue({})

            useMarketingConsent.mockReturnValue({
                data: {data: [mockMatchingSubscriptions[0]]},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })

            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(mockUpdateSubscriptions).toHaveBeenCalledWith([
                {
                    subscriptionId: 'weekly-newsletter',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                }
            ])
        })
    })

    describe('submit action - failed subscription', () => {
        test('shows generic error message when API call fails', async () => {
            mockUpdateSubscriptions.mockRejectedValue(new Error('API Error'))
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(result.current.state.feedback.type).toBe('error')
                expect(result.current.state.feedback.message).toBe(
                    "We couldn't process the subscription. Try again."
                )
            })
        })

        test('does not clear email field on failure', async () => {
            mockUpdateSubscriptions.mockRejectedValue(new Error('API Error'))
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(result.current.state.email).toBe('test@example.com')
            })
        })

        test('logs error to console when submission fails', async () => {
            const mockError = new Error('Network error')
            mockUpdateSubscriptions.mockRejectedValue(mockError)
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    '[useEmailSubscription] Subscription error:',
                    mockError
                )
            })
        })
    })

    describe('submit action - 207 Multi-Status (error thrown by useMarketingConsent)', () => {
        test('shows error when bulk update rejects due to per-item failures', async () => {
            const bulkError = new Error('1 of 1 subscription update(s) failed.')
            bulkError.failures = [
                {
                    subscriptionId: 'weekly-newsletter',
                    success: false,
                    error: {code: 'UPDATE_FAILED', message: 'Failed'}
                }
            ]
            mockUpdateSubscriptions.mockRejectedValue(bulkError)
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(result.current.state.feedback.type).toBe('error')
                expect(result.current.state.feedback.message).toBe(
                    "We couldn't process the subscription. Try again."
                )
            })
        })

        test('does not clear email field on 207 failure', async () => {
            const bulkError = new Error('1 of 1 subscription update(s) failed.')
            mockUpdateSubscriptions.mockRejectedValue(bulkError)
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(result.current.state.email).toBe('test@example.com')
            })
        })

        test('logs the thrown error to console', async () => {
            const bulkError = new Error('1 of 2 subscription update(s) failed.')
            mockUpdateSubscriptions.mockRejectedValue(bulkError)
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    '[useEmailSubscription] Subscription error:',
                    bulkError
                )
            })
        })
    })

    describe('submit action - feature disabled (no-op)', () => {
        beforeEach(() => {
            useMarketingConsent.mockReturnValue({
                data: {data: mockMatchingSubscriptions},
                isLoading: false,
                isFeatureEnabled: false,
                refetch: jest.fn().mockResolvedValue({data: {data: mockMatchingSubscriptions}}),
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false,
                getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
            })
        })

        test('does nothing when feature is disabled', async () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(result.current.state.feedback.message).toBeNull()
            expect(result.current.state.feedback.type).toBe('success')
            expect(result.current.state.email).toBe('test@example.com')
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })

        test('still validates email when feature is disabled', async () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            expect(result.current.state.feedback.type).toBe('error')
            expect(result.current.state.feedback.message).toBe('Enter a valid email address.')
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })
    })

    describe('Loading states', () => {
        test('reflects isUpdating state from useMarketingConsent', () => {
            useMarketingConsent.mockReturnValue({
                data: {data: mockMatchingSubscriptions},
                isLoading: false,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: true,
                getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
            })

            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.isLoading).toBe(true)
        })

        test('isLoading is false when not updating', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.isLoading).toBe(false)
        })
    })

    describe('Tag filtering', () => {
        test('filters subscriptions by single tag on submit', async () => {
            const mockCheckoutSubscriptions = [
                {
                    subscriptionId: 'checkout-updates',
                    channels: ['email'],
                    tags: ['checkout']
                }
            ]

            const mockRefetch = jest
                .fn()
                .mockResolvedValue({data: {data: mockCheckoutSubscriptions}})
            mockUpdateSubscriptions.mockResolvedValue({})

            useMarketingConsent.mockReturnValue({
                data: {data: mockCheckoutSubscriptions},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })

            const {result} = renderHook(() => useEmailSubscription({tag: 'checkout'}), {
                wrapper: createWrapper()
            })

            expect(useMarketingConsent).toHaveBeenCalledWith({tags: ['checkout'], enabled: false})

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            // Should call updateSubscriptions with the checkout subscription
            expect(mockUpdateSubscriptions).toHaveBeenCalledWith([
                {
                    subscriptionId: 'checkout-updates',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                }
            ])
        })

        test('passes multiple tags to useMarketingConsent with enabled=false', () => {
            renderHook(() => useEmailSubscription({tag: ['email_capture', 'account']}), {
                wrapper: createWrapper()
            })

            expect(useMarketingConsent).toHaveBeenCalledWith({
                tags: ['email_capture', 'account'],
                enabled: false
            })
        })

        test('filters subscriptions with actual API format on submit', async () => {
            // Test that the filtering logic works with the actual API format
            const mockApiFormatSubscriptions = [
                {
                    subscriptionId: 'marketing-email',
                    channels: ['email'],
                    tags: ['email_capture']
                },
                {
                    subscriptionId: 'account-newsletter',
                    channels: ['email'],
                    tags: ['account']
                }
            ]

            const mockRefetch = jest
                .fn()
                .mockResolvedValue({data: {data: mockApiFormatSubscriptions}})
            mockUpdateSubscriptions.mockResolvedValue({})

            useMarketingConsent.mockReturnValue({
                data: {data: mockApiFormatSubscriptions},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })

            const {result} = renderHook(
                () => useEmailSubscription({tag: ['email_capture', 'account']}),
                {
                    wrapper: createWrapper()
                }
            )

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            // Should call updateSubscriptions with both matching subscriptions
            expect(mockUpdateSubscriptions).toHaveBeenCalledWith([
                {
                    subscriptionId: 'marketing-email',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                },
                {
                    subscriptionId: 'account-newsletter',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                }
            ])
        })

        test('matches subscription with multiple tags', async () => {
            // Test that subscriptions with multiple tags are matched correctly
            const mockMultipleTagsSubscriptions = [
                {
                    subscriptionId: 'marketing-email',
                    channels: ['email'],
                    tags: ['email_capture', 'account', 'checkout'] // Multiple tags
                }
            ]

            const mockRefetch = jest
                .fn()
                .mockResolvedValue({data: {data: mockMultipleTagsSubscriptions}})
            mockUpdateSubscriptions.mockResolvedValue({})

            useMarketingConsent.mockReturnValue({
                data: {data: mockMultipleTagsSubscriptions},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })

            const {result} = renderHook(
                () => useEmailSubscription({tag: ['email_capture', 'account']}),
                {
                    wrapper: createWrapper()
                }
            )

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            // Should match because subscription has both tags
            expect(mockUpdateSubscriptions).toHaveBeenCalledWith([
                {
                    subscriptionId: 'marketing-email',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                }
            ])
        })

        test('filters out non-email channel subscriptions on submit', async () => {
            // Test that SMS and other channels are excluded
            const mockMixedChannelSubscriptions = [
                {
                    subscriptionId: 'email-newsletter',
                    channels: ['email'],
                    tags: ['email_capture']
                },
                {
                    subscriptionId: 'sms-alerts',
                    channels: ['sms'],
                    tags: ['email_capture']
                },
                {
                    subscriptionId: 'push-notifications',
                    channels: ['push'],
                    tags: ['email_capture']
                }
            ]

            const mockRefetch = jest
                .fn()
                .mockResolvedValue({data: {data: mockMixedChannelSubscriptions}})
            mockUpdateSubscriptions.mockResolvedValue({})

            useMarketingConsent.mockReturnValue({
                data: {data: mockMixedChannelSubscriptions},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })

            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            // Should only include the email subscription, not SMS or push
            expect(mockUpdateSubscriptions).toHaveBeenCalledWith([
                {
                    subscriptionId: 'email-newsletter',
                    contactPointValue: 'test@example.com',
                    channel: 'email',
                    status: 'opt_in'
                }
            ])
        })

        test('uses updated tag when rerendered', () => {
            const {rerender} = renderHook(({tag}) => useEmailSubscription({tag}), {
                initialProps: {tag: 'email_capture'},
                wrapper: createWrapper()
            })

            expect(useMarketingConsent).toHaveBeenCalledWith({
                tags: ['email_capture'],
                enabled: false
            })

            // Change the tag
            rerender({tag: 'registration'})

            expect(useMarketingConsent).toHaveBeenCalledWith({
                tags: ['registration'],
                enabled: false
            })
        })
    })

    describe('Edge cases', () => {
        test('handles undefined subscriptions data', () => {
            const mockRefetch = jest.fn().mockResolvedValue({data: undefined})
            useMarketingConsent.mockReturnValue({
                data: undefined,
                isLoading: false,
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false,
                getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
            })
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([])

            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            // Should not throw an error
            expect(result.current.state.email).toBe('')
        })

        test('clears previous feedback messages before submission', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            // First submission with error
            await act(async () => {
                await result.current.actions.submit()
            })
            expect(result.current.state.feedback.message).toBeTruthy()

            // Second submission with valid email
            act(() => {
                result.current.actions.setEmail('test@example.com')
            })

            await act(async () => {
                await result.current.actions.submit()
            })

            // Should show success, not previous error
            await waitFor(() => {
                expect(result.current.state.feedback.type).toBe('success')
            })
        })

        test('accepts various valid email formats', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const validEmails = [
                'simple@example.com',
                'user+tag@example.com',
                'first.last@example.com',
                'user123@example456.com',
                'user@subdomain.example.com'
            ]

            for (const email of validEmails) {
                const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                    wrapper: createWrapper()
                })

                act(() => {
                    result.current.actions.setEmail(email)
                })

                await act(async () => {
                    await result.current.actions.submit()
                })

                await waitFor(() => {
                    expect(mockUpdateSubscriptions).toHaveBeenCalled()
                })

                mockUpdateSubscriptions.mockClear()
            }
        })
    })
})
