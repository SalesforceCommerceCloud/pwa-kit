/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {useEmailSubscription} from '@salesforce/retail-react-app/app/components/subscription/hooks/use-email-subscription'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'

jest.mock('@salesforce/retail-react-app/app/hooks/use-marketing-consent')

const createWrapper = () => {
    // eslint-disable-next-line react/prop-types
    const Wrapper = ({children}) => (
        <IntlProvider locale="en-US" defaultLocale="en-US" messages={{}} onError={() => {}}>
            {children}
        </IntlProvider>
    )
    Wrapper.displayName = 'IntlWrapper'
    return Wrapper
}

const originalFormatMessage = IntlProvider.prototype.formatMessage
beforeAll(() => {
    IntlProvider.prototype.formatMessage = function (msg) {
        return msg.defaultMessage || msg.id
    }
})
afterAll(() => {
    IntlProvider.prototype.formatMessage = originalFormatMessage
})

const originalConsoleError = console.error
beforeAll(() => {
    console.error = jest.fn()
})
afterAll(() => {
    console.error = originalConsoleError
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
        test('returns form object and onSubmit function', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            expect(result.current.form).toBeDefined()
            expect(typeof result.current.onSubmit).toBe('function')
            expect(result.current.successMessage).toBeNull()
        })

        test('form has empty email default value', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            expect(result.current.form.getValues('email')).toBe('')
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

            expect(result.current.form.getValues('email')).toBe('')
        })
    })

    describe('Form state management', () => {
        test('updates email via form.setValue', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'user@example.com')
            })

            expect(result.current.form.getValues('email')).toBe('user@example.com')
        })

        test('allows email to be cleared', () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'user@example.com')
            })
            expect(result.current.form.getValues('email')).toBe('user@example.com')

            act(() => {
                result.current.form.setValue('email', '')
            })
            expect(result.current.form.getValues('email')).toBe('')
        })
    })

    describe('submit - successful bulk subscription', () => {
        test('calls updateSubscriptions with ALL matching subscriptions', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
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

        test('shows success message after successful submission', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.successMessage).toBe('Thanks for subscribing!')
            })
        })

        test('resets form after successful submission', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.form.getValues('email')).toBe('')
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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
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

    describe('submit - no matching subscriptions', () => {
        test('sets form error when no subscriptions match tag', async () => {
            const mockRefetch = jest.fn().mockResolvedValue({data: {data: []}})
            useMarketingConsent.mockReturnValue({
                data: {data: []},
                isFeatureEnabled: true,
                refetch: mockRefetch,
                updateSubscriptions: mockUpdateSubscriptions,
                isUpdating: false
            })

            const {result} = renderHook(() => useEmailSubscription({tag: 'nonexistent_tag'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.errors.email?.message).toBe(
                    "We couldn't process the subscription. Try again."
                )
            })
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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
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
                {wrapper: createWrapper()}
            )

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[useEmailSubscription] No subscriptions found')
            )
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('tag(s) "email_capture, account"')
            )
        })
    })

    describe('submit - failed subscription', () => {
        test('sets form error when API call fails', async () => {
            mockUpdateSubscriptions.mockRejectedValue(new Error('API Error'))
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.errors.email?.message).toBe(
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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.form.getValues('email')).toBe('test@example.com')
            })
        })

        test('logs error to console when submission fails', async () => {
            const mockError = new Error('Network error')
            mockUpdateSubscriptions.mockRejectedValue(mockError)
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    '[useEmailSubscription] Subscription error:',
                    mockError
                )
            })
        })
    })

    describe('submit - 207 Multi-Status (error thrown by useMarketingConsent)', () => {
        test('sets form error when bulk update rejects due to per-item failures', async () => {
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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.errors.email?.message).toBe(
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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.form.getValues('email')).toBe('test@example.com')
            })
        })

        test('logs the thrown error to console', async () => {
            const bulkError = new Error('1 of 2 subscription update(s) failed.')
            mockUpdateSubscriptions.mockRejectedValue(bulkError)
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith(
                    '[useEmailSubscription] Subscription error:',
                    bulkError
                )
            })
        })
    })

    describe('submit - feature disabled (no-op)', () => {
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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            expect(result.current.successMessage).toBeNull()
            expect(result.current.form.getValues('email')).toBe('test@example.com')
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })

        test('does not validate email when feature is disabled', async () => {
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            expect(result.current.errors.email).toBeUndefined()
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

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
                {wrapper: createWrapper()}
            )

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

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
            const mockMultipleTagsSubscriptions = [
                {
                    subscriptionId: 'marketing-email',
                    channels: ['email'],
                    tags: ['email_capture', 'account', 'checkout']
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
                {wrapper: createWrapper()}
            )

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

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
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

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

            rerender({tag: 'registration'})

            expect(useMarketingConsent).toHaveBeenCalledWith({
                tags: ['registration'],
                enabled: false
            })
        })
    })

    describe('Feedback lifecycle — clearing on typing', () => {
        test('clears success message when user types after successful submit', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.successMessage).toBe('Thanks for subscribing!')
            })

            // User starts typing a new email — success message should clear
            act(() => {
                result.current.form.setValue('email', 'n')
            })

            await waitFor(() => {
                expect(result.current.successMessage).toBeNull()
            })
        })

        test('does not show validation error when typing partial email after successful submit', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.successMessage).toBe('Thanks for subscribing!')
            })

            // Type a partial (invalid) email — should NOT trigger validation error
            act(() => {
                result.current.form.setValue('email', 'new-use')
            })

            await waitFor(() => {
                expect(result.current.errors.email).toBeUndefined()
                expect(result.current.successMessage).toBeNull()
            })
        })

        test('clears error message when user types after failed submit', async () => {
            mockUpdateSubscriptions.mockRejectedValue(new Error('API Error'))
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.errors.email?.message).toBe(
                    "We couldn't process the subscription. Try again."
                )
            })

            // User starts correcting — error should clear
            act(() => {
                result.current.form.setValue('email', 'test@example.co')
            })

            await waitFor(() => {
                expect(result.current.errors.email).toBeUndefined()
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

            expect(result.current.form.getValues('email')).toBe('')
        })

        test('clears previous success message before new submission', async () => {
            mockUpdateSubscriptions.mockResolvedValue({})
            const {result} = renderHook(() => useEmailSubscription({tag: 'email_capture'}), {
                wrapper: createWrapper()
            })

            act(() => {
                result.current.form.setValue('email', 'test@example.com')
            })

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.successMessage).toBe('Thanks for subscribing!')
            })

            act(() => {
                result.current.form.setValue('email', 'another@example.com')
            })

            mockUpdateSubscriptions.mockRejectedValue(new Error('fail'))

            await act(async () => {
                await result.current.onSubmit()
            })

            await waitFor(() => {
                expect(result.current.successMessage).toBeNull()
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
                    result.current.form.setValue('email', email)
                })

                await act(async () => {
                    await result.current.onSubmit()
                })

                await waitFor(() => {
                    expect(mockUpdateSubscriptions).toHaveBeenCalled()
                })

                mockUpdateSubscriptions.mockClear()
            }
        })
    })
})
