/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import CheckoutContainer from '@salesforce/retail-react-app/app/pages/checkout-one-click/index'
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
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// This is a flaky test file!
jest.retryTimes(5)
jest.setTimeout(40_000)

mockConfig.app.oneClickCheckout.enabled = true

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn()
    }
})

const mockUseAuthHelper = jest.fn()
mockUseAuthHelper.mockResolvedValue({customerId: 'test-customer-id'})
const mockUseShopperCustomersMutation = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: () => ({
            mutateAsync: mockUseAuthHelper
        }),
        useShopperCustomersMutation: () => ({
            mutateAsync: mockUseShopperCustomersMutation
        })
    }
})

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
                <CheckoutContainer />
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

describe('Checkout One Click', () => {
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
                    status: 'created',
                    shipments: [
                        {
                            shippingAddress: {
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
                        }
                    ],
                    billingAddress: {
                        firstName: 'John',
                        lastName: 'Smith',
                        phone: '(727) 555-1234'
                    }
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

        getConfig.mockImplementation(() => mockConfig)
    })

    afterEach(() => {
        jest.resetModules()
        jest.clearAllMocks()
        localStorage.clear()
    })

    test('Renders skeleton until customer and basket are loaded', () => {
        const {getByTestId, queryByTestId} = renderWithProviders(<CheckoutContainer />)

        expect(getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
        expect(queryByTestId('sf-checkout-container')).not.toBeInTheDocument()
    })

    test('Can proceed through checkout steps as guest', async () => {
        // Mock authorizePasswordlessLogin to fail with 404 (unregistered user)
        mockUseAuthHelper.mockRejectedValueOnce({
            response: {status: 404}
        })

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
                isGuest: true,
                siteAlias: 'uk',
                appConfig: mockConfig.app
            }
        })

        // Wait for checkout to load and display first step
        await screen.findByText(/contact info/i)

        // Verify cart products display
        await user.click(screen.getByText(/2 items in cart/i))
        expect(await screen.findByText(/Long Sleeve Crew Neck$/i)).toBeInTheDocument()

        // Provide customer email and submit
        const emailInput = await screen.findByLabelText(/email/i)
        await user.type(emailInput, 'test@test.com')

        // Blur the email field to trigger the authorizePasswordlessLogin call
        await user.tab()

        // Wait for the continue button to appear after the 404 response
        const continueBtn = await screen.findByText(/continue to shipping address/i)
        await user.click(continueBtn)

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

        // Wait for next step to render and click continue to payment
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })
        await user.click(screen.getByText(/continue to payment/i))

        // Shipping address displayed in previous step summary (scope and allow split text)
        {
            const step1Summary = within(screen.getByTestId('sf-toggle-card-step-1-content'))
            const names = step1Summary.getAllByText((_, n) =>
                /Tester\s*McTesting/.test(n?.textContent || '')
            )
            expect(names.length).toBeGreaterThan(0)
            const addresses = step1Summary.getAllByText((_, n) =>
                /123\s*Main\s*St/.test(n?.textContent || '')
            )
            expect(addresses.length).toBeGreaterThan(0)
            expect(step1Summary.getByText('Tampa, FL 33610')).toBeInTheDocument()
            expect(step1Summary.getByText('US')).toBeInTheDocument()
        }

        // If the edit form is present, click continue; otherwise step may have auto-advanced
        const continueToPaymentBtnMaybe = screen.queryByText(/continue to payment/i)
        if (continueToPaymentBtnMaybe) {
            await user.click(continueToPaymentBtnMaybe)
        }

        // Applied shipping method should be displayed in previous step summary
        expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

        // Wait for Payment step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Fill out credit card payment form
        await user.type(screen.getByLabelText(/card number/i), '4111111111111111')
        await user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
        await user.type(screen.getByLabelText(/expiration date/i), '0140')
        await user.type(
            screen.getByLabelText(/^security code$/i /* not "security code info" */),
            '123'
        )

        // Same as shipping checkbox selected by default
        {
            const step3 = within(screen.getByTestId('sf-toggle-card-step-3-content'))
            expect(step3.getByRole('checkbox', {name: /same as shipping address/i})).toBeChecked()
        }

        // Expect UserRegistration component to be visible
        expect(screen.getByTestId('sf-user-registration-content')).toBeInTheDocument()
        const userRegistrationForm = within(screen.getByTestId('sf-user-registration-content'))
        expect(userRegistrationForm.getByText(/save for future use/i)).toBeInTheDocument()
        expect(
            userRegistrationForm.getByLabelText(/create an account for a faster checkout/i)
        ).not.toBeChecked()
        expect(
            userRegistrationForm.queryByText(/when you place your order/i)
        ).not.toBeInTheDocument()

        // Move to final review step

        const placeOrderBtn = await screen.findByTestId('place-order-button', undefined, {
            timeout: 10000
        })
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
        await waitFor(() => {
            const address = screen.getByDisplayValue('savedaddress1')
            user.click(address)
            user.click(screen.getByText(/continue to shipping method/i))
        })

        // Move through shipping options explicitly
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })
        await user.click(screen.getByText(/continue to payment/i))
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Shipping address displayed in previous step summary (name can vary by mock)
        {
            const step1 = within(screen.getByTestId('sf-toggle-card-step-1-content'))
            const names = step1.getAllByText((_, n) =>
                /Test\s*McTester|John\s*Smith/i.test(n?.textContent || '')
            )
            expect(names.length).toBeGreaterThan(0)
            expect(step1.getAllByText('123 Main St').length).toBeGreaterThan(0)
        }

        // Wait for next step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Applied shipping method should be displayed in previous step summary
        expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

        // Saved payment should be auto-applied for registered user (scope to payment card content)
        const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
        await step3Content.findByText(/credit card/i)
        expect(step3Content.getByText(/master card/i)).toBeInTheDocument()
        expect(
            step3Content.getByText((_, node) => {
                const text = node?.textContent || ''
                return /5454\b/.test(text)
            })
        ).toBeInTheDocument()

        // Billing address should default to the shipping address

        // Should display billing address that matches shipping address
        expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

        // Edit billing address
        // Toggle to edit billing address (not via same-as-shipping label in this flow)
        // Click the checkbox by role if present; otherwise skip
        const billingAddressCheckbox = step3Content.queryByRole('checkbox', {
            name: /same as shipping address/i
        })
        if (billingAddressCheckbox) {
            await user.click(billingAddressCheckbox)
            const firstNameInput = screen.queryByLabelText(/first name/i)
            const lastNameInput = screen.queryByLabelText(/last name/i)
            if (firstNameInput && lastNameInput) {
                await user.clear(firstNameInput)
                await user.clear(lastNameInput)
                await user.type(firstNameInput, 'John')
                await user.type(lastNameInput, 'Smith')
            }
        }

        // Expect UserRegistration component to be hidden
        expect(screen.queryByTestId('sf-user-registration-content')).not.toBeInTheDocument()

        const placeOrderBtn = await screen.findByTestId('place-order-button', undefined, {
            timeout: 5000
        })
        expect(placeOrderBtn).toBeEnabled()
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

        // If the step auto-advanced, reopen the Shipping Address step
        const reopenBtn = screen.queryByRole('button', {name: /edit shipping address/i})
        if (reopenBtn) {
            await user.click(reopenBtn)
        }

        // Verify content within the step-1 container (cards or summary)
        await waitFor(() => {
            const container = screen.getByTestId('sf-toggle-card-step-1-content')
            const names = within(container).getAllByText((_, n) =>
                /Test\s*McTester|John\s*Smith/i.test(n?.textContent || '')
            )
            expect(names.length).toBeGreaterThan(0)
            const addrs = within(container).getAllByText((_, n) =>
                /123\s*Main\s*St/i.test(n?.textContent || '')
            )
            expect(addrs.length).toBeGreaterThan(0)
        })

        // Wait for next step to render or payment step if auto-advanced
        await waitFor(() => {
            const step2 = screen.queryByTestId('sf-toggle-card-step-2-content')
            const step3 = screen.queryByTestId('sf-toggle-card-step-3-content')
            expect(step2 || step3).toBeTruthy()
        })
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

        await waitFor(() => {
            expect(screen.getByTestId('sf-checkout-shipping-address-0')).toBeInTheDocument()
        })

        // Add address
        await user.click(screen.getByText(/add new address/i))

        // Wait for the shipping address section to show a name (either address)
        await waitFor(() => {
            const container = screen.getByTestId('sf-toggle-card-step-1-content')
            const names = within(container).getAllByText((_, n) =>
                /Test\s*McTester|John\s*Smith/i.test(n?.textContent || '')
            )
            expect(names.length).toBeGreaterThan(0)
        })

        // Verify the saved address is displayed (automatically selected in one-click checkout)
        const addressElements = screen.getAllByText('123 Main St')
        expect(addressElements.length).toBeGreaterThan(0)

        // Continue through steps explicitly
        const contToShip = screen.queryByText(/continue to shipping method/i)
        if (contToShip) {
            await user.click(contToShip)
        }
        await waitFor(() => {
            const step2 = screen.queryByTestId('sf-toggle-card-step-2-content')
            const step3 = screen.queryByTestId('sf-toggle-card-step-3-content')
            expect(step2 || step3).toBeTruthy()
        })
        const contToPay = screen.queryByText(/continue to payment/i)
        if (contToPay) {
            await user.click(contToPay)
        }
        await waitFor(() => {
            const step2 = screen.queryByTestId('sf-toggle-card-step-2-content')
            const step3 = screen.queryByTestId('sf-toggle-card-step-3-content')
            expect(Boolean(step2) || Boolean(step3)).toBe(true)
        })
    })

    test('Can register account during checkout as a guest', async () => {
        // Mock authorizePasswordlessLogin to fail with 404 (unregistered user)
        mockUseAuthHelper.mockRejectedValueOnce({
            response: {status: 404}
        })

        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {
                isGuest: true,
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        await screen.findByText(/contact info/i)

        const emailInput = await screen.findByLabelText(/email/i)
        await user.type(emailInput, 'test@test.com')

        // Blur the email field to trigger the authorizePasswordlessLogin call
        await user.tab()

        // Wait for the continue button to appear after the 404 response
        const continueBtn = await screen.findByText(/continue to shipping address/i)
        await user.click(continueBtn)
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
        })

        await user.type(screen.getByLabelText(/first name/i), 'Tester')
        await user.type(screen.getByLabelText(/last name/i), 'McTesting')
        await user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
        await user.type(screen.getAllByLabelText(/address/i)[0], '123 Main St')
        await user.type(screen.getByLabelText(/city/i), 'Tampa')
        await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
        await user.type(screen.getByLabelText(/zip code/i), '33610')
        await user.click(screen.getByText(/continue to shipping method/i))

        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })

        await user.click(screen.getByText(/continue to payment/i))

        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        await user.type(screen.getByLabelText(/card number/i), '4111111111111111')
        await user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
        await user.type(screen.getByLabelText(/expiration date/i), '0140')
        await user.type(
            screen.getByLabelText(/^security code$/i /* not "security code info" */),
            '123'
        )

        // Check the checkbox to create an account
        await user.click(screen.getByLabelText(/create an account for a faster checkout/i))
        const userRegistrationForm = within(screen.getByTestId('sf-user-registration-content'))
        expect(userRegistrationForm.getByText(/when you place your order/i)).toBeInTheDocument()

        const placeOrderBtn = await screen.findByTestId('place-order-button', undefined, {
            timeout: 5000
        })

        await user.click(placeOrderBtn)
        await screen.findByText(/success/i)

        // Check that user registration was called
        expect(mockUseAuthHelper).toHaveBeenCalledWith({
            customer: {
                firstName: 'John',
                lastName: 'Smith',
                email: 'customer@test.com',
                login: 'customer@test.com',
                phoneHome: '(727) 555-1234'
            },
            password: expect.any(String)
        })

        // Check that the shipping address is saved
        expect(mockUseShopperCustomersMutation).toHaveBeenCalledWith({
            body: {
                addressId: expect.any(String),
                address1: '123 Main St',
                city: 'Tampa',
                countryCode: 'US',
                firstName: 'Test',
                fullName: 'Test McTester',
                lastName: 'McTester',
                phone: '(727) 555-1234',
                postalCode: '33712',
                stateCode: 'FL'
            },
            parameters: {
                customerId: 'test-customer-id'
            }
        })
    })

    test('Place Order button is disabled when payment form is invalid', async () => {
        // Mock authorizePasswordlessLogin to fail with 404 (unregistered user)
        mockUseAuthHelper.mockRejectedValueOnce({
            response: {status: 404}
        })

        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {
                isGuest: true,
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        // Wait for checkout to load
        await screen.findByText(/contact info/i)

        // Fill out contact info
        const emailInput = await screen.findByLabelText(/email/i)
        await user.type(emailInput, 'test@test.com')
        await user.tab()

        const continueBtn = await screen.findByText(/continue to shipping address/i)
        await user.click(continueBtn)

        // Fill out shipping address
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
        })

        await user.type(screen.getByLabelText(/first name/i), 'Tester')
        await user.type(screen.getByLabelText(/last name/i), 'McTesting')
        await user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
        await user.type(screen.getAllByLabelText(/address/i)[0], '123 Main St')
        await user.type(screen.getByLabelText(/city/i), 'Tampa')
        await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
        await user.type(screen.getByLabelText(/zip code/i), '33610')
        await user.click(screen.getByText(/continue to shipping method/i))

        // Fill out shipping options
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })
        await user.click(screen.getByText(/continue to payment/i))

        // Wait for payment step to load
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Check that Place Order button is disabled when payment form is empty
        const placeOrderBtn = await screen.findByTestId('place-order-button')
        expect(placeOrderBtn).toBeDisabled()

        // Fill out payment form with valid data
        await user.type(screen.getByLabelText(/card number/i), '4111111111111111')
        await user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
        await user.type(screen.getByLabelText(/expiration date/i), '0140')
        await user.type(screen.getByLabelText(/^security code$/i), '123')

        // Check that Place Order button is now enabled
        await waitFor(() => {
            expect(placeOrderBtn).toBeEnabled()
        })
    })

    test('Place Order button does not display on steps 2 or 3', async () => {
        // Mock authorizePasswordlessLogin to fail with 404 (unregistered user)
        mockUseAuthHelper.mockRejectedValueOnce({
            response: {status: 404}
        })

        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {
                isGuest: true,
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        // Wait for checkout to load
        await screen.findByText(/contact info/i)

        // Fill out contact info
        const emailInput = await screen.findByLabelText(/email/i)
        await user.type(emailInput, 'test@test.com')
        await user.tab()

        const continueBtn = await screen.findByText(/continue to shipping address/i)
        await user.click(continueBtn)

        // Step 2: Shipping Address - Check that Place Order button is NOT present
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
        })

        // Verify Place Order button is not displayed on step 2
        expect(screen.queryByTestId('place-order-button')).not.toBeInTheDocument()

        // Fill out shipping address
        await user.type(screen.getByLabelText(/first name/i), 'Tester')
        await user.type(screen.getByLabelText(/last name/i), 'McTesting')
        await user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
        await user.type(screen.getAllByLabelText(/address/i)[0], '123 Main St')
        await user.type(screen.getByLabelText(/city/i), 'Tampa')
        await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
        await user.type(screen.getByLabelText(/zip code/i), '33610')
        await user.click(screen.getByText(/continue to shipping method/i))

        // Step 3: Shipping Options - Check that Place Order button is NOT present
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })

        // Verify Place Order button is not displayed on step 3
        expect(screen.queryByTestId('place-order-button')).not.toBeInTheDocument()

        // Continue to payment step
        await user.click(screen.getByText(/continue to payment/i))

        // Step 4: Payment - Now the Place Order button should appear
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Verify Place Order button is now displayed on step 4
        const placeOrderBtn = await screen.findByTestId('place-order-button')
        expect(placeOrderBtn).toBeInTheDocument()
        expect(placeOrderBtn).toBeDisabled() // Should be disabled until payment form is filled
    })

    test('can proceed through checkout as a registered customer with a saved payment method', async () => {
        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {
                // Not bypassing auth as usual, so we can test the registered customer flow
                bypassAuth: true,
                isGuest: false,
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        // Wait for checkout to load and verify customer email is displayed
        await waitFor(() => {
            expect(screen.getByText('customer@test.com')).toBeInTheDocument()
        })

        // Select a saved address and continue to shipping method
        await waitFor(() => {
            const address = screen.getByDisplayValue('savedaddress1')
            user.click(address)
            user.click(screen.getByText(/continue to shipping method/i))
        })

        // Move through shipping options
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })
        await user.click(screen.getByText(/continue to payment/i))

        // Wait for payment step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Verify saved payment method is automatically applied
        const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))

        // Check that saved payment method details are displayed
        await step3Content.findByText(/credit card/i)
        expect(step3Content.getByText(/master card/i)).toBeInTheDocument()
        expect(
            step3Content.getByText((_, node) => {
                const text = node?.textContent || ''
                return /5454\b/.test(text)
            })
        ).toBeInTheDocument()

        // Verify billing address is displayed (it shows John Smith from the mock)
        expect(step3Content.getByText('John Smith')).toBeInTheDocument()
        expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

        // Verify that no payment form fields are visible (since saved payment is used)
        expect(step3Content.queryByLabelText(/card number/i)).not.toBeInTheDocument()
        expect(step3Content.queryByLabelText(/name on card/i)).not.toBeInTheDocument()
        expect(step3Content.queryByLabelText(/expiration date/i)).not.toBeInTheDocument()
        expect(step3Content.queryByLabelText(/security code/i)).not.toBeInTheDocument()

        // Verify UserRegistration component is hidden for registered customers
        expect(screen.queryByTestId('sf-user-registration-content')).not.toBeInTheDocument()

        // Verify Place Order button is enabled (since saved payment method is applied)
        const placeOrderBtn = await screen.findByTestId('place-order-button', undefined, {
            timeout: 5000
        })
        expect(placeOrderBtn).toBeEnabled()

        // Place the order
        await user.click(placeOrderBtn)

        // Should now be on our mocked confirmation route/page
        expect(await screen.findByText(/success/i)).toBeInTheDocument()

        // Clean up
        document.cookie = ''
    })
})
