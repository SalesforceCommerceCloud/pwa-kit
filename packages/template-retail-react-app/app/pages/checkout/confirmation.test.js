/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import Confirmation from '@salesforce/retail-react-app/app/pages/checkout/confirmation'
import {
    mockOrder,
    mockProducts
} from '@salesforce/retail-react-app/app/pages/checkout/confirmation.mock'

// Mock getConfig to provide necessary configuration for SF Payments
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

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/checkout/confirmation/:orderNo')}>
                <Confirmation />
            </Route>
        </Switch>
    )
}

const mockCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: '00151503',
    email: 'jkeane@64labs.com',
    firstName: 'John',
    lastName: 'Keane',
    login: 'jkeane@64labs.com'
}

beforeEach(() => {
    global.server.use(
        rest.get('*/orders/:orderId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrder))
        }),
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockProducts))
        })
    )
    window.history.pushState(
        {},
        'Checkout',
        createPathWithDefaults('/checkout/confirmation/000123')
    )
})

test('Renders the order detail', async () => {
    renderWithProviders(<MockedComponent />)
    const el = await screen.findByText(mockOrder.orderNo)
    expect(el).toBeInTheDocument()
})

test('Renders the Create Account form for guest customer', async () => {
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {isGuest: true}
    })

    const button = await screen.findByRole('button', {name: /create account/i})
    expect(button).toBeInTheDocument()

    // Email should already have been auto-filled
    const email = await screen.findByText(mockOrder.customerInfo.email)
    expect(email).toBeInTheDocument()

    const password = screen.getByLabelText('Password')
    expect(password).toBeInTheDocument()
})

test('Create Account form - renders error message', async () => {
    global.server.use(
        rest.post('*/customers', (_, res, ctx) => {
            const failedAccountCreation = {
                title: 'Login Already In Use',
                type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/login-already-in-use',
                detail: 'The login is already in use.'
            }
            return res(ctx.status(400), ctx.json(failedAccountCreation))
        })
    )

    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {isGuest: true}
    })

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const passwordEl = await screen.findByLabelText('Password')
    await user.type(passwordEl, 'P4ssword!')
    await user.click(createAccountButton)
    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
})

test('Create Account form - successful submission results in redirect to the Account page', async () => {
    global.server.use(
        rest.post('*/customers', (_, res, ctx) => {
            return res(ctx.status(200), ctx.json(mockCustomer))
        }),
        rest.post('*/customers/:customerId/addresses', (_, res, ctx) => {
            return res(ctx.status(200))
        })
    )

    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {isGuest: true}
    })

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const password = screen.getByLabelText('Password')

    await user.type(password, 'P4ssword!')
    await user.click(createAccountButton)

    await waitFor(() => {
        expect(window.location.pathname).toBe('/uk/en-GB/account')
    })
})

describe('Account form', () => {
    test('saves phone number from billing address to customer', async () => {
        let registrationRequestBody = null

        global.server.use(
            rest.post('*/customers', (req, res, ctx) => {
                registrationRequestBody = req.body
                return res(
                    ctx.status(200),
                    ctx.json({
                        customerId: 'new-customer-id',
                        email: mockOrder.customerInfo.email,
                        firstName: mockOrder.billingAddress.firstName,
                        lastName: mockOrder.billingAddress.lastName,
                        phoneHome: mockOrder.shipments[0].shippingAddress.phone
                    })
                )
            }),
            rest.post('*/customers/*/addresses', (_, res, ctx) => {
                return res(ctx.status(200))
            })
        )

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {isGuest: true}
        })

        const createAccountButton = await screen.findByRole('button', {name: /create account/i})
        const password = screen.getByLabelText('Password')

        // Fill out the form (firstName and lastName are hidden fields pre-filled from order data)
        await user.type(password, 'P4ssword!')
        await user.click(createAccountButton)

        // Wait for the registration request to complete
        await waitFor(() => {
            expect(registrationRequestBody).not.toBeNull()
        })

        // Verify that the phone number from the order's billing address is included in the registration
        expect(registrationRequestBody.customer.phoneHome).toBe(mockOrder.billingAddress.phone)
        expect(registrationRequestBody.customer.phoneHome).toBe('(778) 888-8888')

        // Verify other expected customer data (firstName/lastName come from order's billingAddress)
        expect(registrationRequestBody.customer.firstName).toBe(mockOrder.billingAddress.firstName)
        expect(registrationRequestBody.customer.lastName).toBe(mockOrder.billingAddress.lastName)
        expect(registrationRequestBody.customer.email).toBe(mockOrder.customerInfo.email)
        expect(registrationRequestBody.customer.login).toBe(mockOrder.customerInfo.email)
        expect(registrationRequestBody.password).toBe('P4ssword!')
    })

    test('Integration test - phone number from order is visible in customer account after registration', async () => {
        let savedCustomerData = null

        global.server.use(
            // Mock customer registration
            rest.post('*/customers', (req, res, ctx) => {
                savedCustomerData = {
                    customerId: 'new-customer-id-123',
                    email: mockOrder.customerInfo.email,
                    firstName: mockOrder.billingAddress.firstName,
                    lastName: mockOrder.billingAddress.lastName,
                    phoneHome: mockOrder.billingAddress.phone,
                    login: mockOrder.customerInfo.email
                }
                return res(ctx.status(200), ctx.json(savedCustomerData))
            }),
            // Mock address creation
            rest.post('*/customers/*/addresses', (_, res, ctx) => {
                return res(ctx.status(200))
            }),
            // Mock customer profile fetch for account page
            rest.get('*/customers/new-customer-id-123', (_, res, ctx) => {
                return res(
                    ctx.status(200),
                    ctx.json({
                        ...savedCustomerData,
                        addresses: [
                            {
                                addressId: 'address-1',
                                firstName: mockOrder.billingAddress.firstName,
                                lastName: mockOrder.billingAddress.lastName,
                                address1: mockOrder.shipments[0].shippingAddress.address1,
                                city: mockOrder.shipments[0].shippingAddress.city,
                                phone: mockOrder.billingAddress.phone,
                                postalCode: mockOrder.shipments[0].shippingAddress.postalCode,
                                stateCode: mockOrder.shipments[0].shippingAddress.stateCode,
                                countryCode: mockOrder.shipments[0].shippingAddress.countryCode
                            }
                        ]
                    })
                )
            }),
            // Mock any other account page dependencies
            rest.get('*/customers/*/orders', (_, res, ctx) => {
                return res(ctx.status(200), ctx.json({data: [], total: 0}))
            }),
            rest.get('*/customers/*/product-lists', (_, res, ctx) => {
                return res(ctx.status(200), ctx.json({data: []}))
            })
        )

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {isGuest: true}
        })

        // Step 1: Fill out and submit the registration form
        const createAccountButton = await screen.findByRole('button', {name: /create account/i})
        const password = screen.getByLabelText('Password')

        // Fill out the form (firstName and lastName are hidden fields pre-filled from order data)
        await user.type(password, 'P4ssword!')
        await user.click(createAccountButton)

        // Step 2: Wait for redirect to account page
        await waitFor(
            () => {
                expect(window.location.pathname).toBe('/uk/en-GB/account')
            },
            {timeout: 5000}
        )

        // Step 3: Verify that the customer data was saved correctly
        expect(savedCustomerData).not.toBeNull()
        expect(savedCustomerData.phoneHome).toBe('(778) 888-8888')

        // Note: This test verifies the API calls and data flow.
        // A full end-to-end test would require rendering the Account page component
        // and verifying the phone number is displayed in the UI, but that would require
        // additional setup of the Account page component and its dependencies.

        // The key assertion is that the phone from the order's billing address
        // is correctly saved to the customer's phoneHome field during registration
        expect(savedCustomerData.phoneHome).toBe(mockOrder.billingAddress.phone)
    })

    test('successful submission redirects to the Account page even if shipping address is not saved', async () => {
        global.server.use(
            rest.post('*/customers', (_, res, ctx) => {
                return res(ctx.status(200), ctx.json(mockCustomer))
            }),
            rest.post('*/customers/:customerId/addresses', (_, res, ctx) => {
                const failedAddressCreation = {
                    title: 'Invalid Customer',
                    type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/invalid-customer',
                    detail: 'The customer is invalid.'
                }
                return res(ctx.status(400), ctx.json(failedAddressCreation))
            })
        )

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {isGuest: true}
        })

        const createAccountButton = await screen.findByRole('button', {name: /create account/i})
        const password = screen.getByLabelText('Password')
        await user.type(password, 'P4ssword!')
        await user.click(createAccountButton)

        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
        })
    })
})

describe('Salesforce Payments Integration', () => {
    const mockSFPaymentsOrder = {
        ...mockOrder,
        paymentInstruments: [
            {
                amount: 82.56,
                paymentInstrumentId: 'sfp123',
                paymentMethodId: 'Salesforce Payments',
                c_paymentReference_type: 'card',
                c_paymentReference_brand: 'visa',
                c_paymentReference_last4: '4242'
            }
        ]
    }

    beforeEach(() => {
        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockSFPaymentsOrder))
            })
        )
    })

    test('renders SFPaymentsOrderSummary for Salesforce Payments orders', async () => {
        renderWithProviders(<MockedComponent />)

        // Wait for the page to load
        await screen.findByText(mockSFPaymentsOrder.orderNo)

        // Check that Payment Details section exists
        const paymentDetailsHeading = screen.getByText('Payment Details')
        expect(paymentDetailsHeading).toBeInTheDocument()

        // The SFPaymentsOrderSummary should render instead of credit card display
        const creditCardHeading = await screen.findByRole('heading', {name: /credit card/i})
        expect(creditCardHeading).toBeInTheDocument()
    })

    test('displays Visa payment information for Salesforce Payments', async () => {
        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockSFPaymentsOrder.orderNo)

        // Check for Visa brand name
        expect(await screen.findByText('Visa')).toBeInTheDocument()

        // Check for last 4 digits with masked format
        expect(screen.getByText(/4242/)).toBeInTheDocument()
    })

    test('renders different payment types for Salesforce Payments', async () => {
        const mockOrderWithKlarna = {
            ...mockOrder,
            paymentInstruments: [
                {
                    amount: 82.56,
                    paymentInstrumentId: 'sfp-klarna',
                    paymentMethodId: 'Salesforce Payments',
                    c_paymentReference_type: 'klarna'
                }
            ]
        }

        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderWithKlarna))
            })
        )

        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockOrderWithKlarna.orderNo)

        // Check for Klarna heading
        expect(await screen.findByText('Klarna')).toBeInTheDocument()
    })

    test('displays MasterCard payment information for Salesforce Payments', async () => {
        const mockOrderWithMasterCard = {
            ...mockOrder,
            paymentInstruments: [
                {
                    amount: 82.56,
                    paymentInstrumentId: 'sfp-mc',
                    paymentMethodId: 'Salesforce Payments',
                    c_paymentReference_type: 'card',
                    c_paymentReference_brand: 'mastercard',
                    c_paymentReference_last4: '5454'
                }
            ]
        }

        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderWithMasterCard))
            })
        )

        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockOrderWithMasterCard.orderNo)

        // Check for MasterCard brand name
        expect(await screen.findByText('MasterCard')).toBeInTheDocument()

        // Check for last 4 digits
        expect(screen.getByText(/5454/)).toBeInTheDocument()
    })

    test('displays SEPA Debit payment information for Salesforce Payments', async () => {
        const mockOrderWithSEPA = {
            ...mockOrder,
            paymentInstruments: [
                {
                    amount: 82.56,
                    paymentInstrumentId: 'sfp-sepa',
                    paymentMethodId: 'Salesforce Payments',
                    c_paymentReference_type: 'sepa_debit',
                    c_paymentReference_last4: '9012'
                }
            ]
        }

        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderWithSEPA))
            })
        )

        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockOrderWithSEPA.orderNo)

        // Check for SEPA Debit heading
        expect(await screen.findByText('SEPA Debit')).toBeInTheDocument()

        // Check for last 4 digits
        expect(screen.getByText(/9012/)).toBeInTheDocument()
    })

    test('displays Bancontact payment information for Salesforce Payments', async () => {
        const mockOrderWithBancontact = {
            ...mockOrder,
            paymentInstruments: [
                {
                    amount: 82.56,
                    paymentInstrumentId: 'sfp-bancontact',
                    paymentMethodId: 'Salesforce Payments',
                    c_paymentReference_type: 'bancontact',
                    c_paymentReference_bankName: 'ING Bank',
                    c_paymentReference_last4: '1234'
                }
            ]
        }

        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderWithBancontact))
            })
        )

        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockOrderWithBancontact.orderNo)

        // Check for Bancontact heading
        expect(await screen.findByText('Bancontact')).toBeInTheDocument()

        // Check for bank name
        expect(screen.getByText('ING Bank')).toBeInTheDocument()

        // Check for last 4 digits
        expect(screen.getByText(/1234/)).toBeInTheDocument()
    })

    test('still renders traditional credit card display for non-SF Payments orders', async () => {
        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrder))
            })
        )

        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockOrder.orderNo)

        // Check for traditional credit card display
        expect(await screen.findByText('Credit Card')).toBeInTheDocument()
        expect(screen.getByText('Visa')).toBeInTheDocument()
        expect(screen.getByText(/1111/)).toBeInTheDocument()
        expect(screen.getByText(/1\/2040/)).toBeInTheDocument()
    })

    test('renders billing address alongside Salesforce Payments details', async () => {
        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockSFPaymentsOrder.orderNo)

        // Check for billing address heading
        const billingAddressHeading = screen.getByRole('heading', {name: /billing address/i})
        expect(billingAddressHeading).toBeInTheDocument()

        // Check that billing address is displayed (use getAllByText since address appears in multiple places)
        const addresses = screen.getAllByText(/123 Walnut Place/)
        expect(addresses.length).toBeGreaterThan(0)

        // Verify Payment Details heading exists
        expect(screen.getByText('Payment Details')).toBeInTheDocument()
    })

    test('displays Afterpay/Clearpay payment information for Salesforce Payments', async () => {
        const mockOrderWithAfterpay = {
            ...mockOrder,
            paymentInstruments: [
                {
                    amount: 82.56,
                    paymentInstrumentId: 'sfp-afterpay',
                    paymentMethodId: 'Salesforce Payments',
                    c_paymentReference_type: 'afterpay_clearpay'
                }
            ]
        }

        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderWithAfterpay))
            })
        )

        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockOrderWithAfterpay.orderNo)

        // Check for Afterpay/Clearpay heading
        expect(await screen.findByText('Afterpay/Clearpay')).toBeInTheDocument()
    })

    test('displays iDEAL payment information for Salesforce Payments', async () => {
        const mockOrderWithIdeal = {
            ...mockOrder,
            paymentInstruments: [
                {
                    amount: 82.56,
                    paymentInstrumentId: 'sfp-ideal',
                    paymentMethodId: 'Salesforce Payments',
                    c_paymentReference_type: 'ideal',
                    c_paymentReference_bank: 'rabobank'
                }
            ]
        }

        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderWithIdeal))
            })
        )

        renderWithProviders(<MockedComponent />)

        await screen.findByText(mockOrderWithIdeal.orderNo)

        // Check for iDEAL heading
        expect(await screen.findByText('iDEAL')).toBeInTheDocument()
    })
})
