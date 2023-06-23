/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Checkout from '@salesforce/retail-react-app/app/pages/checkout/index'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within} from '@testing-library/react'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {
    scapiBasketWithItem,
    mockShippingMethods,
    mockedRegisteredCustomer,
    mockedCustomerProductLists
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

jest.setTimeout(30000)

// Minimal subset of `ocapiOrderResponse` in app/mocks/mock-data.js
const scapiOrderResponse = {
    orderNo: '00000101',
    customerInfo: {
        customerId: 'customerid',
        customerNo: 'jlebowski',
        email: 'jeff@lebowski.com'
    }
}

const defaultShippingMethod = mockShippingMethods.applicableShippingMethods.find(
    (method) => method.id === mockShippingMethods.defaultShippingMethodId
)

// This is our wrapped component for testing. It handles initialization of the customer
// and basket the same way it would be when rendered in the real app. We also set up
// fake routes to simulate moving from checkout to confirmation page.
const WrappedCheckout = () => {
    return (
        <Switch>
            <Route exact path={createPathWithDefaults('/checkout')}>
                <Checkout />
            </Route>
            <Route
                exact
                path={createPathWithDefaults(
                    `/checkout/confirmation/${scapiOrderResponse.orderNo}`
                )}
            >
                <div>success</div>
            </Route>
        </Switch>
    )
}

// Set up and clean up
beforeEach(() => {
    global.server.use(
        // mock product details
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.json({data: [{id: '701642811398M'}]}))
        }),
        // mock the available shipping methods
        rest.get('*/shipments/me/shipping-methods', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockShippingMethods))
        })
    )

    let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))
    // Set up additional requests for intercepting/mocking for just this test.
    global.server.use(
        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customerInfo.email = 'customer@test.com'
            return res(ctx.json(currentBasket))
        }),

        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        }),

        // mock add shipping and billing address to basket
        rest.put('*/shipping-address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: req.body.address1,
                city: 'Tampa',
                countryCode: 'US',
                firstName: 'Test',
                fullName: 'Test McTester',
                id: '047b18d4aaaf4138f693a4b931',
                lastName: 'McTester',
                phone: '(727) 555-1234',
                postalCode: '33712',
                stateCode: 'FL'
            }
            currentBasket.shipments[0].shippingAddress = shippingBillingAddress
            currentBasket.billingAddress = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add billing address to basket
        rest.put('*/billing-address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                countryCode: 'US',
                firstName: 'Test',
                fullName: 'Test McTester',
                id: '047b18d4aaaf4138f693a4b931',
                lastName: 'McTester',
                phone: '(727) 555-1234',
                postalCode: '33712',
                stateCode: 'FL',
                _type: 'orderAddress'
            }
            currentBasket.shipments[0].shippingAddress = shippingBillingAddress
            currentBasket.billingAddress = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping method
        rest.put('*/shipments/me/shipping-method', (req, res, ctx) => {
            currentBasket.shipments[0].shippingMethod = defaultShippingMethod
            return res(ctx.json(currentBasket))
        }),

        // mock add payment instrument
        rest.post('*/baskets/:basketId/payment-instruments', (req, res, ctx) => {
            currentBasket.paymentInstruments = [
                {
                    amount: 0,
                    paymentCard: {
                        cardType: 'Master Card',
                        creditCardExpired: false,
                        expirationMonth: 1,
                        expirationYear: 2030,
                        holder: 'Test McTester',
                        maskedNumber: '************5454',
                        numberLastDigits: '5454',
                        validFromMonth: 1,
                        validFromYear: 2020
                    },
                    paymentInstrumentId: 'testcard1',
                    paymentMethodId: 'CREDIT_CARD'
                }
            ]
            return res(ctx.json(currentBasket))
        }),

        // mock update address
        rest.patch('*/addresses/savedaddress1', (req, res, ctx) => {
            return res(ctx.json(mockedRegisteredCustomer.addresses[0]))
        }),

        // mock place order
        rest.post('*/orders', (req, res, ctx) => {
            currentBasket = {
                ...scapiOrderResponse,
                customerInfo: {...scapiOrderResponse.customerInfo, email: 'customer@test.com'}
            }
            return res(ctx.json(currentBasket))
        }),

        rest.get('*/baskets', (req, res, ctx) => {
            const baskets = {
                baskets: [currentBasket],
                total: 1
            }
            return res(ctx.json(baskets))
        })
    )
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

test('Renders skeleton until customer and basket are loaded', () => {
    const {getByTestId, queryByTestId} = renderWithProviders(<Checkout />)

    expect(getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
    expect(queryByTestId('sf-checkout-container')).not.toBeInTheDocument()
})

test('Can proceed through checkout steps as guest', async () => {
    // Keep a *deep* copy of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
    let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))

    // Set up additional requests for intercepting/mocking for just this test.
    global.server.use(
        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customerInfo.email = 'test@test.com'
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping and billing address to basket
        rest.put('*/shipping-address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                countryCode: 'US',
                firstName: 'Tester',
                fullName: 'Tester McTesting',
                id: '047b18d4aaaf4138f693a4b931',
                lastName: 'McTesting',
                phone: '(727) 555-1234',
                postalCode: '33610',
                stateCode: 'FL'
            }
            currentBasket.shipments[0].shippingAddress = shippingBillingAddress
            currentBasket.billingAddress = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add billing address to basket
        rest.put('*/billing-address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                countryCode: 'US',
                firstName: 'Tester',
                fullName: 'Tester McTesting',
                id: '047b18d4aaaf4138f693a4b931',
                lastName: 'McTesting',
                phone: '(727) 555-1234',
                postalCode: '33610',
                stateCode: 'FL'
            }
            currentBasket.shipments[0].shippingAddress = shippingBillingAddress
            currentBasket.billingAddress = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping method
        rest.put('*/shipments/me/shipping-method', (req, res, ctx) => {
            currentBasket.shipments[0].shippingMethod = defaultShippingMethod
            return res(ctx.json(currentBasket))
        }),

        // mock add payment instrument
        rest.post('*/baskets/:basketId/payment-instruments', (req, res, ctx) => {
            currentBasket.paymentInstruments = [
                {
                    amount: 0,
                    paymentCard: {
                        cardType: 'Visa',
                        creditCardExpired: false,
                        expirationMonth: 12,
                        expirationYear: 2024,
                        holder: 'Testy McTester',
                        maskedNumber: '************1111',
                        numberLastDigits: '1111',
                        validFromMonth: 1,
                        validFromYear: 2020
                    },
                    paymentInstrumentId: '875cae2724408c9a3eb45715ba',
                    paymentMethodId: 'CREDIT_CARD'
                }
            ]
            return res(ctx.json(currentBasket))
        }),

        // mock place order
        rest.post('*/orders', (req, res, ctx) => {
            currentBasket = {
                ...scapiOrderResponse,
                customerInfo: {...scapiOrderResponse.customerInfo, email: 'test@test.com'}
            }
            return res(ctx.json(currentBasket))
        }),

        rest.get('*/baskets', (req, res, ctx) => {
            const baskets = {
                baskets: [currentBasket],
                total: 1
            }
            return res(ctx.json(baskets))
        })
    )

    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {isGuest: true, siteAlias: 'uk', appConfig: mockConfig.app}
    })

    // Wait for checkout to load and display first step
    await screen.findByText(/checkout as guest/i)

    // Verify cart products display
    await user.click(screen.getByText(/2 items in cart/i))
    expect(await screen.findByText(/Long Sleeve Crew Neck/i)).toBeInTheDocument()

    // Verify password field is reset if customer toggles login form
    const loginToggleButton = screen.getByText(/Already have an account\? Log in/i)
    await user.click(loginToggleButton)
    // Provide customer email and submit
    const passwordInput = document.querySelector('input[type="password"]')
    await user.type(passwordInput, 'Password1!')

    const checkoutAsGuestButton = screen.getByText(/Checkout as guest/i)
    await user.click(checkoutAsGuestButton)

    // Provide customer email and submit
    const emailInput = screen.getByLabelText(/email/i)
    const submitBtn = screen.getByText(/checkout as guest/i)
    await user.type(emailInput, 'test@test.com')
    await user.click(submitBtn)

    // Wait for next step to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
    )

    // Email should be displayed in previous step summary
    expect(screen.getByText('test@test.com')).toBeInTheDocument()

    // Fill out shipping address form and submit
    await user.type(screen.getByLabelText(/first name/i), 'Tester')
    await user.type(screen.getByLabelText(/last name/i), 'McTesting')
    await user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
    await user.type(screen.getByLabelText(/address/i), '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'Tampa')
    await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    await user.type(screen.getByLabelText(/zip code/i), '33610')
    await user.click(screen.getByText(/continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    // Shipping address displayed in previous step summary
    expect(screen.getByText('Tester McTesting')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Tampa, FL 33610')).toBeInTheDocument()
    expect(screen.getByText('US')).toBeInTheDocument()

    // Default shipping option should be selected
    const shippingOptionsForm = screen.getByTestId('sf-checkout-shipping-options-form')

    await waitFor(() =>
        expect(shippingOptionsForm).toHaveFormValues({
            'shipping-options-radiogroup': mockShippingMethods.defaultShippingMethodId
        })
    )

    // Submit selected shipping method
    await user.click(screen.getByText(/continue to payment/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

    // Fill out credit card payment form
    await user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    await user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
    await user.type(screen.getByLabelText(/expiration date/i), '1224')
    await user.type(screen.getByLabelText(/security code/i), '123')

    // Same as shipping checkbox selected by default
    expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

    // Should display billing address that matches shipping address
    const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
    expect(step3Content.getByText('Tester McTesting')).toBeInTheDocument()
    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()
    expect(step3Content.getByText('Tampa, FL 33610')).toBeInTheDocument()
    expect(step3Content.getByText('US')).toBeInTheDocument()

    // Move to final review step
    await user.click(screen.getByText(/review order/i))

    const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn', undefined, {
        timeout: 5000
    })

    // Verify applied payment and billing address
    expect(step3Content.getByText('Visa')).toBeInTheDocument()
    expect(step3Content.getByText('•••• 1111')).toBeInTheDocument()
    expect(step3Content.getByText('12/2024')).toBeInTheDocument()

    expect(step3Content.getByText('Tester McTesting')).toBeInTheDocument()
    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()
    expect(step3Content.getByText('Tampa, FL 33610')).toBeInTheDocument()
    expect(step3Content.getByText('US')).toBeInTheDocument()
    // Place the order
    await user.click(placeOrderBtn)

    // Should now be on our mocked confirmation route/page
    expect(await screen.findByText(/success/i)).toBeInTheDocument()
})

test('Can proceed through checkout as registered customer', async () => {
    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {
            // Not bypassing auth as usual, so we can test the guest-to-registered flow
            bypassAuth: true,
            isGuest: false,
            siteAlias: 'uk',
            locale: {id: 'en-GB'},
            appConfig: mockConfig.app
        }
    })

    // Email should be displayed in previous step summary
    await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument()
    })

    // Select a saved address and continue
    await user.click(screen.getByDisplayValue('savedaddress1'))
    await user.click(screen.getByText(/continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    // Shipping address displayed in previous step summary
    expect(screen.getByText('Test McTester')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()

    // Default shipping option should be selected
    const shippingOptionsForm = screen.getByTestId('sf-checkout-shipping-options-form')
    await waitFor(() =>
        expect(shippingOptionsForm).toHaveFormValues({
            'shipping-options-radiogroup': mockShippingMethods.defaultShippingMethodId
        })
    )

    // Submit selected shipping method
    await user.click(screen.getByText(/continue to payment/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

    // Fill out credit card payment form
    // (we no longer have saved payment methods)
    await user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    await user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
    await user.type(screen.getByLabelText(/expiration date/i), '1224')
    await user.type(screen.getByLabelText(/security code/i), '123')

    // Same as shipping checkbox selected by default
    expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

    // Should display billing address that matches shipping address
    const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Move to final review step
    await user.click(screen.getByText(/review order/i))

    const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn', undefined, {
        timeout: 5000
    })

    // Verify applied payment and billing address
    expect(step3Content.getByText('Master Card')).toBeInTheDocument()
    expect(step3Content.getByText('•••• 5454')).toBeInTheDocument()
    expect(step3Content.getByText('1/2030')).toBeInTheDocument()

    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Place the order
    await user.click(placeOrderBtn)

    // Should now be on our mocked confirmation route/page
    expect(await screen.findByText(/success/i)).toBeInTheDocument()
    document.cookie = ''
})

test('Can edit address during checkout as a registered customer', async () => {
    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {
            // Not bypassing auth as usual, so we can test the guest-to-registered flow
            bypassAuth: true,
            isGuest: false,
            siteAlias: 'uk',
            locale: {id: 'en-GB'},
            appConfig: mockConfig.app
        }
    })

    await waitFor(() => {
        expect(screen.getByTestId('sf-checkout-shipping-address-0')).toBeInTheDocument()
    })

    const firstAddress = screen.getByTestId('sf-checkout-shipping-address-0')
    await user.click(within(firstAddress).getByText(/edit/i))

    // Wait for the edit address form to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-shipping-address-edit-form')).not.toBeEmptyDOMElement()
    )

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()

    // Edit and save the address
    await user.clear(screen.getByLabelText('Address'))
    await user.type(screen.getByLabelText('Address'), '369 Main Street')
    await user.click(screen.getByText(/save & continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    expect(screen.getByText('369 Main Street')).toBeInTheDocument()
})

test('Can add address during checkout as a registered customer', async () => {
    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {
            // Not bypassing auth as usual, so we can test the guest-to-registered flow
            bypassAuth: true,
            isGuest: false,
            siteAlias: 'uk',
            locale: {id: 'en-GB'},
            appConfig: mockConfig.app
        }
    })

    global.server.use(
        rest.post('*/customers/:customerId/addresses', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(req.body))
        })
    )

    await waitFor(() => {
        expect(screen.getByText(/add new address/i)).toBeInTheDocument()
    })
    // Add address
    await user.click(screen.getByText(/add new address/i))

    const firstName = await screen.findByLabelText(/first name/i)
    await user.type(firstName, 'Test2')
    await user.type(screen.getByLabelText(/last name/i), 'McTester')
    await user.type(screen.getByLabelText(/phone/i), '7275551234')
    await user.selectOptions(screen.getByLabelText(/country/i), ['US'])
    await user.type(screen.getByLabelText(/address/i), 'Tropicana Field')
    await user.type(screen.getByLabelText(/city/i), 'Tampa')
    await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    await user.type(screen.getByLabelText(/zip code/i), '33712')

    await user.click(screen.getByText(/save & continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })
})
