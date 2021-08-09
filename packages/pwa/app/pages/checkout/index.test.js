import React from 'react'
import Checkout from './index'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {renderWithProviders} from '../../utils/test-utils'
import useShopper from '../../commerce-api/hooks/useShopper'
import {
    ocapiBasketWithItem,
    ocapiOrderResponse,
    exampleTokenReponse,
    shippingMethodsResponse,
    mockPaymentMethods,
    mockedRegisteredCustomer,
    productsResponse
} from '../../commerce-api/mock-data'

// Make sure fetch is defined in test env
Object.defineProperty(window, 'fetch', {
    value: require('node-fetch')
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
            <Route exact path="/en/checkout">
                <Checkout />
            </Route>
            <Route exact path="/en/checkout/confirmation">
                <div>success</div>
            </Route>
        </Switch>
    )
}

// Set up the msw server to intercept fetch requests and returned mocked results. Additional
// interceptors can be defined in each test for specific requests.
const server = setupServer(
    // mock guest login
    rest.post('*/customers/actions/login', (req, res, ctx) => {
        return res(
            ctx.set('authorization', `Bearer ${exampleTokenReponse.access_token}`),
            ctx.json({
                authType: 'guest',
                preferredLocale: 'en_US',
                // Mocked customer ID should match the mocked basket's customer ID as
                // it would with real usage, otherwise, the useShopper hook will detect
                // the mismatch and attempt to refetch a new basket for the customer.
                customerId: ocapiBasketWithItem.customer_info.customer_id
            })
        )
    }),

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
        return res(ctx.json(shippingMethodsResponse))
    }),

    // mock available payment methods
    rest.get('*/baskets/:basketId/payment_methods', (req, res, ctx) => {
        return res(ctx.json(mockPaymentMethods))
    }),

    // mock product details
    rest.get('*/products', (req, res, ctx) => {
        return res(ctx.json({data: [{id: '701642811398M'}]}))
    })
)

// Set up and clean up
beforeAll(() => server.listen())
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
                shippingMethodsResponse.applicable_shipping_methods[0]
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
    window.history.pushState({}, 'Checkout', '/en/checkout')
    renderWithProviders(<WrappedCheckout history={history} />)

    // Wait for checkout to load and display first step
    const guestCheckoutBtn = await screen.findByText(/checkout as guest/i)

    // Verify cart products display
    user.click(screen.getByText(/2 items in cart/i))
    expect(await screen.findByText(/Long Sleeve Crew Neck/i)).toBeInTheDocument

    // Switch to guest checkout
    user.click(guestCheckoutBtn)

    // Provide customer email and submit
    const emailInput = screen.getByLabelText(/email/i)
    const submitBtn = screen.getByText(/checkout as guest/i)
    user.type(emailInput, 'test@test.com')
    user.click(submitBtn)

    // Wait for next step to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-checkout-section-step-1-content')).not.toBeEmptyDOMElement()
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
    user.click(screen.getByText(/continue to shipping options/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-checkout-section-step-2-content')).not.toBeEmptyDOMElement()
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
        expect(screen.getByTestId('sf-checkout-section-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText('Default Shipping Method')).toBeInTheDocument()

    // Fill out credit card payment form
    user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
    user.type(screen.getByLabelText(/expiry date/i), '1224')
    user.type(screen.getByLabelText(/security code/i), '123')

    // Same as shipping checkbox selected by default
    expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

    // Should display billing address that matches shipping address
    const step3Content = within(screen.getByTestId('sf-checkout-section-step-3-content'))
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

    // Set up additional requests for intercepting/mocking for just this test.
    server.use(
        // Mock oauth login callback request
        rest.post('*/oauth2/login', (req, res, ctx) => {
            return res(ctx.status(303), ctx.set('location', `/callback`))
        }),

        rest.get('*/callback', (req, res, ctx) => {
            return res(ctx.status(200))
        }),

        rest.post('*/oauth2/token', (req, res, ctx) => {
            return res(
                ctx.json({
                    customer_id: 'test',
                    access_token: 'testtoken',
                    refresh_token: 'testrefeshtoken'
                })
            )
        }),

        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(
                ctx.json({
                    ...mockedRegisteredCustomer,
                    // Mocked customer ID should match the mocked basket's customer ID as
                    // it would with real usage, otherwise, the useShopper hook will detect
                    // the mismatch and attempt to refetch a new basket for the customer.
                    customerId: ocapiBasketWithItem.customer_info.customer_id
                })
            )
        }),

        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customer_info.email = 'darek@test.com'
            return res(ctx.json(currentBasket))
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
                shippingMethodsResponse.applicable_shipping_methods[0]
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
                        expirationYear: 2022,
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

        // mock place order
        rest.post('*/orders', (req, res, ctx) => {
            currentBasket = {
                ...ocapiOrderResponse,
                customer_info: {...ocapiOrderResponse.customer_info, email: 'darek@test.com'}
            }
            return res(ctx.json(currentBasket))
        })
    )

    // Set the initial browser router path and render our component tree.
    window.history.pushState({}, 'Checkout', '/en/checkout')
    renderWithProviders(<WrappedCheckout history={history} />)

    // Wait for checkout to load and display first step
    const loginBtn = await screen.findByText(/log in/i)

    // Provide customer email and submit
    const emailInput = screen.getByLabelText('Email')
    const pwInput = screen.getByLabelText('Password')
    user.type(emailInput, 'darek@test.com')
    user.type(pwInput, 'Password!1')
    user.click(loginBtn)

    // Wait for next step to render
    await waitFor(() =>
        expect(screen.getByTestId('sf-checkout-section-step-1-content')).not.toBeEmptyDOMElement()
    )

    // Email should be displayed in previous step summary
    expect(screen.getByText('darek@test.com')).toBeInTheDocument()

    // Select a saved address and continue
    user.click(screen.getByDisplayValue('savedaddress1'))
    user.click(screen.getByText(/continue to shipping options/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-checkout-section-step-2-content')).not.toBeEmptyDOMElement()
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
        expect(screen.getByTestId('sf-checkout-section-step-3-content')).not.toBeEmptyDOMElement()
    })

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText('Default Shipping Method')).toBeInTheDocument()

    // Select a saved card
    user.click(screen.getByDisplayValue('testcard1'))

    // Same as shipping checkbox selected by default
    expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

    // Should display billing address that matches shipping address
    const step3Content = within(screen.getByTestId('sf-checkout-section-step-3-content'))
    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Move to final review step
    user.click(screen.getByText(/review order/i))

    const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn')

    // Verify applied payment and billing address
    expect(step3Content.getByText('Master Card')).toBeInTheDocument()
    expect(step3Content.getByText('•••• 5454')).toBeInTheDocument()
    expect(step3Content.getByText('1/2022')).toBeInTheDocument()

    expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

    // Place the order
    user.click(placeOrderBtn)

    await waitFor(() => {
        expect(window.location.pathname).toEqual('/en/checkout/confirmation')
    })
})
