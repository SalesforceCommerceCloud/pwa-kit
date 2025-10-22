/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import PaymentProcessing from '@salesforce/retail-react-app/app/pages/checkout/payment-processing'
import {STATUS_SUCCESS} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'

// Mock dependencies
const mockNavigate = jest.fn()
const mockToast = jest.fn()
const mockHandleRedirect = jest.fn()
const mockUseSFPayments = jest.fn()

jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: () => mockNavigate
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: () => mockToast
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments', () => ({
    useSFPayments: () => mockUseSFPayments(),
    useSFPaymentsEnabled: () => true,
    STATUS_SUCCESS: 0
}))

// Mock useLocation
const mockLocation = {search: ''}
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => mockLocation
}))

describe('PaymentProcessing', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Default location with orderNo
        mockLocation.search = '?orderNo=12345'

        // Default mock implementations
        mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

        // Default SFP mock
        mockUseSFPayments.mockReturnValue({
            sfp: {
                handleRedirect: mockHandleRedirect
            }
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('rendering', () => {
        test('renders payment processing heading', () => {
            renderWithProviders(<PaymentProcessing />)

            expect(screen.getByText('Payment Processing')).toBeInTheDocument()
        })

        test('renders working message when orderNo is present', () => {
            renderWithProviders(<PaymentProcessing />)

            expect(screen.getByText('Working on your payment...')).toBeInTheDocument()
        })

        test('renders error message when orderNo is missing', () => {
            mockLocation.search = ''

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()
        })

        test('error state includes link to checkout page', () => {
            mockLocation.search = ''

            renderWithProviders(<PaymentProcessing />)

            const link = screen.getByText('Return to Checkout')
            // Check that href contains /checkout (may include locale prefix)
            expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('/checkout'))
        })
    })

    describe('payment processing', () => {
        test('calls handleRedirect when sfp is available and orderNo exists', async () => {
            mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})
            mockUseSFPayments.mockReturnValue({
                sfp: {
                    handleRedirect: mockHandleRedirect
                }
            })

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockHandleRedirect).toHaveBeenCalledTimes(1)
            })
        })

        test('does not call handleRedirect when orderNo is missing', async () => {
            mockLocation.search = ''

            renderWithProviders(<PaymentProcessing />)

            // Wait a bit to ensure handleRedirect is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockHandleRedirect).not.toHaveBeenCalled()
        })

        test('does not call handleRedirect when sfp is not available', async () => {
            mockUseSFPayments.mockReturnValue({sfp: null})

            renderWithProviders(<PaymentProcessing />)

            // Wait a bit to ensure handleRedirect is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockHandleRedirect).not.toHaveBeenCalled()
        })

        test('does not call handleRedirect when sfp initially unavailable', async () => {
            // Start with no sfp
            mockUseSFPayments.mockReturnValue({sfp: null})

            renderWithProviders(<PaymentProcessing />)

            // Wait a bit to ensure handleRedirect is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockHandleRedirect).not.toHaveBeenCalled()
        })
    })

    describe('successful payment', () => {
        test('navigates to confirmation page on successful payment', async () => {
            mockLocation.search = '?orderNo=12345'
            mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/checkout/confirmation/12345')
            })

            expect(mockToast).not.toHaveBeenCalled()
        })

        test('navigates with correct orderNo from URL', async () => {
            mockLocation.search = '?orderNo=67890'
            mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/checkout/confirmation/67890')
            })
        })
    })

    describe('failed payment', () => {
        test('shows error toast on failed payment', async () => {
            mockHandleRedirect.mockResolvedValue({responseCode: 1})

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: expect.stringContaining('unsuccessful'),
                    status: 'error',
                    duration: 30000
                })
            })
        })

        test('navigates back to checkout on failed payment', async () => {
            mockHandleRedirect.mockResolvedValue({responseCode: 1})

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/checkout')
            })
        })

        test('shows toast before navigating on failed payment', async () => {
            mockHandleRedirect.mockResolvedValue({responseCode: 1})

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalled()
            })

            expect(mockNavigate).toHaveBeenCalledWith('/checkout')
        })

        test('handles different error response codes', async () => {
            const errorCodes = [1, 2, -1, 999]

            for (const code of errorCodes) {
                jest.clearAllMocks()
                mockHandleRedirect.mockResolvedValue({responseCode: code})

                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalled()
                    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
                })
            }
        })
    })

    describe('edge cases', () => {
        test('handles orderNo with special characters', async () => {
            mockLocation.search = '?orderNo=ORDER-123-ABC'
            mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/checkout/confirmation/ORDER-123-ABC')
            })
        })

        test('handles multiple query parameters', async () => {
            mockLocation.search = '?orderNo=12345&other=value&foo=bar'
            mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

            renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/checkout/confirmation/12345')
            })
        })

        test('handles empty orderNo parameter', async () => {
            mockLocation.search = '?orderNo='

            renderWithProviders(<PaymentProcessing />)

            // Empty string is falsy, so it's treated as missing orderNo
            // But the param exists, so isError should be false and we see the working message
            expect(screen.getByText('Working on your payment...')).toBeInTheDocument()
        })

        test('does not call handleRedirect multiple times on re-renders', async () => {
            mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

            const {rerender} = renderWithProviders(<PaymentProcessing />)

            await waitFor(() => {
                expect(mockHandleRedirect).toHaveBeenCalledTimes(1)
            })

            // Rerender component
            rerender(<PaymentProcessing />)

            // Wait a bit
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Should still only be called once
            expect(mockHandleRedirect).toHaveBeenCalledTimes(1)
        })
    })

    describe('static methods', () => {
        test('getTemplateName returns correct template name', () => {
            expect(PaymentProcessing.getTemplateName()).toBe('payment-processing')
        })
    })

    describe('accessibility', () => {
        test('uses semantic heading element', () => {
            renderWithProviders(<PaymentProcessing />)

            const heading = screen.getByRole('heading', {name: 'Payment Processing'})
            expect(heading).toBeInTheDocument()
        })

        test('link has accessible text in error state', () => {
            mockLocation.search = ''

            renderWithProviders(<PaymentProcessing />)

            const link = screen.getByRole('link', {name: 'Return to Checkout'})
            expect(link).toBeInTheDocument()
        })
    })
})
