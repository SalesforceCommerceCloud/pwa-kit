/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Checkout from './index'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, waitForElementToBeRemoved, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {renderWithProviders, createPathWithDefaults, setupMockServer} from '../../utils/test-utils'
import useShopper from '../../commerce-api/hooks/useShopper'
import Auth from '../../commerce-api/auth'
import {
    ocapiBasketWithItem,
    ocapiOrderResponse,
    mockShippingMethods,
    mockPaymentMethods,
    mockedGuestCustomer,
    mockedRegisteredCustomer,
    mockedCustomerProductLists,
    productsResponse
} from '../../commerce-api/mock-data'
import mockConfig from '../../../config/mocks/default'

jest.setTimeout(60000)

jest.mock('../../commerce-api/einstein')

// Make sure fetch is defined in test env
Object.defineProperty(window, 'fetch', {
    value: require('cross-fetch')
})

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true),
        createGetTokenBody: jest.fn().mockReturnValue({
            grantType: 'test',
            code: 'test',
            usid: 'test',
            codeVerifier: 'test',
            redirectUri: 'http://localhost/test'
        })
    }
})

jest.mock('../../commerce-api/pkce', () => {
    return {
        createCodeVerifier: jest.fn().mockReturnValue('codeverifier'),
        generateCodeChallenge: jest.fn().mockReturnValue('codechallenge')
    }
})

const {keysToCamel} = jest.requireActual('../../commerce-api/utils')

// This is our wrapped component for testing. It handles initialization of the customer
// and basket the same way it would be when rendered in the real app. We also set up
// fake routes to simulate moving from checkout to confirmation page.
const WrappedCheckout = () => {
    useShopper()
    return (
        <Switch>
            <Route exact path={createPathWithDefaults('/checkout')}>
                <Checkout />
            </Route>
            <Route exact path={createPathWithDefaults('/checkout/confirmation')}>
                <div>success</div>
            </Route>
        </Switch>
    )
}

// Set up the msw server to intercept fetch requests and returned mocked results. Additional
// interceptors can be defined in each test for specific requests.
const server = setupMockServer(
    // mock empty guest basket
    rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
        return res(
            ctx.json({
                baskets: [keysToCamel(ocapiBasketWithItem)]
            })
        )
    }),

    // mock product variant detail
    rest.get('*/products', (req, res, ctx) => {
        return res(ctx.json(productsResponse))
    }),

    // mock available shipping methods
    rest.get('*/shipments/me/shipping_methods', (req, res, ctx) => {
        return res(ctx.json(mockShippingMethods))
    }),

    // mock available payment methods
    rest.get('*/baskets/:basketId/payment_methods', (req, res, ctx) => {
        return res(ctx.json(mockPaymentMethods))
    }),

    // mock product details
    rest.get('*/products', (req, res, ctx) => {
        return res(ctx.json({data: [{id: '701642811398M'}]}))
    }),

    rest.get('*/customers/:customerId', (req, res, ctx) => {
        return res(
            ctx.delay(0),
            ctx.status(200),
            ctx.json({
                authType: 'guest',
                preferredLocale: 'en_US',
                ...mockedRegisteredCustomer,
                // Mocked customer ID should match the mocked basket's customer ID as
                // it would with real usage, otherwise, the useShopper hook will detect
                // the mismatch and attempt to refetch a new basket for the customer.
                customerId: ocapiBasketWithItem.customer_info.customer_id
            })
        )
    })
)

// Set up and clean up
beforeAll(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Renders skeleton until customer and basket are loaded', () => {
    const {getByTestId, queryByTestId} = renderWithProviders(<Checkout />)

    expect(getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
    expect(queryByTestId('sf-checkout-container')).not.toBeInTheDocument()
})

test('Can proceed through checkout steps as guest', async () => {
    // Keep a *deep* copy of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
    let currentBasket = JSON.parse(JSON.stringify(ocapiBasketWithItem))

    jest.spyOn(Auth.prototype, 'login').mockReturnValue(mockedGuestCustomer)

    // Set up additional requests for intercepting/mocking for just this test.
    server.use(
        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customer_info.email = 'test@test.com'
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping and billing address to basket
        rest.put('*/shipping_address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                country_code: 'US',
                first_name: 'Tester',
                full_name: 'Tester McTesting',
                id: '047b18d4aaaf4138f693a4b931',
                last_name: 'McTesting',
                phone: '(727) 555-1234',
                postal_code: '33610',
                state_code: 'FL',
                _type: 'order_address'
            }
            currentBasket.shipments[0].shipping_address = shippingBillingAddress
            currentBasket.billing_address = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add billing address to basket
        rest.put('*/billing_address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                country_code: 'US',
                first_name: 'Tester',
                full_name: 'Tester McTesting',
                id: '047b18d4aaaf4138f693a4b931',
                last_name: 'McTesting',
                phone: '(727) 555-1234',
                postal_code: '33610',
                state_code: 'FL',
                _type: 'order_address'
            }
            currentBasket.shipments[0].shipping_address = shippingBillingAddress
            currentBasket.billing_address = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping method
        rest.put('*/shipments/me/shipping_method', (req, res, ctx) => {
            currentBasket.shipments[0].shipping_method =
                mockShippingMethods.applicable_shipping_methods[0]
            return res(ctx.json(currentBasket))
        }),

        // mock add payment instrument
        rest.post('*/baskets/:basketId/payment_instruments', (req, res, ctx) => {
            currentBasket.payment_instruments = [
                {
                    amount: 0,
                    payment_card: {
                        card_type: 'Visa',
                        credit_card_expired: false,
                        expiration_month: 12,
                        expiration_year: 2024,
                        holder: 'Testy McTester',
                        masked_number: '************1111',
                        number_last_digits: '1111',
                        valid_from_month: 1,
                        valid_from_year: 2020,
                        _type: 'payment_card'
                    },
                    payment_instrument_id: '875cae2724408c9a3eb45715ba',
                    payment_method_id: 'CREDIT_CARD',
                    _type: 'order_payment_instrument'
                }
            ]
            return res(ctx.json(currentBasket))
        }),

        // mock place order
        rest.post('*/orders', (req, res, ctx) => {
            currentBasket = {
                ...ocapiOrderResponse,
                customer_info: {...ocapiOrderResponse.customer_info, email: 'test@test.com'}
            }
            return res(ctx.json(currentBasket))
        })
    )

    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
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
            'shipping-options-radiogroup': 'DefaultShippingMethod'
        })
    )

    // Submit selected shipping method
    user.click(screen.getByText(/continue to payment/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText('Default Shipping Method')).toBeInTheDocument()

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

    const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn')

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

test('Can proceed through checkout as registered customer', async () => {
    // Keep a *deep* of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
    let currentBasket = JSON.parse(JSON.stringify(ocapiBasketWithItem))

    jest.spyOn(Auth.prototype, 'login').mockReturnValue(mockedRegisteredCustomer)

    // Set up additional requests for intercepting/mocking for just this test.
    server.use(
        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customer_info.email = 'customer@test.com'
            return res(ctx.json(currentBasket))
        }),

        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        }),

        // mock add shipping and billing address to basket
        rest.put('*/shipping_address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                country_code: 'US',
                first_name: 'Test',
                full_name: 'Test McTester',
                id: '047b18d4aaaf4138f693a4b931',
                last_name: 'McTester',
                phone: '(727) 555-1234',
                postal_code: '33712',
                state_code: 'FL',
                _type: 'order_address'
            }
            currentBasket.shipments[0].shipping_address = shippingBillingAddress
            currentBasket.billing_address = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add billing address to basket
        rest.put('*/billing_address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                country_code: 'US',
                first_name: 'Test',
                full_name: 'Test McTester',
                id: '047b18d4aaaf4138f693a4b931',
                last_name: 'McTester',
                phone: '(727) 555-1234',
                postal_code: '33712',
                state_code: 'FL',
                _type: 'order_address'
            }
            currentBasket.shipments[0].shipping_address = shippingBillingAddress
            currentBasket.billing_address = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping method
        rest.put('*/shipments/me/shipping_method', (req, res, ctx) => {
            currentBasket.shipments[0].shipping_method =
                mockShippingMethods.applicable_shipping_methods[0]
            return res(ctx.json(currentBasket))
        }),

        // mock add payment instrument
        rest.post('*/baskets/:basketId/payment_instruments', (req, res, ctx) => {
            currentBasket.payment_instruments = [
                {
                    amount: 0,
                    payment_card: {
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
                    payment_instrument_id: 'testcard1',
                    payment_method_id: 'CREDIT_CARD',
                    _type: 'order_payment_instrument'
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
                ...ocapiOrderResponse,
                customer_info: {...ocapiOrderResponse.customer_info, email: 'customer@test.com'}
            }
            return res(ctx.json(currentBasket))
        })
    )

    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}, appConfig: mockConfig.app}
    })

    // Switch to login
    const haveAccountButton = await screen.findByText(/already have an account/i)
    user.click(haveAccountButton)

    // Wait for checkout to load and display first step
    const loginBtn = await screen.findByText(/log in/i)

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

    // Email should be displayed in previous step summary
    expect(screen.getByText('customer@test.com')).toBeInTheDocument()

    // Select a saved address and continue
    user.click(screen.getByDisplayValue('savedaddress1'))
    user.click(screen.getByText(/continue to shipping method/i))

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
            'shipping-options-radiogroup': 'DefaultShippingMethod'
        })
    )

    // Submit selected shipping method
    user.click(screen.getByText(/continue to payment/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText('Default Shipping Method')).toBeInTheDocument()

    // Select a saved card
    user.click(screen.getByDisplayValue('testcard1'))

    // Same as shipping checkbox selected by default
    expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

    // Should display billing address that matches shipping address
    const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Move to final review step
    user.click(screen.getByText(/review order/i))

    const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn')

    // Verify applied payment and billing address
    expect(step3Content.getByText('Master Card')).toBeInTheDocument()
    expect(step3Content.getByText('•••• 5454')).toBeInTheDocument()
    expect(step3Content.getByText('1/2030')).toBeInTheDocument()

    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Place the order
    user.click(placeOrderBtn)

    await waitFor(() => {
        expect(window.location.pathname).toEqual('/uk/en-GB/checkout/confirmation')
    })
})

test('Can edit address during checkout as a registered customer', async () => {
    // Keep a *deep* of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
    let currentBasket = JSON.parse(JSON.stringify(ocapiBasketWithItem))

    jest.spyOn(Auth.prototype, 'login').mockReturnValue(mockedRegisteredCustomer)

    // Set up additional requests for intercepting/mocking for just this test.
    server.use(
        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        }),

        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customer_info.email = 'customer@test.com'
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping and billing address to basket
        rest.put('*/shipping_address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: req.body.address1,
                city: 'Tampa',
                country_code: 'US',
                first_name: 'Test',
                full_name: 'Test McTester',
                id: '047b18d4aaaf4138f693a4b931',
                last_name: 'McTester',
                phone: '(727) 555-1234',
                postal_code: '33712',
                state_code: 'FL',
                _type: 'order_address'
            }
            currentBasket.shipments[0].shipping_address = shippingBillingAddress
            currentBasket.billing_address = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        // mock update address
        rest.patch('*/addresses/savedaddress1', (req, res, ctx) => {
            return res(ctx.json(mockedRegisteredCustomer.addresses[0]))
        })
    )

    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })

    // Switch to login
    const haveAccountButton = await screen.findByText(/already have an account/i)
    user.click(haveAccountButton)

    // Wait for checkout to load and display first step
    const loginBtn = await screen.findByText(/log in/i)

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

    const firstAddress = screen.getByTestId('sf-checkout-shipping-address-0')
    user.click(within(firstAddress).getByRole('button', {name: /edit/i}))

    // Wait for the edit address form to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-shipping-address-edit-form')).not.toBeEmptyDOMElement()
    )

    expect(screen.getByRole('textbox', {name: /first name/i})).toBeInTheDocument()

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

test('Can add address during checkout as a registered customer', async () => {
    // Keep a *deep* of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
    let currentBasket = JSON.parse(JSON.stringify(ocapiBasketWithItem))

    jest.spyOn(Auth.prototype, 'login').mockReturnValue(mockedRegisteredCustomer)

    // Set up additional requests for intercepting/mocking for just this test.
    server.use(
        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customer_info.email = 'customer@test.com'
            return res(ctx.json(currentBasket))
        }),

        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        }),

        // mock add shipping and billing address to basket
        rest.put('*/shipping_address', (req, res, ctx) => {
            const shippingBillingAddress = {
                address1: req.body.address1,
                city: req.body.city,
                country_code: req.body.country_code,
                first_name: req.body.first_name,
                full_name: `${req.body.first_name} ${req.body.last_name}`,
                id: req.id,
                last_name: req.body.last_name,
                phone: req.body.phone,
                postal_code: req.body.postal_code,
                state_code: req.body.state_code,
                _type: 'order_address'
            }
            currentBasket.shipments[0].shipping_address = shippingBillingAddress
            currentBasket.billing_address = shippingBillingAddress
            return res(ctx.json(currentBasket))
        }),

        rest.post('*/customers/:customerId/addresses', (req, res, ctx) => {
            return res(
                ctx.json({
                    address1: 'Tropicana Field',
                    addressId: 'savedaddress1',
                    city: 'Tampa',
                    countryCode: 'US',
                    firstName: 'Test2',
                    fullName: 'Test2 McTester',
                    lastName: 'McTester',
                    phone: '(727) 555-1234',
                    postalCode: '33712',
                    preferred: false,
                    stateCode: 'FL'
                })
            )
        })
    )

    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
    renderWithProviders(<WrappedCheckout history={history} />, {
        wrapperProps: {siteAlias: 'us', locale: {id: 'en-US'}}
    })

    // Switch to login
    const haveAccountButton = await screen.findByText(/already have an account/i)
    user.click(haveAccountButton)

    // Wait for checkout to load and display first step
    const loginBtn = await screen.findByText(/log in/i)

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

    // Add address
    user.click(screen.getByRole('button', {name: /add new address/i}))
    user.type(screen.getByRole('textbox', {name: /first name/i}), 'Test2')
    user.type(screen.getByRole('textbox', {name: /last name/i}), 'McTester')
    user.type(screen.getByRole('textbox', {name: /phone/i}), '7275551234')
    user.selectOptions(screen.getByRole('combobox', {name: /country/i}), ['US'])
    user.type(screen.getByRole('textbox', {name: /address/i}), 'Tropicana Field')
    user.type(screen.getByRole('textbox', {name: /city/i}), 'Tampa')
    user.selectOptions(screen.getByRole('combobox', {name: /state/i}), ['FL'])
    user.type(screen.getByRole('textbox', {name: /zip code/i}), '33712')

    user.click(screen.getByRole('button', {name: /save & continue to shipping method/i}))

    // Wait for spinner to render and be removed
    await waitFor(() => {
        expect(screen.getByTestId(/loading/i)).not.toBeEmptyDOMElement()
        waitForElementToBeRemoved(() => screen.getAllByTestId(/loading/i))
    })

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    await waitFor(async () => {
        expect(await screen.findByText(/test2 mctester/i)).toBeInTheDocument()
    })
})
