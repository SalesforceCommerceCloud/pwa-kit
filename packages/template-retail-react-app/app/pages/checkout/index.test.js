/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Checkout from './index'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults,
    registerUserToken
} from '../../utils/test-utils'
import {
    scapiBasketWithItem,
    mockShippingMethods,
    mockedRegisteredCustomer,
    mockedCustomerProductLists
} from '../../mocks/mock-data'
import mockConfig from '../../../config/mocks/default'

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
    renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {isGuest: true, siteAlias: 'uk', appConfig: mockConfig.app}
    })

    // Wait for checkout to load and display first step
    await screen.findByText(/checkout as guest/i)

    // Verify cart products display
    user.click(screen.getByText(/2 items in cart/i))
    expect(await screen.findByText(/Long Sleeve Crew Neck/i)).toBeInTheDocument

    // Provide customer email and submit
    const emailInput = screen.getByLabelText(/email/i)
    const submitBtn = screen.getByText(/checkout as guest/i)
    user.type(emailInput, 'test@test.com')
    user.click(submitBtn)

    // Wait for next step to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
    )

    // Email should be displayed in previous step summary
    expect(screen.getByText('test@test.com')).toBeInTheDocument()

    // Fill out shipping address form and submit
    user.type(screen.getByLabelText(/first name/i), 'Tester')
    user.type(screen.getByLabelText(/last name/i), 'McTesting')
    user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
    user.type(screen.getByLabelText(/address/i), '123 Main St')
    user.type(screen.getByLabelText(/city/i), 'Tampa')
    user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    user.type(screen.getByLabelText(/zip code/i), '33610')
    user.click(screen.getByText(/continue to shipping method/i))

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
    user.click(screen.getByText(/continue to payment/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

    // Fill out credit card payment form
    user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
    user.type(screen.getByLabelText(/expiration date/i), '1224')
    user.type(screen.getByLabelText(/security code/i), '123')

    // Same as shipping checkbox selected by default
    expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

    // Should display billing address that matches shipping address
    const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
    expect(step3Content.getByText('Tester McTesting')).toBeInTheDocument()
    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()
    expect(step3Content.getByText('Tampa, FL 33610')).toBeInTheDocument()
    expect(step3Content.getByText('US')).toBeInTheDocument()

    // Move to final review step
    user.click(screen.getByText(/review order/i))

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
    user.click(placeOrderBtn)

    // Should now be on our mocked confirmation route/page
    expect(await screen.findByText(/success/i)).toBeInTheDocument()
})

test.skip('Can proceed through checkout as registered customer', async () => {
    await logInDuringCheckout()

    // Email should be displayed in previous step summary
    expect(screen.getByText('customer@test.com')).toBeInTheDocument()

    // Select a saved address and continue
    user.click(screen.getByDisplayValue('savedaddress1'))
    user.click(screen.getByText(/continue to shipping method/i))

    screen.logTestingPlaygroundURL()

    // Wait for next step to render
    await waitFor(
        () => {
            // TODO
            const content = screen.getByTestId('sf-toggle-card-step-2-content')
            // console.log('--- content', content)
            expect(content).not.toBeEmptyDOMElement()
        },
        {timeout: 10000}
    )

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
    user.click(screen.getByText(/continue to payment/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

    // Fill out credit card payment form
    // (we no longer have saved payment methods)
    user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
    user.type(screen.getByLabelText(/expiration date/i), '1224')
    user.type(screen.getByLabelText(/security code/i), '123')

    // Same as shipping checkbox selected by default
    expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

    // Should display billing address that matches shipping address
    const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Move to final review step
    user.click(screen.getByText(/review order/i))

    const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn', undefined, {
        timeout: 5000
    })

    // Verify applied payment and billing address
    expect(step3Content.getByText('Master Card')).toBeInTheDocument()
    expect(step3Content.getByText('•••• 5454')).toBeInTheDocument()
    expect(step3Content.getByText('1/2030')).toBeInTheDocument()

    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Place the order
    user.click(placeOrderBtn)

    // Should now be on our mocked confirmation route/page
    expect(await screen.findByText(/success/i)).toBeInTheDocument()
})

test('Can edit address during checkout as a registered customer', async () => {
    await logInDuringCheckout()

    const firstAddress = screen.getByTestId('sf-checkout-shipping-address-0')
    user.click(within(firstAddress).getByText(/edit/i))

    // Wait for the edit address form to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-shipping-address-edit-form')).not.toBeEmptyDOMElement()
    )

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()

    // Edit and save the address
    user.clear(screen.getByLabelText('Address'))
    user.type(screen.getByLabelText('Address'), '369 Main Street')
    user.click(screen.getByText(/save & continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    expect(screen.getByText('369 Main Street')).toBeInTheDocument()
})

test.skip('Can add address during checkout as a registered customer', async () => {
    await logInDuringCheckout()

    global.server.use(
        rest.post('*/customers/:customerId/addresses', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(req.body))
        })
    )

    // Add address
    // TODO
    screen.logTestingPlaygroundURL()
    user.click(screen.getByText(/add new address/i))

    const firstName = await screen.findByLabelText(/first name/i)
    user.type(firstName, 'Test2')
    user.type(screen.getByLabelText(/last name/i), 'McTester')
    user.type(screen.getByLabelText(/phone/i), '7275551234')
    user.selectOptions(screen.getByLabelText(/country/i), ['US'])
    user.type(screen.getByLabelText(/address/i), 'Tropicana Field')
    user.type(screen.getByLabelText(/city/i), 'Tampa')
    user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    user.type(screen.getByLabelText(/zip code/i), '33712')

    user.click(screen.getByText(/save & continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })
})

const logInDuringCheckout = async () => {
    // Keep a *deep* of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
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

    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {
            // Not bypassing auth as usual, so we can test the guest-to-registered flow
            bypassAuth: false,
            siteAlias: 'uk',
            locale: {id: 'en-GB'},
            appConfig: mockConfig.app
        }
    })

    // Switch to login
    const haveAccountButton = await screen.findByText(/already have an account/i)
    user.click(haveAccountButton)

    // Wait for checkout to load and display first step
    const loginBtn = await screen.findByText(/log in/i)

    // Planning to log in
    global.server.use(
        rest.post('*/oauth2/token', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'customerid_1',
                    access_token: registerUserToken,
                    refresh_token: 'testrefeshtoken_1',
                    usid: 'testusid_1',
                    enc_user_id: 'testEncUserId_1',
                    id_token: 'testIdToken_1'
                })
            )
        })
    )

    // Provide customer email and submit
    const emailInput = screen.getByLabelText('Email')
    const pwInput = screen.getByLabelText('Password')
    user.type(emailInput, 'customer@test.com')
    user.type(pwInput, 'Password!1')
    user.click(loginBtn)

    // Wait for next step to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
    )
}
