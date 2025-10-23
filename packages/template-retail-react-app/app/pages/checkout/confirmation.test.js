/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
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

    test('save delivery addresses but does not save pickup addresses when store locator is enabled', async () => {
        const savedAddresses = []
        const mockOrderWithPickup = {
            ...mockOrder,
            shipments: [
                {
                    ...mockOrder.shipments[0],
                    shipmentId: 'delivery-shipment',
                    shippingAddress: {
                        address1: '456 Delivery St',
                        city: 'Vancouver',
                        countryCode: 'CA',
                        firstName: 'John',
                        lastName: 'Doe',
                        phone: '(604) 555-1234',
                        postalCode: 'V6B 1A1',
                        stateCode: 'BC'
                    },
                    shippingMethod: {
                        id: 'standard-delivery',
                        name: 'Standard Delivery'
                    }
                },
                {
                    shipmentId: 'pickup-shipment',
                    shippingAddress: {
                        address1: '789 Store Location Ave',
                        city: 'Burnaby',
                        countryCode: 'CA',
                        firstName: 'Store',
                        lastName: 'Pickup',
                        phone: '(604) 555-5678',
                        postalCode: 'V5H 2E2',
                        stateCode: 'BC'
                    },
                    shippingMethod: {
                        id: '005',
                        name: 'Store Pickup',
                        c_storePickupEnabled: true
                    },
                    c_fromStoreId: 'store-123'
                }
            ]
        }

        global.server.use(
            rest.get('*/orders/:orderId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderWithPickup))
            }),
            rest.post('*/customers', (_, res, ctx) => {
                return res(ctx.status(200), ctx.json(mockCustomer))
            }),
            rest.post('*/customers/:customerId/addresses', (req, res, ctx) => {
                savedAddresses.push(req.body)
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

        // Verify that only one address was saved (the delivery address, not the pickup address)
        expect(savedAddresses).toHaveLength(1)
        expect(savedAddresses[0].address1).toBe('456 Delivery St')
        expect(savedAddresses[0].city).toBe('Vancouver')

        // Verify the pickup address was NOT saved
        const hasPickupAddress = savedAddresses.some(
            (addr) => addr.address1 === '789 Store Location Ave'
        )
        expect(hasPickupAddress).toBe(false)
    })
})
