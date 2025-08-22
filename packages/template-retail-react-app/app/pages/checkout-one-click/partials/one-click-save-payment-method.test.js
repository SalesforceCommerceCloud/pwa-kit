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
import SavePaymentMethod from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-save-payment-method'

// Mock the useCurrentCustomer hook
const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => mockUseCurrentCustomer()
}))

// Mock the useShopperCustomersMutation hook without clobbering the whole module
const mockCreateCustomerPaymentInstrument = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperCustomersMutation: () => ({
            mutateAsync: mockCreateCustomerPaymentInstrument
        })
    }
})

describe('SavePaymentMethod', () => {
    const mockPaymentInstrument = {
        paymentInstrumentId: 'pi-1',
        paymentMethodId: 'CREDIT_CARD',
        paymentCard: {
            cardType: 'Visa',
            numberLastDigits: '1234',
            holder: 'John Doe',
            expirationMonth: 12,
            expirationYear: 2025
        }
    }

    const mockCustomer = {
        customerId: 'test-customer-id',
        paymentInstruments: []
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer
        })
        mockCreateCustomerPaymentInstrument.mockResolvedValue({})
    })

    test('renders save checkbox for registered user', () => {
        renderWithProviders(<SavePaymentMethod paymentInstrument={mockPaymentInstrument} />)

        expect(screen.getByText(/save this payment method for future use/i)).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    test('does not render for guest user', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: null
        })

        renderWithProviders(<SavePaymentMethod paymentInstrument={mockPaymentInstrument} />)

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
        expect(
            screen.queryByText(/save this payment method for future use/i)
        ).not.toBeInTheDocument()
    })

    test('calls onSaved with true when checkbox is checked', async () => {
        const user = userEvent.setup()
        const mockOnSaved = jest.fn()

        renderWithProviders(
            <SavePaymentMethod paymentInstrument={mockPaymentInstrument} onSaved={mockOnSaved} />
        )

        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)

        await waitFor(() => {
            expect(mockOnSaved).toHaveBeenCalledWith(true)
        })
    })

    test('calls onSaved with false when checkbox is unchecked', async () => {
        const user = userEvent.setup()
        const mockOnSaved = jest.fn()

        renderWithProviders(
            <SavePaymentMethod paymentInstrument={mockPaymentInstrument} onSaved={mockOnSaved} />
        )

        const checkbox = screen.getByRole('checkbox')
        // Check
        await user.click(checkbox)
        // Uncheck
        await user.click(checkbox)

        await waitFor(() => {
            expect(mockOnSaved).toHaveBeenLastCalledWith(false)
        })
    })

    test('checkbox remains enabled when toggled', async () => {
        const user = userEvent.setup()

        renderWithProviders(<SavePaymentMethod paymentInstrument={mockPaymentInstrument} />)

        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeEnabled()
        await user.click(checkbox)
        expect(checkbox).toBeEnabled()
    })
})
