/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import MarketingConsentCard from '@salesforce/retail-react-app/app/components/marketing-consent-card/index'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'
import {
    CONSENT_STATUS,
    CONSENT_CHANNELS,
    CONSENT_TAGS
} from '@salesforce/retail-react-app/app/constants/marketing-consent'

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/retail-react-app/app/hooks/use-marketing-consent')

const mockCustomer = {
    email: 'customer@example.com',
    phoneMobile: '+15551234567',
    phoneHome: '+15559876543',
    isLoading: false,
    isRegistered: true
}

const mockSubscriptionsData = {
    data: [
        {
            subscriptionId: 'newsletter',
            name: 'Email Newsletter',
            description: 'Receive our weekly newsletter',
            tags: [CONSENT_TAGS.ACCOUNT],
            channels: [CONSENT_CHANNELS.EMAIL],
            status: CONSENT_STATUS.OPT_OUT
        },
        {
            subscriptionId: 'promotional-offers',
            name: 'Promotional Offers',
            description: 'Get exclusive deals',
            tags: [CONSENT_TAGS.ACCOUNT],
            channels: [CONSENT_CHANNELS.EMAIL],
            status: CONSENT_STATUS.OPT_IN
        },
        {
            subscriptionId: 'sms-alerts',
            name: 'SMS Alerts',
            description: 'Receive order updates via SMS',
            tags: [CONSENT_TAGS.ACCOUNT],
            channels: [CONSENT_CHANNELS.SMS],
            status: CONSENT_STATUS.OPT_OUT
        },
        {
            subscriptionId: 'email-capture',
            name: 'Email Capture',
            description: 'Different tag',
            tags: [CONSENT_TAGS.EMAIL_CAPTURE],
            channels: [CONSENT_CHANNELS.EMAIL],
            status: CONSENT_STATUS.OPT_OUT
        }
    ]
}

const mockUpdateSubscriptions = jest.fn()
const mockGetSubscriptionStatus = jest.fn((subscriptionId, channel) => {
    const sub = mockSubscriptionsData.data.find((s) => s.subscriptionId === subscriptionId)
    if (!sub) return null
    return sub.channels.includes(channel) ? sub.status : CONSENT_STATUS.OPT_OUT
})

describe('MarketingConsentCard', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        useCurrentCustomer.mockReturnValue({
            data: mockCustomer
        })

        useMarketingConsent.mockReturnValue({
            data: mockSubscriptionsData,
            isLoading: false,
            isFetching: false,
            isUpdating: false,
            error: null,
            updateSubscriptions: mockUpdateSubscriptions,
            getSubscriptionStatus: mockGetSubscriptionStatus
        })
    })

    describe('Rendering', () => {
        it('renders the card with heading', () => {
            renderWithProviders(<MarketingConsentCard />)

            expect(screen.getByText(/marketing preferences/i)).toBeInTheDocument()
            expect(screen.getByText(/choose how you'd like to hear from us/i)).toBeInTheDocument()
        })

        it('displays only subscriptions with ACCOUNT tag', () => {
            renderWithProviders(<MarketingConsentCard />)

            expect(screen.getByText('Email Newsletter')).toBeInTheDocument()
            expect(screen.getByText('Promotional Offers')).toBeInTheDocument()
            expect(screen.getByText('SMS Alerts')).toBeInTheDocument()
            expect(screen.queryByText('Email Capture')).not.toBeInTheDocument()
        })

        it('displays subscription descriptions', () => {
            renderWithProviders(<MarketingConsentCard />)

            expect(screen.getByText('Receive our weekly newsletter')).toBeInTheDocument()
            expect(screen.getByText('Get exclusive deals')).toBeInTheDocument()
            expect(screen.getByText('Receive order updates via SMS')).toBeInTheDocument()
        })

        it('shows loading state when fetching subscriptions', () => {
            useMarketingConsent.mockReturnValue({
                data: mockSubscriptionsData,
                isLoading: false,
                isFetching: true,
                isUpdating: false,
                error: null,
                updateSubscriptions: mockUpdateSubscriptions,
                getSubscriptionStatus: mockGetSubscriptionStatus
            })

            renderWithProviders(<MarketingConsentCard />)

            // Should not show the subscriptions list yet
            expect(screen.queryByText('Email Newsletter')).not.toBeInTheDocument()
            expect(screen.queryByText('Promotional Offers')).not.toBeInTheDocument()
        })

        it('shows info message when no subscriptions match ACCOUNT tag', () => {
            useMarketingConsent.mockReturnValue({
                ...useMarketingConsent(),
                data: {data: []}
            })

            renderWithProviders(<MarketingConsentCard />)

            expect(
                screen.getByText(/no marketing preferences are currently available/i)
            ).toBeInTheDocument()
        })
    })

    describe('Channel Detection', () => {
        it('prefers EMAIL channel when subscription supports both email and SMS', () => {
            const dualChannelSub = {
                subscriptionId: 'dual-channel',
                name: 'Dual Channel Sub',
                description: 'Supports both',
                tags: [CONSENT_TAGS.ACCOUNT],
                channels: [CONSENT_CHANNELS.EMAIL, CONSENT_CHANNELS.SMS],
                status: CONSENT_STATUS.OPT_OUT
            }

            useMarketingConsent.mockReturnValue({
                ...useMarketingConsent(),
                data: {data: [dualChannelSub]}
            })

            renderWithProviders(<MarketingConsentCard />)

            // Should show the subscription with email preference
            const checkbox = screen.getByRole('checkbox', {name: /dual channel sub/i})
            expect(checkbox).toBeInTheDocument()
            expect(checkbox.id).toBe(`dual-channel-${CONSENT_CHANNELS.EMAIL}`)
        })

        it('does not show SMS subscription if customer has no phone number', () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    ...mockCustomer,
                    phoneMobile: null,
                    phoneHome: null
                }
            })

            renderWithProviders(<MarketingConsentCard />)

            // Email subscriptions should still show
            expect(screen.getByText('Email Newsletter')).toBeInTheDocument()
            expect(screen.getByText('Promotional Offers')).toBeInTheDocument()

            // SMS subscription should not be visible
            expect(screen.queryByText('SMS Alerts')).not.toBeInTheDocument()
        })

        it('uses phoneMobile if available (preferred over phoneHome)', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    ...mockCustomer,
                    phoneMobile: '+15551111111',
                    phoneHome: '+15552222222'
                }
            })

            renderWithProviders(<MarketingConsentCard />)

            const saveButton = screen.getByRole('button', {name: /save preferences/i})
            await userEvent.click(saveButton)

            await waitFor(() => {
                expect(mockUpdateSubscriptions).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            subscriptionId: 'sms-alerts',
                            channel: CONSENT_CHANNELS.SMS,
                            contactPointValue: '+15551111111' // phoneMobile preferred
                        })
                    ])
                )
            })
        })

        it('falls back to phoneHome when phoneMobile is not available', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    ...mockCustomer,
                    phoneMobile: null,
                    phoneHome: '+15552222222'
                }
            })

            renderWithProviders(<MarketingConsentCard />)

            const saveButton = screen.getByRole('button', {name: /save preferences/i})
            await userEvent.click(saveButton)

            await waitFor(() => {
                expect(mockUpdateSubscriptions).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            subscriptionId: 'sms-alerts',
                            channel: CONSENT_CHANNELS.SMS,
                            contactPointValue: '+15552222222' // phoneHome used as fallback
                        })
                    ])
                )
            })
        })
    })

    describe('Checkbox Interactions', () => {
        it('allows toggling subscription preferences', async () => {
            renderWithProviders(<MarketingConsentCard />)

            const newsletterCheckbox = screen.getByRole('checkbox', {name: /email newsletter/i})

            // Initially unchecked (based on mock status)
            expect(newsletterCheckbox).not.toBeChecked()

            // Toggle on
            await userEvent.click(newsletterCheckbox)
            expect(newsletterCheckbox).toBeChecked()

            // Toggle off
            await userEvent.click(newsletterCheckbox)
            expect(newsletterCheckbox).not.toBeChecked()
        })

        it('reflects initial opt-in status from API', () => {
            renderWithProviders(<MarketingConsentCard />)

            const newsletterCheckbox = screen.getByRole('checkbox', {name: /email newsletter/i})
            const promotionsCheckbox = screen.getByRole('checkbox', {
                name: /promotional offers/i
            })

            // Based on mockSubscriptionsData statuses
            expect(newsletterCheckbox).not.toBeChecked() // OPT_OUT
            expect(promotionsCheckbox).toBeChecked() // OPT_IN
        })
    })

    describe('Submission', () => {
        it('submits all subscriptions with correct channels and contact info', async () => {
            renderWithProviders(<MarketingConsentCard />)

            const newsletterCheckbox = screen.getByRole('checkbox', {name: /email newsletter/i})
            const smsCheckbox = screen.getByRole('checkbox', {name: /sms alerts/i})

            // Toggle some checkboxes
            await userEvent.click(newsletterCheckbox) // Opt in
            await userEvent.click(smsCheckbox) // Opt in

            const saveButton = screen.getByRole('button', {name: /save preferences/i})
            await userEvent.click(saveButton)

            await waitFor(() => {
                expect(mockUpdateSubscriptions).toHaveBeenCalledTimes(1)
                expect(mockUpdateSubscriptions).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        // Email subscriptions
                        expect.objectContaining({
                            subscriptionId: 'newsletter',
                            channel: CONSENT_CHANNELS.EMAIL,
                            status: CONSENT_STATUS.OPT_IN,
                            contactPointValue: mockCustomer.email
                        }),
                        expect.objectContaining({
                            subscriptionId: 'promotional-offers',
                            channel: CONSENT_CHANNELS.EMAIL,
                            status: CONSENT_STATUS.OPT_IN,
                            contactPointValue: mockCustomer.email
                        }),
                        // SMS subscription
                        expect.objectContaining({
                            subscriptionId: 'sms-alerts',
                            channel: CONSENT_CHANNELS.SMS,
                            status: CONSENT_STATUS.OPT_IN,
                            contactPointValue: mockCustomer.phoneMobile
                        })
                    ])
                )
            })
        })

        it('shows success toast after successful update', async () => {
            mockUpdateSubscriptions.mockResolvedValueOnce({})

            renderWithProviders(<MarketingConsentCard />)

            const saveButton = screen.getByRole('button', {name: /save preferences/i})
            await userEvent.click(saveButton)

            await waitFor(() => {
                expect(screen.getByText(/communication preferences updated/i)).toBeInTheDocument()
            })
        })

        it('shows error message if customer has no email', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    ...mockCustomer,
                    email: null
                }
            })

            renderWithProviders(<MarketingConsentCard />)

            const saveButton = screen.getByRole('button', {name: /save preferences/i})
            await userEvent.click(saveButton)

            await waitFor(() => {
                expect(
                    screen.getByText(/email address is required to manage subscriptions/i)
                ).toBeInTheDocument()
            })
            expect(mockUpdateSubscriptions).not.toHaveBeenCalled()
        })

        it('shows loading state while submitting', async () => {
            useMarketingConsent.mockReturnValue({
                data: mockSubscriptionsData,
                isLoading: false,
                isFetching: false,
                isUpdating: true,
                error: null,
                updateSubscriptions: mockUpdateSubscriptions,
                getSubscriptionStatus: mockGetSubscriptionStatus
            })

            renderWithProviders(<MarketingConsentCard />)

            const saveButton = screen.getByRole('button', {name: /saving.../i})
            expect(saveButton).toBeDisabled()
        })

        it('warns and shows error if no subscriptions to update', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

            useMarketingConsent.mockReturnValue({
                ...useMarketingConsent(),
                data: {data: []}
            })

            renderWithProviders(<MarketingConsentCard />)

            // Should show "no subscriptions available" message first
            expect(
                screen.getByText(/no marketing preferences are currently available/i)
            ).toBeInTheDocument()

            consoleWarnSpy.mockRestore()
        })
    })

    describe('Error Handling', () => {
        describe('Fetch Errors (getting subscriptions)', () => {
            it('shows friendly message instead of raw "403 Forbidden" error', () => {
                useMarketingConsent.mockReturnValue({
                    ...useMarketingConsent(),
                    data: {data: []}, // Empty subscriptions when error occurs
                    error: {message: '403 Forbidden'} // Raw error message from API
                })

                renderWithProviders(<MarketingConsentCard />)

                // Should show friendly message instead of raw error
                expect(
                    screen.getByText(/no marketing preferences are currently available/i)
                ).toBeInTheDocument()

                // Should NOT display the raw error message
                expect(screen.queryByText(/403 Forbidden/i)).not.toBeInTheDocument()
            })

            it('shows friendly message instead of raw "Network Error"', () => {
                useMarketingConsent.mockReturnValue({
                    ...useMarketingConsent(),
                    data: {data: []},
                    error: {message: 'Network Error: Failed to fetch'}
                })

                renderWithProviders(<MarketingConsentCard />)

                // Should show friendly message
                expect(
                    screen.getByText(/no marketing preferences are currently available/i)
                ).toBeInTheDocument()

                // Should NOT display the raw error message
                expect(screen.queryByText(/Network Error/i)).not.toBeInTheDocument()
                expect(screen.queryByText(/Failed to fetch/i)).not.toBeInTheDocument()
            })
        })

        describe('Update Errors (saving subscriptions)', () => {
            it('shows friendly error message when update fails', async () => {
                mockUpdateSubscriptions.mockRejectedValueOnce(new Error('API Error'))

                renderWithProviders(<MarketingConsentCard />)

                const saveButton = screen.getByRole('button', {name: /save preferences/i})
                await userEvent.click(saveButton)

                await waitFor(() => {
                    // Should show friendly, localized error message
                    expect(
                        screen.getByText(/failed to update preferences. please try again/i)
                    ).toBeInTheDocument()
                })
            })

            it('does not display raw update error messages to user', async () => {
                // Mock a detailed error that should not be shown to the user
                mockUpdateSubscriptions.mockRejectedValueOnce(
                    new Error('Internal Server Error: Database connection failed')
                )

                renderWithProviders(<MarketingConsentCard />)

                const saveButton = screen.getByRole('button', {name: /save preferences/i})
                await userEvent.click(saveButton)

                await waitFor(() => {
                    // Should show friendly message
                    expect(
                        screen.getByText(/failed to update preferences. please try again/i)
                    ).toBeInTheDocument()
                })

                // Should NOT show the raw error details
                expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument()
                expect(screen.queryByText(/Database connection failed/i)).not.toBeInTheDocument()
            })
        })
    })

    describe('Accessibility', () => {
        it('has proper checkbox labels', () => {
            renderWithProviders(<MarketingConsentCard />)

            const newsletterCheckbox = screen.getByLabelText(/email newsletter/i)
            const promotionsCheckbox = screen.getByLabelText(/promotional offers/i)

            expect(newsletterCheckbox).toBeInTheDocument()
            expect(promotionsCheckbox).toBeInTheDocument()
        })

        it('has accessible button text', () => {
            renderWithProviders(<MarketingConsentCard />)

            const saveButton = screen.getByRole('button', {name: /save preferences/i})
            expect(saveButton).toBeInTheDocument()
        })
    })
})
