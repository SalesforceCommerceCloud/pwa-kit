/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SubscribeForm from './subscribe-form'

const mockSubscriptionState = {
    state: {
        email: '',
        isLoading: false,
        feedback: null
    },
    actions: {
        setEmail: jest.fn(),
        submit: jest.fn()
    }
}

describe('SubscribeForm', () => {
    test('renders component with all essential elements', () => {
        renderWithProviders(<SubscribeForm subscription={mockSubscriptionState} />)

        // Check heading
        expect(screen.getByRole('heading', {name: /be the first to know/i})).toBeInTheDocument()

        // Check description
        expect(
            screen.getByText(/sign up to stay in the loop about the hottest deals/i)
        ).toBeInTheDocument()

        // Check email input
        const emailInput = screen.getByLabelText(/email address for newsletter/i)
        expect(emailInput).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('type', 'email')
        expect(emailInput).toHaveAttribute('placeholder', 'you@email.com')

        // Check sign up button
        expect(screen.getByRole('button', {name: /sign up/i})).toBeInTheDocument()

        // Check disclaimer text with links
        expect(screen.getByText(/by subscribing, you agree to our/i)).toBeInTheDocument()
        expect(screen.getByRole('link', {name: /terms & conditions/i})).toBeInTheDocument()
        expect(screen.getByRole('link', {name: /privacy policy/i})).toBeInTheDocument()
    })

    test('renders independently without Footer context', () => {
        // This is the key test - SubscribeForm should render without being wrapped in Footer
        const {container} = renderWithProviders(
            <SubscribeForm subscription={mockSubscriptionState} />
        )

        // Should render without errors
        expect(container).toBeInTheDocument()
        expect(screen.getByRole('heading', {name: /be the first to know/i})).toBeInTheDocument()
    })

    test('applies theme styles correctly', () => {
        renderWithProviders(<SubscribeForm subscription={mockSubscriptionState} />)

        // The component should apply SubscribeForm theme styles
        // We can't directly test Chakra styles, but we can verify the component structure
        const heading = screen.getByRole('heading', {name: /be the first to know/i})
        expect(heading.tagName).toBe('H2')

        // Verify the input and button exist within an input group
        const emailInput = screen.getByLabelText(/email address for newsletter/i)
        const submitButton = screen.getByRole('button', {name: /sign up/i})
        
        // Verify both elements are in the document and properly structured
        expect(emailInput).toBeInTheDocument()
        expect(submitButton).toBeInTheDocument()
        expect(emailInput.parentElement).toBeTruthy()
    })

    test('calls setEmail when user types in email field', async () => {
        const mockSetEmail = jest.fn()
        const subscription = {
            ...mockSubscriptionState,
            actions: {
                ...mockSubscriptionState.actions,
                setEmail: mockSetEmail
            }
        }

        const {user} = renderWithProviders(<SubscribeForm subscription={subscription} />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        await user.type(emailInput, 'test@example.com')

        await waitFor(() => {
            expect(mockSetEmail).toHaveBeenCalled()
        })
    })

    test('calls submit when sign up button is clicked', async () => {
        const mockSubmit = jest.fn()
        const subscription = {
            ...mockSubscriptionState,
            actions: {
                ...mockSubscriptionState.actions,
                submit: mockSubmit
            }
        }

        const {user} = renderWithProviders(<SubscribeForm subscription={subscription} />)
        const submitButton = screen.getByRole('button', {name: /sign up/i})

        await user.click(submitButton)

        expect(mockSubmit).toHaveBeenCalledTimes(1)
    })

    test('calls submit when Enter key is pressed in email field', async () => {
        const mockSubmit = jest.fn()
        const subscription = {
            ...mockSubscriptionState,
            actions: {
                ...mockSubscriptionState.actions,
                submit: mockSubmit
            }
        }

        const {user} = renderWithProviders(<SubscribeForm subscription={subscription} />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        await user.type(emailInput, 'test@example.com')
        await user.keyboard('{Enter}')

        expect(mockSubmit).toHaveBeenCalledTimes(1)
    })

    test('does not call submit when Enter is pressed while loading', async () => {
        const mockSubmit = jest.fn()
        const subscription = {
            state: {
                ...mockSubscriptionState.state,
                isLoading: true
            },
            actions: {
                ...mockSubscriptionState.actions,
                submit: mockSubmit
            }
        }

        const {user} = renderWithProviders(<SubscribeForm subscription={subscription} />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        await user.type(emailInput, 'test@example.com')
        await user.keyboard('{Enter}')

        expect(mockSubmit).not.toHaveBeenCalled()
    })

    test('displays loading state on button', () => {
        const subscription = {
            state: {
                ...mockSubscriptionState.state,
                isLoading: true
            },
            actions: mockSubscriptionState.actions
        }

        renderWithProviders(<SubscribeForm subscription={subscription} />)
        const submitButton = screen.getByRole('button', {name: /sign up/i})

        expect(submitButton).toBeDisabled()
    })

    test('disables email input when loading', () => {
        const subscription = {
            state: {
                ...mockSubscriptionState.state,
                isLoading: true
            },
            actions: mockSubscriptionState.actions
        }

        renderWithProviders(<SubscribeForm subscription={subscription} />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        expect(emailInput).toBeDisabled()
    })

    test('displays success feedback message', () => {
        const subscription = {
            state: {
                ...mockSubscriptionState.state,
                feedback: {
                    type: 'success',
                    message: 'Successfully subscribed!'
                }
            },
            actions: mockSubscriptionState.actions
        }

        renderWithProviders(<SubscribeForm subscription={subscription} />)

        expect(screen.getByText(/successfully subscribed!/i)).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveAttribute('data-status', 'success')
    })

    test('displays error feedback message', () => {
        const subscription = {
            state: {
                ...mockSubscriptionState.state,
                feedback: {
                    type: 'error',
                    message: 'Subscription failed. Please try again.'
                }
            },
            actions: mockSubscriptionState.actions
        }

        renderWithProviders(<SubscribeForm subscription={subscription} />)

        expect(screen.getByText(/subscription failed. please try again./i)).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveAttribute('data-status', 'error')
    })

    test('displays email value from state', () => {
        const subscription = {
            state: {
                ...mockSubscriptionState.state,
                email: 'prefilled@example.com'
            },
            actions: mockSubscriptionState.actions
        }

        renderWithProviders(<SubscribeForm subscription={subscription} />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        expect(emailInput).toHaveValue('prefilled@example.com')
    })

    test('accepts custom props via otherProps', () => {
        renderWithProviders(
            <SubscribeForm
                subscription={mockSubscriptionState}
                data-testid="custom-subscribe-form"
            />
        )

        expect(screen.getByTestId('custom-subscribe-form')).toBeInTheDocument()
    })
})
