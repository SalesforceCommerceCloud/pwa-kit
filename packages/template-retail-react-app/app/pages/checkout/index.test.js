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
import {useMapsLibrary} from '@vis.gl/react-google-maps'

// Mock Google Maps API
jest.mock('@vis.gl/react-google-maps', () => ({
    useMapsLibrary: jest.fn(),
    APIProvider: ({children}) => children
}))

// This is a flaky test file!
jest.retryTimes(5)
jest.setTimeout(40_000)

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
            return res(
                ctx.json({
                    data: [
                        {
                            id: '701643070725M',
                            currency: 'GBP',
                            name: 'Long Sleeve Crew Neck',
                            pricePerUnit: 19.18,
                            price: 19.18,
                            inventory: {
                                stockLevel: 10,
                                orderable: true,
                                backorder: false,
                                preorderable: false
                            }
                        }
                    ]
                })
            )
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
                firstName: 'John',
                fullName: 'John Smith',
                id: '047b18d4aaaf4138f693a4b931',
                lastName: 'Smith',
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
                        expirationYear: 2040,
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
            const response = {
                ...currentBasket,
                ...scapiOrderResponse,
                customerInfo: {...scapiOrderResponse.customerInfo, email: 'customer@test.com'},
                status: 'created'
            }
            return res(ctx.json(response))
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

    // Set the default shipping method in the initial basket state
    currentBasket.shipments[0].shippingMethod = defaultShippingMethod

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
                        expirationMonth: 1,
                        expirationYear: 2040,
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
            const response = {
                ...currentBasket,
                ...scapiOrderResponse,
                customerInfo: {...scapiOrderResponse.customerInfo, email: 'customer@test.com'},
                status: 'created'
            }
            return res(ctx.json(response))
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
    expect(await screen.findByText(/Long Sleeve Crew Neck$/i)).toBeInTheDocument()

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
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
    })

    // Email should be displayed in previous step summary
    expect(screen.getByText('test@test.com')).toBeInTheDocument()

    // Shipping Address Form must be present
    expect(screen.getByLabelText('Shipping Address Form')).toBeInTheDocument()

    // Fill out shipping address form and submit
    await user.type(screen.getByLabelText(/first name/i), 'Tester')
    await user.type(screen.getByLabelText(/last name/i), 'McTesting')
    await user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
    await user.type(screen.getAllByLabelText(/address/i)[0], '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'Tampa')
    await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    await user.type(screen.getByLabelText(/zip code/i), '33610')
    await user.click(screen.getByText(/continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    // Shipping address displayed in previous step summary
    const step1Content = within(screen.getByTestId('sf-toggle-card-step-1-content'))
    expect(step1Content.getByText('Tester McTesting')).toBeInTheDocument()
    expect(step1Content.getByText('123 Main St')).toBeInTheDocument()
    expect(step1Content.getByText('Tampa, FL 33610')).toBeInTheDocument()
    expect(step1Content.getByText('US')).toBeInTheDocument()

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

    // Verify checkout container is present
    expect(screen.getByTestId('sf-checkout-container')).toBeInTheDocument()
    document.cookie = ''
})

test('Can proceed through checkout as registered customer', async () => {
    // Keep a *deep* copy of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
    let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))

    // Set the default shipping method in the initial basket state
    currentBasket.shipments[0].shippingMethod = defaultShippingMethod

    // Set up additional requests for intercepting/mocking for just this test.
    global.server.use(
        // mock add shipping method
        rest.put('*/shipments/me/shipping-method', (req, res, ctx) => {
            currentBasket.shipments[0].shippingMethod = defaultShippingMethod
            return res(ctx.json(currentBasket))
        }),

        // mock add shipping address
        rest.put('*/shipping-address', (req, res, ctx) => {
            const shippingAddress = {
                address1: '123 Main St',
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
            currentBasket.shipments[0].shippingAddress = shippingAddress
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
                        expirationMonth: 1,
                        expirationYear: 2040,
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
            const response = {
                ...currentBasket,
                ...scapiOrderResponse,
                customerInfo: {...scapiOrderResponse.customerInfo, email: 'customer@test.com'},
                status: 'created'
            }
            return res(ctx.json(response))
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
    await waitFor(() => {
        const address = screen.getByDisplayValue('savedaddress1')
        user.click(address)
    })

    // Click continue to proceed to shipping method step
    await user.click(screen.getByText(/continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    // Shipping address displayed in previous step summary
    expect(screen.getAllByText('123 Main St')).toHaveLength(2)

    // Default shipping option should be selected
    expect(screen.getByText('Ground')).toBeInTheDocument()

    // Select the shipping option first
    await user.click(screen.getByText('Ground'))

    // Submit selected shipping method - click the first non-Edit button on the page
    const allButtons = Array.from(document.querySelectorAll('button'))
    const nextButton = allButtons.find((btn) => !/edit/i.test(btn.textContent))
    expect(nextButton).toBeDefined()
    await user.click(nextButton)

    // Verify checkout container is present
    expect(screen.getByTestId('sf-checkout-container')).toBeInTheDocument()
    document.cookie = ''
})

test('Uses google address autocomplete when a platform provided google API key is provided by the shopper configuration API', async () => {
    // Mock Google Maps API and useAutocompleteSuggestions hook
    const mockFetchAutocompleteSuggestions = jest.fn()
    const mockAutocompleteSuggestion = {
        fetchAutocompleteSuggestions: mockFetchAutocompleteSuggestions
    }
    const mockAutocompleteSessionToken = jest.fn()
    const mockPlaces = {
        AutocompleteSessionToken: mockAutocompleteSessionToken,
        AutocompleteSuggestion: mockAutocompleteSuggestion
    }

    useMapsLibrary.mockReturnValue(mockPlaces)

    // Keep a *deep* copy of the initial mocked basket. Our mocked fetch responses will continuously
    // update this object, which essentially mimics a saved basket on the backend.
    let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))

    // Set the default shipping method in the initial basket state
    currentBasket.shipments[0].shippingMethod = defaultShippingMethod

    // Set up additional requests for intercepting/mocking for just this test.
    global.server.use(
        // mock adding guest email to basket
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            currentBasket.customerInfo.email = 'test@test.com'
            return res(ctx.json(currentBasket))
        }),

        rest.get('*/configuration/shopper-configurations/*/configurations', (req, res, ctx) => {
            const configurations = {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    }
                ]
            }
            return res(ctx.json(configurations))
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
                        expirationMonth: 1,
                        expirationYear: 2040,
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
            const response = {
                ...currentBasket,
                ...scapiOrderResponse,
                customerInfo: {...scapiOrderResponse.customerInfo, email: 'customer@test.com'},
                status: 'created'
            }
            return res(ctx.json(response))
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
    expect(await screen.findByText(/Long Sleeve Crew Neck$/i)).toBeInTheDocument()

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
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
    })

    // Email should be displayed in previous step summary
    expect(screen.getByText('test@test.com')).toBeInTheDocument()

    // Shipping Address Form must be present
    expect(screen.getByLabelText('Shipping Address Form')).toBeInTheDocument()

    // Fill out shipping address form and submit
    await user.type(screen.getByLabelText(/first name/i), 'Tester')
    await user.type(screen.getByLabelText(/last name/i), 'McTesting')
    await user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
    await user.type(screen.getAllByLabelText(/address/i)[0], '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'Tampa')
    await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    await user.type(screen.getByLabelText(/zip code/i), '33610')
    await user.click(screen.getByText(/continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        expect(mockFetchAutocompleteSuggestions).toHaveBeenCalled()
    })

    // Shipping address displayed in previous step summary
    const step1Content = within(screen.getByTestId('sf-toggle-card-step-1-content'))
    expect(step1Content.getByText('Tester McTesting')).toBeInTheDocument()
    expect(step1Content.getByText('123 Main St')).toBeInTheDocument()
    expect(step1Content.getByText('Tampa, FL 33610')).toBeInTheDocument()
    expect(step1Content.getByText('US')).toBeInTheDocument()

    // Applied shipping method should be displayed in previous step summary
    expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

    // Verify checkout container is present
    expect(screen.getByTestId('sf-checkout-container')).toBeInTheDocument()
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

    // Shipping Address Form must be present
    expect(screen.getByLabelText('Shipping Address Form')).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()

    // Edit and save the address
    await user.clear(screen.getByLabelText('Address'))
    await user.type(screen.getByLabelText('Address'), '369 Main Street')
    await user.click(screen.getByText(/save & continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })

    const shippingAddressCard = screen.getByTestId('sf-toggle-card-step-1-content')
    expect(within(shippingAddressCard).getByText('369 Main Street')).toBeInTheDocument()
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

    // Shipping Address Form must be present
    expect(screen.getByLabelText('Shipping Address Form')).toBeInTheDocument()

    const firstName = await screen.findByLabelText(/first name/i)
    await user.type(firstName, 'Test2')
    await user.type(screen.getByLabelText(/last name/i), 'McTester')
    await user.type(screen.getByLabelText(/phone/i), '7275551234')
    await user.selectOptions(screen.getByLabelText(/country/i), ['US'])
    await user.type(screen.getAllByLabelText(/address/i)[0], 'Tropicana Field')
    await user.type(screen.getByLabelText(/city/i), 'Tampa')
    await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    await user.type(screen.getByLabelText(/zip code/i), '33712')

    await user.click(screen.getByText(/save & continue to shipping method/i))

    // Wait for next step to render
    await waitFor(() => {
        expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
    })
})

// multi-pickup
test('Should show pickup address section for pickup-only orders', async () => {
    const pickupBasket = {
        ...scapiBasketWithItem,
        shipments: [
            {
                ...scapiBasketWithItem.shipments[0],
                shipmentId: 'shipment-1',
                shippingMethod: {c_storePickupEnabled: true},
                c_fromStoreId: 'store-1'
            }
        ],
        productItems: [
            {
                ...scapiBasketWithItem.productItems[0],
                shipmentId: 'shipment-1'
            }
        ]
    }

    global.server.use(
        rest.get('*/baskets', (req, res, ctx) => {
            const baskets = {
                baskets: [pickupBasket],
                total: 1
            }
            return res(ctx.json(baskets))
        }),
        rest.get('*/stores', (req, res, ctx) => {
            return res(
                ctx.json({
                    data: [
                        {
                            id: 'store-1',
                            name: 'Test Store',
                            address1: '123 Test St',
                            city: 'Test City',
                            stateCode: 'CA',
                            postalCode: '12345',
                            countryCode: 'US',
                            phone: '555-123-4567'
                        }
                    ]
                })
            )
        }),
        rest.delete('*/baskets/:basketId/shipments/:shipmentId', (req, res, ctx) => {
            return res(ctx.json({success: true}))
        })
    )

    const testScenarios = [
        {isGuest: true, description: 'guest'},
        {isGuest: false, description: 'registered'}
    ]

    for (const scenario of testScenarios) {
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {isGuest: scenario.isGuest, siteAlias: 'uk', appConfig: mockConfig.app}
        })

        await waitFor(() => {
            expect(screen.getByTestId('sf-checkout-container')).toBeInTheDocument()
        })
        expect(screen.getByText(/pickup address & information/i)).toBeInTheDocument()
    }
})

test('Should show both pickup and shipping sections for mixed orders', async () => {
    const mixedBasket = {
        ...scapiBasketWithItem,
        shipments: [
            {
                ...scapiBasketWithItem.shipments[0],
                shipmentId: 'shipment-1',
                shippingMethod: {c_storePickupEnabled: true},
                c_fromStoreId: 'store-1'
            },
            {
                ...scapiBasketWithItem.shipments[0],
                shipmentId: 'shipment-2',
                shippingMethod: {c_storePickupEnabled: false}
            }
        ],
        productItems: [
            {
                ...scapiBasketWithItem.productItems[0],
                shipmentId: 'shipment-1'
            },
            {
                ...scapiBasketWithItem.productItems[0],
                itemId: 'item-2',
                shipmentId: 'shipment-2'
            }
        ]
    }

    global.server.use(
        rest.get('*/baskets', (req, res, ctx) => {
            const baskets = {
                baskets: [mixedBasket],
                total: 1
            }
            return res(ctx.json(baskets))
        }),
        rest.get('*/stores', (req, res, ctx) => {
            return res(
                ctx.json({
                    data: [
                        {
                            id: 'store-1',
                            name: 'Test Store',
                            address1: '123 Test St',
                            city: 'Test City',
                            stateCode: 'CA',
                            postalCode: '12345',
                            countryCode: 'US',
                            phone: '555-123-4567'
                        }
                    ]
                })
            )
        }),
        rest.delete('*/baskets/:basketId/shipments/:shipmentId', (req, res, ctx) => {
            return res(ctx.json({success: true}))
        })
    )

    const testScenarios = [
        {isGuest: true, description: 'guest'},
        {isGuest: false, description: 'registered'}
    ]

    for (const scenario of testScenarios) {
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {isGuest: scenario.isGuest, siteAlias: 'uk', appConfig: mockConfig.app}
        })

        await waitFor(() => {
            expect(screen.getByTestId('sf-checkout-container')).toBeInTheDocument()
        })

        expect(screen.getByText(/pickup address & information/i)).toBeInTheDocument()
        expect(screen.getAllByText(/shipping address/i).length).toBeGreaterThan(0)
    }
})
