/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, fireEvent, act} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import OrderLookupForm from '@salesforce/retail-react-app/app/components/order-lookup/index'

// Mock the onSubmit function
const mockOnSubmit = jest.fn()

// Helper function to render with providers
const renderWithProviders = (component) => {
    return render(
        <IntlProvider locale="en" messages={{}}>
            {component}
        </IntlProvider>
    )
}

// Helper function to fill form fields
const fillFormFields = async (orderNumber = '', email = '') => {
    if (orderNumber) {
        const orderNumberInput = screen.getByLabelText('Order Number')
        fireEvent.change(orderNumberInput, {target: {value: orderNumber}})
    }

    if (email) {
        const emailInput = screen.getByLabelText('Email')
        fireEvent.change(emailInput, {target: {value: email}})
    }
}

// Helper function to submit form
const submitForm = async () => {
    const submitButton = screen.getByRole('button', {name: 'Continue'})
    await act(async () => {
        fireEvent.click(submitButton)
    })
}

describe('OrderLookupForm', () => {
    beforeEach(() => {
        mockOnSubmit.mockClear()
    })

    test('renders the form with all elements', () => {
        renderWithProviders(<OrderLookupForm onSubmit={mockOnSubmit} />)

        expect(screen.getByText('Look it up with your order number')).toBeInTheDocument()
        expect(screen.getByText('Find an individual order')).toBeInTheDocument()
        expect(screen.getByLabelText('Order Number')).toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Continue'})).toBeInTheDocument()
    })

    test('button is always enabled', () => {
        renderWithProviders(<OrderLookupForm onSubmit={mockOnSubmit} />)
        expect(screen.getByRole('button', {name: 'Continue'})).not.toBeDisabled()
    })

    test('shows validation errors when form is submitted with empty fields', async () => {
        renderWithProviders(<OrderLookupForm onSubmit={mockOnSubmit} />)
        await submitForm()

        expect(screen.getByText('Enter your order number.')).toBeInTheDocument()
        expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
        expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('shows validation error when only order number is filled', async () => {
        renderWithProviders(<OrderLookupForm onSubmit={mockOnSubmit} />)

        await act(async () => {
            await fillFormFields('12345', '')
        })
        await submitForm()

        expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
        expect(screen.queryByText('Enter your order number.')).not.toBeInTheDocument()
        expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('shows validation error when only email is filled', async () => {
        renderWithProviders(<OrderLookupForm onSubmit={mockOnSubmit} />)

        await act(async () => {
            await fillFormFields('', 'test@example.com')
        })
        await submitForm()

        expect(screen.getByText('Enter your order number.')).toBeInTheDocument()
        expect(screen.queryByText('Enter your email address.')).not.toBeInTheDocument()
        expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    test('form submits successfully when both fields are filled', async () => {
        renderWithProviders(<OrderLookupForm onSubmit={mockOnSubmit} />)

        await act(async () => {
            await fillFormFields('12345', 'test@example.com')
        })
        await submitForm()

        expect(mockOnSubmit).toHaveBeenCalledWith({
            orderNumber: '12345',
            email: 'test@example.com'
        })
    })

    test('calls onSubmit with form data when form is submitted', async () => {
        renderWithProviders(<OrderLookupForm onSubmit={mockOnSubmit} />)

        const form = screen.getByRole('button', {name: 'Continue'}).closest('form')

        await act(async () => {
            await fillFormFields('12345', 'test@example.com')
            fireEvent.submit(form)
        })

        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        expect(mockOnSubmit).toHaveBeenCalledWith({
            orderNumber: '12345',
            email: 'test@example.com'
        })
    })
})
