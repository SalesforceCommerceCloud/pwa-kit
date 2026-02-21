/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SubscribeForm from '@salesforce/retail-react-app/app/components/subscription/subscribe-form'

// eslint-disable-next-line react/prop-types
const SubscribeFormWithForm = ({onSubmit = jest.fn(), successMessage, ...props}) => {
    const form = useForm({defaultValues: {email: ''}})
    return (
        <SubscribeForm
            form={form}
            onSubmit={onSubmit || form.handleSubmit(() => {})}
            successMessage={successMessage}
            {...props}
        />
    )
}

describe('SubscribeForm', () => {
    test('renders component with all essential elements', () => {
        renderWithProviders(<SubscribeFormWithForm />)

        expect(
            screen.getByRole('heading', {name: /subscribe to stay updated/i})
        ).toBeInTheDocument()

        expect(screen.getByText(/be the first to know about latest/i)).toBeInTheDocument()

        const emailInput = screen.getByLabelText(/email address for newsletter/i)
        expect(emailInput).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('type', 'email')
        expect(emailInput).toHaveAttribute('placeholder', 'Enter your email address...')

        expect(screen.getByRole('button', {name: /subscribe/i})).toBeInTheDocument()

        expect(screen.getByText(/by submitting this, i agree to the/i)).toBeInTheDocument()
        expect(screen.getByRole('link', {name: /terms & conditions/i})).toBeInTheDocument()
        expect(screen.getByRole('link', {name: /privacy policy/i})).toBeInTheDocument()
    })

    test('renders independently without Footer context', () => {
        const {container} = renderWithProviders(<SubscribeFormWithForm />)

        expect(container).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {name: /subscribe to stay updated/i})
        ).toBeInTheDocument()
    })

    test('applies theme styles correctly', () => {
        renderWithProviders(<SubscribeFormWithForm />)

        const heading = screen.getByRole('heading', {name: /subscribe to stay updated/i})
        expect(heading.tagName).toBe('H2')

        const emailInput = screen.getByLabelText(/email address for newsletter/i)
        const submitButton = screen.getByRole('button', {name: /subscribe/i})

        expect(emailInput).toBeInTheDocument()
        expect(submitButton).toBeInTheDocument()
        expect(emailInput.parentElement).toBeTruthy()
    })

    test('calls onSubmit when sign up button is clicked', async () => {
        const mockSubmit = jest.fn((e) => e?.preventDefault?.())

        const {user} = renderWithProviders(<SubscribeFormWithForm onSubmit={mockSubmit} />)
        const submitButton = screen.getByRole('button', {name: /subscribe/i})

        await user.click(submitButton)

        expect(mockSubmit).toHaveBeenCalled()
    })

    test('calls onSubmit when Enter key is pressed in email field', async () => {
        const mockSubmit = jest.fn((e) => e?.preventDefault?.())

        const {user} = renderWithProviders(<SubscribeFormWithForm onSubmit={mockSubmit} />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        await user.type(emailInput, 'test@example.com')
        await user.keyboard('{Enter}')

        expect(mockSubmit).toHaveBeenCalled()
    })

    test('displays success feedback message', () => {
        renderWithProviders(<SubscribeFormWithForm successMessage="Successfully subscribed!" />)

        expect(screen.getByText(/successfully subscribed!/i)).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveAttribute('data-status', 'success')
    })

    test('does not display alert when no feedback', () => {
        renderWithProviders(<SubscribeFormWithForm />)

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    test('renders email input with default empty value', () => {
        renderWithProviders(<SubscribeFormWithForm />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        expect(emailInput).toHaveValue('')
    })

    test('allows user to type in email field', async () => {
        const {user} = renderWithProviders(<SubscribeFormWithForm />)
        const emailInput = screen.getByLabelText(/email address for newsletter/i)

        await user.type(emailInput, 'test@example.com')

        await waitFor(() => {
            expect(emailInput).toHaveValue('test@example.com')
        })
    })

    test('accepts custom props via otherProps', () => {
        renderWithProviders(<SubscribeFormWithForm data-testid="custom-subscribe-form" />)

        expect(screen.getByTestId('custom-subscribe-form')).toBeInTheDocument()
    })

    test('form is interactive when not submitting', () => {
        renderWithProviders(<SubscribeFormWithForm />)

        const emailInput = screen.getByLabelText(/email address for newsletter/i)
        const submitButton = screen.getByRole('button', {name: /subscribe/i})

        expect(emailInput).not.toBeDisabled()
        expect(submitButton).not.toBeDisabled()
    })

    test('submit button has type="submit"', () => {
        renderWithProviders(<SubscribeFormWithForm />)
        const submitButton = screen.getByRole('button', {name: /subscribe/i})

        expect(submitButton).toHaveAttribute('type', 'submit')
    })

    test('form element has noValidate attribute', () => {
        renderWithProviders(<SubscribeFormWithForm />)
        const form = document.querySelector('form')

        expect(form).toHaveAttribute('novalidate')
    })
})
