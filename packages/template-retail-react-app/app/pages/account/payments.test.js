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
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

// Make card validation always pass to simplify form submission in tests
jest.mock('card-validator', () => ({
    number: () => ({
        isValid: true,
        card: {type: 'visa', gaps: [4, 8, 12], lengths: [16]}
    }),
    expirationDate: () => ({isValid: true}),
    cardholderName: () => ({isValid: true}),
    cvv: () => ({isValid: true})
}))

// Mock the useCurrentCustomer hook
const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => mockUseCurrentCustomer()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast')

// Mock the mutations
const mockMutate = jest.fn()
const mockDelete = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const original = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...original,
        useShopperCustomersMutation: (action) => {
            if (action === 'createCustomerPaymentInstrument') {
                return {mutateAsync: mockMutate}
            }
            if (action === 'deleteCustomerPaymentInstrument') {
                return {mutateAsync: mockDelete}
            }
            return original.useShopperCustomersMutation(action)
        }
    }
})

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

    test('removes a payment instrument via remove link (shows toast)', async () => {
        const mockRefetch = jest.fn()
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null,
            refetch: mockRefetch
        })
        const mockToast = jest.fn()
        useToast.mockReturnValue(mockToast)
        mockDelete.mockImplementationOnce((opts, cfg) => {
            cfg?.onSuccess?.()
            return Promise.resolve({})
        })

        const {user} = renderWithProviders(<AccountPayments />)

        // Click the first Remove link
        const removeButtons = screen.getAllByRole('button', {name: /remove/i})
        await user.click(removeButtons[0])

        await waitFor(() => expect(mockDelete).toHaveBeenCalled())
        expect(mockRefetch).toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalled()
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

    test('adds a payment instrument via form submit (shows toast)', async () => {
        const mockRefetch = jest.fn()
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null,
            refetch: mockRefetch
        })
        const mockToast = jest.fn()
        useToast.mockReturnValue(mockToast)
        mockMutate.mockImplementationOnce((opts, cfg) => {
            cfg?.onSuccess?.()
            return Promise.resolve({})
        })

        const {user} = renderWithProviders(<AccountPayments />)

        // Open form
        await user.click(screen.getByRole('button', {name: /add payment/i}))

        // Fill fields
        await user.type(
            screen.getByLabelText(/card number/i, {selector: 'input'}),
            '4111111111111111'
        )
        await user.type(screen.getByLabelText(/name on card/i), 'John Smith')
        await user.type(screen.getByLabelText(/expiration date/i), '12/30')
        await user.type(screen.getByLabelText(/security code/i, {selector: 'input'}), '123')

        // Save
        await user.click(screen.getByRole('button', {name: /save/i}))

        await waitFor(() => expect(mockMutate).toHaveBeenCalled())
        // Should refetch after save
        expect(mockRefetch).toHaveBeenCalled()
        // Toast shown
        expect(mockToast).toHaveBeenCalled()
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

        expect(screen.getByText(/no saved payments/i)).toBeInTheDocument()
    })

    test('shows no payment methods message when paymentInstruments is undefined', () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: {customerId: 'test-customer-id'},
            isLoading: false,
            error: null
        })

        renderWithProviders(<AccountPayments />)

        expect(screen.getByText(/no saved payments/i)).toBeInTheDocument()
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

    test('shows error toast when add payment fails', async () => {
        const mockRefetch = jest.fn()
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null,
            refetch: mockRefetch
        })
        const mockToast = jest.fn()
        useToast.mockReturnValue(mockToast)
        mockMutate.mockRejectedValueOnce(new Error('add failed'))

        const {user} = renderWithProviders(<AccountPayments />)

        await user.click(screen.getByRole('button', {name: /add payment/i}))
        await user.type(
            screen.getByLabelText(/card number/i, {selector: 'input'}),
            '4111111111111111'
        )
        await user.type(screen.getByLabelText(/name on card/i), 'John Smith')
        await user.type(screen.getByLabelText(/expiration date/i), '12/30')
        await user.type(screen.getByLabelText(/security code/i, {selector: 'input'}), '123')
        await user.click(screen.getByRole('button', {name: /save/i}))

        await waitFor(() => expect(mockMutate).toHaveBeenCalled())
        expect(mockToast).toHaveBeenCalled()
        const toastArg = useToast.mock.results[0].value.mock.calls[0][0]
        expect(toastArg.status).toBe('error')
        expect(mockRefetch).not.toHaveBeenCalled()
    })

    test('shows error toast when remove payment fails', async () => {
        const mockRefetch = jest.fn()
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            error: null,
            refetch: mockRefetch
        })
        const mockToast = jest.fn()
        useToast.mockReturnValue(mockToast)
        mockDelete.mockRejectedValueOnce(new Error('remove failed'))

        const {user} = renderWithProviders(<AccountPayments />)

        const removeButtons = screen.getAllByRole('button', {name: /remove/i})
        await user.click(removeButtons[0])

        await waitFor(() => expect(mockDelete).toHaveBeenCalled())
        expect(mockToast).toHaveBeenCalled()
        const toastArg = useToast.mock.results[0].value.mock.calls[0][0]
        expect(toastArg.status).toBe('error')
        expect(mockRefetch).not.toHaveBeenCalled()
    })
})
