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
import SavePaymentMethod from './one-click-save-payment-method'

// Mock the useCurrentCustomer hook
const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => mockUseCurrentCustomer()
}))

// Mock the useShopperCustomersMutation hook
const mockCreateCustomerPaymentInstrument = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperCustomersMutation: () => ({
        mutateAsync: mockCreateCustomerPaymentInstrument
    })
}))

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
        
        expect(screen.getByText(/save this card/i)).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    test('does not render for guest user', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: null
        })

        const {container} = renderWithProviders(<SavePaymentMethod paymentInstrument={mockPaymentInstrument} />)
        
        expect(container.firstChild).toBeNull()
    })

    test('calls API when checkbox is checked', async () => {
        const user = userEvent.setup()
        const mockOnSaved = jest.fn()
        
        renderWithProviders(
            <SavePaymentMethod 
                paymentInstrument={mockPaymentInstrument} 
                onSaved={mockOnSaved}
            />
        )
        
        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)
        
        await waitFor(() => {
            expect(mockCreateCustomerPaymentInstrument).toHaveBeenCalledWith({
                parameters: { customerId: 'test-customer-id' },
                body: {
                    paymentMethodId: 'CREDIT_CARD',
                    paymentCard: mockPaymentInstrument.paymentCard
                }
            })
        })
    })

    test('calls onSaved callback when payment is saved successfully', async () => {
        const user = userEvent.setup()
        const mockOnSaved = jest.fn()
        
        renderWithProviders(
            <SavePaymentMethod 
                paymentInstrument={mockPaymentInstrument} 
                onSaved={mockOnSaved}
            />
        )
        
        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)
        
        await waitFor(() => {
            expect(mockOnSaved).toHaveBeenCalledWith('pi-1')
        })
    })

    test('handles API error gracefully', async () => {
        const user = userEvent.setup()
        const mockError = new Error('API Error')
        mockCreateCustomerPaymentInstrument.mockRejectedValue(mockError)
        
        renderWithProviders(<SavePaymentMethod paymentInstrument={mockPaymentInstrument} />)
        
        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)
        
        await waitFor(() => {
            // Checkbox should be unchecked after error
            expect(checkbox).not.toBeChecked()
        })
    })

    test('checkbox is disabled while saving', async () => {
        const user = userEvent.setup()
        // Mock a slow API call
        mockCreateCustomerPaymentInstrument.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        
        renderWithProviders(<SavePaymentMethod paymentInstrument={mockPaymentInstrument} />)
        
        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)
        
        // Checkbox should be disabled while saving
        expect(checkbox).toBeDisabled()
    })
})
