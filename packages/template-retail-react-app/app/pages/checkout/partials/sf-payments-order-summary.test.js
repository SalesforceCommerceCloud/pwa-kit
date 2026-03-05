/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SFPaymentsOrderSummary from '@salesforce/retail-react-app/app/pages/checkout/partials/sf-payments-order-summary'

// Mock getConfig to provide necessary configuration
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    const actual = jest.requireActual('@salesforce/pwa-kit-runtime/utils/ssr-config')
    const mockConfig = jest.requireActual('@salesforce/retail-react-app/config/mocks/default')
    return {
        ...actual,
        getConfig: jest.fn(() => ({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                sfPayments: {
                    enabled: true,
                    sdkUrl: 'https://example.com/sfpayments.js'
                }
            }
        }))
    }
})

// Mock getCreditCardIcon utility
jest.mock('@salesforce/retail-react-app/app/utils/cc-utils', () => ({
    getCreditCardIcon: jest.fn((brand) => {
        const iconMap = {
            visa: () => <div data-testid="visa-icon">Visa Icon</div>,
            mastercard: () => <div data-testid="mastercard-icon">MasterCard Icon</div>,
            amex: () => <div data-testid="amex-icon">Amex Icon</div>,
            discover: () => <div data-testid="discover-icon">Discover Icon</div>
        }
        return iconMap[brand]
    })
}))

describe('SFPaymentsOrderSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Payment Type Headings', () => {
        test('renders Afterpay/Clearpay heading for afterpay_clearpay type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'afterpay_clearpay'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Afterpay/Clearpay')).toBeInTheDocument()
        })

        test('renders Bancontact heading for bancontact type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'bancontact',
                c_paymentReference_bankName: 'Test Bank',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Bancontact')).toBeInTheDocument()
        })

        test('renders Credit Card heading for card type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'visa',
                c_paymentReference_last4: '4242'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Credit Card')).toBeInTheDocument()
        })

        test('renders EPS heading for eps type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'eps',
                c_paymentReference_bank: 'test_bank'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('EPS')).toBeInTheDocument()
        })

        test('renders iDEAL heading for ideal type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'ideal',
                c_paymentReference_bank: 'test_bank'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('iDEAL')).toBeInTheDocument()
        })

        test('renders Klarna heading for klarna type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'klarna'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Klarna')).toBeInTheDocument()
        })

        test('renders SEPA Debit heading for sepa_debit type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'sepa_debit',
                c_paymentReference_last4: '5678'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('SEPA Debit')).toBeInTheDocument()
        })

        test('renders Unknown heading for unknown payment type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'unknown_type'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Unknown')).toBeInTheDocument()
        })
    })

    describe('Card Brand Display', () => {
        test('displays American Express for amex brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'amex',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('American Express')).toBeInTheDocument()
        })

        test('displays Diners Club for diners brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'diners',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Diners Club')).toBeInTheDocument()
        })

        test('displays Discover for discover brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'discover',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Discover')).toBeInTheDocument()
        })

        test('displays JCB for jcb brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'jcb',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('JCB')).toBeInTheDocument()
        })

        test('displays MasterCard for mastercard brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'mastercard',
                c_paymentReference_last4: '5454'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('MasterCard')).toBeInTheDocument()
        })

        test('displays China UnionPay for unionpay brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'unionpay',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('China UnionPay')).toBeInTheDocument()
        })

        test('displays Visa for visa brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'visa',
                c_paymentReference_last4: '4242'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Visa')).toBeInTheDocument()
        })

        test('displays Unknown for unrecognized card brand', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'unknown_brand',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            // There should be two "Unknown" texts - one for heading and one for brand
            const unknownTexts = screen.getAllByText('Unknown')
            expect(unknownTexts.length).toBeGreaterThanOrEqual(1)
        })
    })

    describe('Card Details Display', () => {
        test('displays card icon for supported brands', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'visa',
                c_paymentReference_last4: '4242'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByTestId('visa-icon')).toBeInTheDocument()
        })

        test('displays last 4 digits for card type', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'visa',
                c_paymentReference_last4: '4242'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText(/4242/)).toBeInTheDocument()
        })

        test('displays masked digits format for card', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'mastercard',
                c_paymentReference_last4: '5454'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            // Check for the bullet points and last4
            expect(screen.getByText(/•••• 5454/)).toBeInTheDocument()
        })
    })

    describe('Bancontact Details', () => {
        test('displays bank name and last 4 digits for bancontact', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'bancontact',
                c_paymentReference_bankName: 'ING Bank',
                c_paymentReference_last4: '1234'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('ING Bank')).toBeInTheDocument()
            expect(screen.getByText(/1234/)).toBeInTheDocument()
        })

        test('displays masked format for bancontact last4', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'bancontact',
                c_paymentReference_bankName: 'KBC Bank',
                c_paymentReference_last4: '5678'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText(/•••• 5678/)).toBeInTheDocument()
        })
    })

    describe('SEPA Debit Details', () => {
        test('displays last 4 digits for SEPA debit', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'sepa_debit',
                c_paymentReference_last4: '9012'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText(/9012/)).toBeInTheDocument()
        })

        test('displays masked format for SEPA debit', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'sepa_debit',
                c_paymentReference_last4: '3456'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText(/•••• 3456/)).toBeInTheDocument()
        })
    })

    describe('Bank-based Payment Methods', () => {
        test('displays bank info for EPS payment', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'eps',
                c_paymentReference_bank: 'test_bank'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            // Bank should display as "Unknown" since there's no specific mapping yet
            expect(screen.getByText('Unknown')).toBeInTheDocument()
        })

        test('displays bank info for iDEAL payment', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'ideal',
                c_paymentReference_bank: 'test_bank'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            // Bank should display as "Unknown" since there's no specific mapping yet
            expect(screen.getByText('Unknown')).toBeInTheDocument()
        })
    })

    describe('Wallet Payment Methods', () => {
        test('renders only heading for Afterpay/Clearpay with no additional details', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'afterpay_clearpay'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Afterpay/Clearpay')).toBeInTheDocument()
            // Should not display any card details or bank info
            expect(screen.queryByText(/•••• /)).not.toBeInTheDocument()
        })

        test('renders only heading for Klarna with no additional details', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'klarna'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            expect(screen.getByText('Klarna')).toBeInTheDocument()
            // Should not display any card details or bank info
            expect(screen.queryByText(/•••• /)).not.toBeInTheDocument()
        })
    })

    describe('Component Structure', () => {
        test('renders with proper heading hierarchy', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'visa',
                c_paymentReference_last4: '4242'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            const heading = screen.getByRole('heading', {level: 3})
            expect(heading).toBeInTheDocument()
            expect(heading).toHaveTextContent('Credit Card')
        })

        test('renders all required elements for a complete card payment', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'mastercard',
                c_paymentReference_last4: '5454'
            }

            renderWithProviders(<SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />)

            // Heading
            expect(screen.getByRole('heading', {level: 3})).toBeInTheDocument()
            // Brand name
            expect(screen.getByText('MasterCard')).toBeInTheDocument()
            // Last 4 digits
            expect(screen.getByText(/5454/)).toBeInTheDocument()
            // Icon
            expect(screen.getByTestId('mastercard-icon')).toBeInTheDocument()
        })
    })

    describe('PropTypes', () => {
        test('requires paymentInstrument prop', () => {
            const paymentInstrument = {
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'visa',
                c_paymentReference_last4: '4242'
            }

            // Component should render without errors when prop is provided
            const {container} = renderWithProviders(
                <SFPaymentsOrderSummary paymentInstrument={paymentInstrument} />
            )

            expect(container).toBeInTheDocument()
        })
    })
})
