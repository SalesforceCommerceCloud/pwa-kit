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
const mockUseOrder = jest.fn()
const mockUpdatePaymentInstrumentForOrder = jest.fn()
const mockFailOrder = jest.fn()
const mockGetSFPaymentsInstrument = jest.fn()
const mockRefetchOrder = jest.fn()
const mockInvalidateQueries = jest.fn()

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

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useShopperOrdersMutation: (mutationKey) => {
            if (mutationKey === 'updatePaymentInstrumentForOrder') {
                return {mutateAsync: mockUpdatePaymentInstrumentForOrder}
            }
            if (mutationKey === 'failOrder') {
                return {mutateAsync: mockFailOrder}
            }
            return {mutateAsync: jest.fn()}
        },
        useOrder: () => mockUseOrder()
    }
})

jest.mock('@tanstack/react-query', () => {
    const actual = jest.requireActual('@tanstack/react-query')
    return {
        ...actual,
        useQueryClient: () => ({
            invalidateQueries: mockInvalidateQueries
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/utils/sf-payments-utils', () => ({
    getSFPaymentsInstrument: () => mockGetSFPaymentsInstrument()
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
        mockLocation.search = '?vendor=Stripe&orderNo=12345'

        // Default mock implementations
        mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

        // Default SFP mock
        mockUseSFPayments.mockReturnValue({
            sfp: {
                handleRedirect: mockHandleRedirect
            }
        })

        mockUseOrder.mockReturnValue({
            data: {
                orderNo: '12345',
                status: 'created'
            },
            refetch: mockRefetchOrder
        })
        mockRefetchOrder.mockResolvedValue({
            data: {orderNo: '12345', status: 'created'}
        })

        mockUpdatePaymentInstrumentForOrder.mockReturnValue({})

        mockGetSFPaymentsInstrument.mockReturnValue({})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('rendering', () => {
        test('renders payment processing heading', () => {
            renderWithProviders(<PaymentProcessing />)

            expect(screen.getByText('Payment Processing')).toBeInTheDocument()
        })

        test('renders working message for valid URL', () => {
            renderWithProviders(<PaymentProcessing />)

            expect(screen.getByText('Working on your payment...')).toBeInTheDocument()
        })

        test('renders error message for missing vendor', async () => {
            mockLocation.search = ''
            mockUseOrder.mockReturnValue({data: null})

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            // Wait a bit to ensure failOrder is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockFailOrder).not.toHaveBeenCalled()
        })

        test('renders error message for unknown vendor', async () => {
            mockLocation.search = '?vendor=Unknown'
            mockUseOrder.mockReturnValue({data: null})

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            // Wait a bit to ensure failOrder is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockFailOrder).not.toHaveBeenCalled()
        })

        test('renders error message for invalid Stripe URL missing order no', async () => {
            mockLocation.search = '?vendor=Stripe'
            mockUseOrder.mockReturnValue({data: null})

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            // Wait a bit to ensure failOrder is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockFailOrder).not.toHaveBeenCalled()
        })

        test('renders error message for invalid Stripe URL with empty order no', async () => {
            mockLocation.search = '?vendor=Stripe&orderNo='
            mockUseOrder.mockReturnValue({data: null})

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            // Wait a bit to ensure failOrder is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockFailOrder).not.toHaveBeenCalled()
        })

        test('renders error message for invalid Adyen URL missing order no', async () => {
            mockLocation.search = '?vendor=Adyen&type=klarna&zoneId=default&redirectResult=ABC123'
            mockUseOrder.mockReturnValue({data: null})

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            // Wait a bit to ensure failOrder is not called
            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockFailOrder).not.toHaveBeenCalled()
        })

        test('renders error message for invalid Adyen URL missing type', async () => {
            mockLocation.search = '?vendor=Adyen&orderNo=12345&zoneId=default&redirectResult=ABC123'
            mockUseOrder.mockReturnValue({
                data: {orderNo: '12345'},
                refetch: mockRefetchOrder
            })
            mockRefetchOrder.mockResolvedValue({
                data: {orderNo: '12345', status: 'created'}
            })

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            await waitFor(() => {
                expect(mockRefetchOrder).toHaveBeenCalled()
                expect(mockFailOrder).toHaveBeenCalledTimes(1)
                expect(mockFailOrder).toHaveBeenCalledWith({
                    parameters: {
                        orderNo: '12345',
                        reopenBasket: true
                    },
                    body: {
                        reasonCode: 'payment_confirm_failure'
                    }
                })
            })
        })

        test('renders error message for invalid Adyen URL missing zone id', async () => {
            mockLocation.search = '?vendor=Adyen&orderNo=12345&type=klarna&redirectResult=ABC123'
            mockUseOrder.mockReturnValue({
                data: {orderNo: '12345'},
                refetch: mockRefetchOrder
            })
            mockRefetchOrder.mockResolvedValue({
                data: {orderNo: '12345', status: 'created'}
            })

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            await waitFor(() => {
                expect(mockRefetchOrder).toHaveBeenCalled()
                expect(mockFailOrder).toHaveBeenCalledTimes(1)
                expect(mockFailOrder).toHaveBeenCalledWith({
                    parameters: {
                        orderNo: '12345',
                        reopenBasket: true
                    },
                    body: {
                        reasonCode: 'payment_confirm_failure'
                    }
                })
            })
        })

        test('renders error message for invalid Adyen URL missing redirect result', async () => {
            mockLocation.search = '?vendor=Adyen&orderNo=12345&type=klarna&zoneId=default'
            mockUseOrder.mockReturnValue({
                data: {orderNo: '12345'},
                refetch: mockRefetchOrder
            })
            mockRefetchOrder.mockResolvedValue({
                data: {orderNo: '12345', status: 'created'}
            })

            renderWithProviders(<PaymentProcessing />)

            expect(
                screen.getByText('There was an unexpected error processing your payment.')
            ).toBeInTheDocument()
            expect(screen.getByText('Return to Checkout')).toBeInTheDocument()

            await waitFor(() => {
                expect(mockRefetchOrder).toHaveBeenCalled()
                expect(mockFailOrder).toHaveBeenCalledTimes(1)
                expect(mockFailOrder).toHaveBeenCalledWith({
                    parameters: {
                        orderNo: '12345',
                        reopenBasket: true
                    },
                    body: {
                        reasonCode: 'payment_confirm_failure'
                    }
                })
            })
        })

        test('error state includes link to checkout page', () => {
            mockLocation.search = ''

            renderWithProviders(<PaymentProcessing />)

            const link = screen.getByText('Return to Checkout')
            // Check that href contains /checkout (may include locale prefix)
            expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('/checkout'))
        })
    })

    describe('Stripe', () => {
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
                mockLocation.search = '?vendor=Stripe'

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
        })

        describe('successful payment', () => {
            test('navigates to confirmation page on successful payment', async () => {
                mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockNavigate).toHaveBeenCalledWith('/checkout/confirmation/12345')
                })

                expect(mockToast).not.toHaveBeenCalled()
            })

            test('handles orderNo with special characters', async () => {
                mockLocation.search = '?vendor=Stripe&orderNo=ORDER-123-ABC'
                mockHandleRedirect.mockResolvedValue({responseCode: STATUS_SUCCESS})

                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockNavigate).toHaveBeenCalledWith(
                        '/checkout/confirmation/ORDER-123-ABC'
                    )
                })

                expect(mockToast).not.toHaveBeenCalled()
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

            test('shows toast and calls failOrder before navigating on failed payment', async () => {
                mockHandleRedirect.mockResolvedValue({responseCode: 1})
                mockRefetchOrder.mockResolvedValue({
                    data: {orderNo: '12345', status: 'created'}
                })

                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalled()
                })

                await waitFor(() => {
                    expect(mockRefetchOrder).toHaveBeenCalled()
                    expect(mockFailOrder).toHaveBeenCalledTimes(1)
                    expect(mockFailOrder).toHaveBeenCalledWith({
                        parameters: {
                            orderNo: '12345',
                            reopenBasket: true
                        },
                        body: {
                            reasonCode: 'payment_confirm_failure'
                        }
                    })
                })

                expect(mockNavigate).toHaveBeenCalledWith('/checkout')
            })

            test('does not call failOrder when order already failed by webhook', async () => {
                mockHandleRedirect.mockResolvedValue({responseCode: 1})
                mockRefetchOrder.mockResolvedValue({
                    data: {orderNo: '12345', status: 'failed'}
                })

                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalled()
                    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
                })

                expect(mockRefetchOrder).toHaveBeenCalled()
                expect(mockFailOrder).not.toHaveBeenCalled()
            })

            test('shows toast and navigates to checkout when failOrder fails', async () => {
                mockHandleRedirect.mockResolvedValue({responseCode: 1})
                mockRefetchOrder.mockResolvedValue({
                    data: {orderNo: '12345', status: 'created'}
                })
                mockFailOrder.mockRejectedValue(new Error('Order already failed'))

                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalled()
                    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
                })

                expect(mockRefetchOrder).toHaveBeenCalled()
                expect(mockFailOrder).toHaveBeenCalledTimes(1)
                expect(mockInvalidateQueries).toHaveBeenCalled()
            })

            test('handles different error response codes', async () => {
                const errorCodes = [1, 2, -1, 999]

                for (const code of errorCodes) {
                    jest.clearAllMocks()
                    mockHandleRedirect.mockResolvedValue({responseCode: code})
                    mockUseOrder.mockReturnValue({
                        data: {orderNo: '12345', status: 'created'},
                        refetch: mockRefetchOrder
                    })
                    mockRefetchOrder.mockResolvedValue({
                        data: {orderNo: '12345', status: 'created'}
                    })

                    renderWithProviders(<PaymentProcessing />)

                    await waitFor(() => {
                        expect(mockToast).toHaveBeenCalled()
                        expect(mockNavigate).toHaveBeenCalledWith('/checkout')
                    })
                }
            })
        })
    })

    describe('Adyen', () => {
        beforeEach(() => {
            mockLocation.search =
                '?vendor=Adyen&orderNo=12345&type=klarna&zoneId=default&redirectResult=ABC123'
            mockGetSFPaymentsInstrument.mockReturnValue({
                paymentInstrumentId: 'xyz789',
                paymentReference: {
                    gatewayProperties: {
                        adyen: {
                            adyenPaymentIntent: {
                                resultCode: 'Authorised'
                            }
                        }
                    }
                }
            })
        })

        describe('payment processing', () => {
            test('submits redirect result when dependencies are met', async () => {
                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockGetSFPaymentsInstrument).toHaveBeenCalledTimes(2)
                    expect(mockUpdatePaymentInstrumentForOrder).toHaveBeenCalledTimes(1)
                    expect(mockUpdatePaymentInstrumentForOrder).toHaveBeenCalledWith({
                        parameters: {
                            orderNo: '12345',
                            paymentInstrumentId: 'xyz789'
                        },
                        body: {
                            paymentMethodId: 'Salesforce Payments',
                            paymentReferenceRequest: {
                                paymentMethodType: 'klarna',
                                zoneId: 'default',
                                gateway: 'adyen',
                                gatewayProperties: {
                                    adyen: {
                                        redirectResult: 'ABC123'
                                    }
                                }
                            }
                        }
                    })
                })
            })
        })

        describe('successful payment', () => {
            test('navigates to confirmation page on successful payment', async () => {
                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockNavigate).toHaveBeenCalledWith('/checkout/confirmation/12345')
                })

                expect(mockToast).not.toHaveBeenCalled()
            })

            test('does not call updatePaymentInstrumentForOrder multiple times on re-renders', async () => {
                const {rerender} = renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockUpdatePaymentInstrumentForOrder).toHaveBeenCalledTimes(1)
                })

                // Rerender component
                rerender(<PaymentProcessing />)

                // Wait a bit
                await new Promise((resolve) => setTimeout(resolve, 100))

                // Should still only be called once
                expect(mockUpdatePaymentInstrumentForOrder).toHaveBeenCalledTimes(1)
            })
        })

        describe('failed payment', () => {
            beforeEach(() => {
                mockGetSFPaymentsInstrument.mockReturnValue({
                    paymentInstrumentId: 'xyz789',
                    paymentReference: {
                        gatewayProperties: {
                            adyen: {
                                resultCode: 'ERROR'
                            }
                        }
                    }
                })
            })

            test('shows error toast on failed payment', async () => {
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
                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
                })
            })

            test('shows toast and calls failOrder before navigating on failed payment', async () => {
                mockRefetchOrder.mockResolvedValue({
                    data: {orderNo: '12345', status: 'created'}
                })

                renderWithProviders(<PaymentProcessing />)

                await waitFor(() => {
                    expect(mockToast).toHaveBeenCalled()
                })

                await waitFor(() => {
                    expect(mockRefetchOrder).toHaveBeenCalled()
                    expect(mockFailOrder).toHaveBeenCalledTimes(1)
                    expect(mockFailOrder).toHaveBeenCalledWith({
                        parameters: {
                            orderNo: '12345',
                            reopenBasket: true
                        },
                        body: {
                            reasonCode: 'payment_confirm_failure'
                        }
                    })
                })

                expect(mockNavigate).toHaveBeenCalledWith('/checkout')
            })
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
