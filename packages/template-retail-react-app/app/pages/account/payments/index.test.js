/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import AccountPayments from '@salesforce/retail-react-app/app/pages/account/payments'

// Mock the useCurrentCustomer hook
const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => mockUseCurrentCustomer()
}))

describe('AccountPayments', () => {
    const mockCustomer = {
        customerId: 'test-customer-id',
        paymentInstruments: [
            {
                paymentInstrumentId: 'pi-1',
                paymentCard: {
                    cardType: 'Visa',
                    numberLastDigits: '1234',
                    holder: 'John Doe',
                    expirationMonth: 12,
                    expirationYear: 2025
                }
            },
            {
                paymentInstrumentId: 'pi-2',
                paymentCard: {
                    cardType: 'Mastercard',
                    numberLastDigits: '5678',
                    holder: 'Jane Smith',
                    expirationMonth: 6,
                    expirationYear: 2026
                }
            }
        ]
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders payment methods heading', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        expect(screen.getByText(/payment methods/i)).toBeInTheDocument()
    })

    test('displays saved payment methods', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        // Check that both payment methods are displayed
        expect(screen.getByText('Visa')).toBeInTheDocument()
        expect(screen.getByText('Mastercard')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('•••• 1234')).toBeInTheDocument()
        expect(screen.getByText('•••• 5678')).toBeInTheDocument()
    })

    test('shows loading state', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: null,
            isLoading: true,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        expect(screen.getByText(/loading payment methods/i)).toBeInTheDocument()
    })

    test('shows error state with retry button', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: null,
            isLoading: false,
            error: new Error('Failed to load payment methods')
        })

        renderWithProviders(<AccountPayments />)

        expect(screen.getByText(/error loading payment methods/i)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /retry/i})).toBeInTheDocument()
    })

    test('shows no payment methods message when empty', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: {customerId: 'test-customer-id', paymentInstruments: []},
            isLoading: false,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        expect(screen.getByText(/no saved payment methods found/i)).toBeInTheDocument()
    })

    test('shows no payment methods message when paymentInstruments is undefined', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: {customerId: 'test-customer-id'},
            isLoading: false,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        expect(screen.getByText(/no saved payment methods found/i)).toBeInTheDocument()
    })

    test('displays refresh button', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        expect(screen.getByRole('button', {name: /refresh/i})).toBeInTheDocument()
    })

    test('calls refetch when refresh button is clicked', async () => {
        const mockRefetch = jest.fn()
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null,
            refetch: mockRefetch
        })

        const {user} = renderWithProviders(<AccountPayments />)

        const refreshButton = screen.getByRole('button', {name: /refresh/i})
        await user.click(refreshButton)

        expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    test('calls refetch when retry button is clicked', async () => {
        const mockRefetch = jest.fn()
        mockUseCurrentCustomer.mockReturnValue({
            data: null,
            isLoading: false,
            error: new Error('Failed to load payment methods'),
            refetch: mockRefetch
        })

        const {user} = renderWithProviders(<AccountPayments />)

        const retryButton = screen.getByRole('button', {name: /retry/i})
        await user.click(retryButton)

        expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    test('displays payment method details correctly', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        // Check first payment method details
        expect(screen.getByText('Visa')).toBeInTheDocument()
        expect(screen.getByText('•••• 1234')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Expires 12/2025')).toBeInTheDocument()

        // Check second payment method details
        expect(screen.getByText('Mastercard')).toBeInTheDocument()
        expect(screen.getByText('•••• 5678')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Expires 6/2026')).toBeInTheDocument()
    })
})
