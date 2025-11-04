/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {useEmailSubscription} from './use-email-subscription'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-marketing-consent')

// Create a wrapper component that provides IntlProvider with mocked formatMessage
const createWrapper = () => {
    // eslint-disable-next-line react/prop-types
    return ({children}) => (
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
}

// Mock formatMessage globally to ensure it returns plain strings
const originalFormatMessage = IntlProvider.prototype.formatMessage
beforeAll(() => {
    // Mock formatMessage on IntlProvider
    IntlProvider.prototype.formatMessage = function(msg) {
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
            channels: new Set(['email']),
            tags: new Set(['homepage_banner'])
        },
        {
            subscriptionId: 'promotional-offers',
            channels: new Set(['email']),
            tags: new Set(['homepage_banner'])
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()

        // Default mock implementations
        mockGetSubscriptionsByTagAndChannel.mockReturnValue(mockMatchingSubscriptions)

        useMarketingConsent.mockReturnValue({
            data: {data: mockMatchingSubscriptions},
            isLoading: false,
            updateSubscriptions: mockUpdateSubscriptions,
            isUpdating: false,
            getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
        })
    })

    describe('Initial state', () => {
        test('returns correct initial state', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.email).toBe('')
            expect(result.current.state.isLoading).toBe(false)
            expect(result.current.state.isFetching).toBe(false)
            expect(result.current.state.feedback.message).toBeNull()
            expect(result.current.state.feedback.type).toBe('success')
        })

        test('provides setEmail and submit actions', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(typeof result.current.actions.setEmail).toBe('function')
            expect(typeof result.current.actions.submit).toBe('function')
        })

        test('fetches matching subscriptions based on tag', () => {
            renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(mockGetSubscriptionsByTagAndChannel).toHaveBeenCalledWith(
                'homepage_banner',
                'email'
            )
        })

        test('returns matching subscriptions count', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.matchingSubscriptionsCount).toBe(2)
        })

        test('handles empty tag gracefully', () => {
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([])
            const {result} = renderHook(() => useEmailSubscription({tag: undefined}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.matchingSubscriptionsCount).toBe(0)
        })
    })

    describe('setEmail action', () => {
        test('updates email state', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.actions.setEmail('user@example.com')
            })

            expect(result.current.state.email).toBe('user@example.com')
        })

        test('allows email to be cleared', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
                'No subscriptions available. Please try again later.'
            )
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })

        test('logs developer-friendly error message', async () => {
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([])
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
                expect.stringContaining('tag="homepage_banner"')
            )
        })
    })

    describe('submit action - successful bulk subscription', () => {
        test('calls updateSubscriptions with ALL matching subscriptions', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([mockMatchingSubscriptions[0]])
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'registration'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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

    describe('Loading states', () => {
        test('reflects isUpdating state from useMarketingConsent', () => {
            useMarketingConsent.mockReturnValue({
                data: {data: mockMatchingSubscriptions},
                isLoading: false,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: true,
                getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
            })

            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.isLoading).toBe(true)
        })

        test('reflects isFetching state from useMarketingConsent', () => {
            useMarketingConsent.mockReturnValue({
                data: {data: mockMatchingSubscriptions},
                isLoading: true,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false,
                getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
            })

            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.isFetching).toBe(true)
        })

        test('isLoading is false when not updating', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.isLoading).toBe(false)
        })

        test('isFetching is false when not loading', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.isFetching).toBe(false)
        })
    })

    describe('Tag filtering', () => {
        test('filters subscriptions by different tags', () => {
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([
                {
                    subscriptionId: 'checkout-updates',
                    channels: new Set(['email']),
                    tags: new Set(['checkout_page'])
                }
            ])

            const {result} = renderHook(() => useEmailSubscription({tag: 'checkout_page'}), {
                wrapper: createWrapper()
            })

            expect(mockGetSubscriptionsByTagAndChannel).toHaveBeenCalledWith('checkout_page', 'email')
            expect(result.current.state.matchingSubscriptionsCount).toBe(1)
        })

        test('updates matching subscriptions when data changes', () => {
            const {result, rerender} = renderHook(
                ({tag}) => useEmailSubscription({tag}),
                {
                    initialProps: {tag: 'homepage_banner'},
                    wrapper: createWrapper()
                }
            )

            expect(result.current.state.matchingSubscriptionsCount).toBe(2)

            mockGetSubscriptionsByTagAndChannel.mockReturnValue([mockMatchingSubscriptions[0]])
            rerender({tag: 'registration'})

            expect(result.current.state.matchingSubscriptionsCount).toBe(1)
        })
    })

    describe('Edge cases', () => {
        test('handles undefined subscriptions data', () => {
            useMarketingConsent.mockReturnValue({
                data: undefined,
                isLoading: false,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false,
                getSubscriptionsByTagAndChannel: mockGetSubscriptionsByTagAndChannel
            })
            mockGetSubscriptionsByTagAndChannel.mockReturnValue([])

            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
                wrapper: createWrapper()
            })

            expect(result.current.state.matchingSubscriptionsCount).toBe(0)
        })

        test('clears previous feedback messages before submission', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
                const {result} = renderHook(() => useEmailSubscription({tag: 'homepage_banner'}), {
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
