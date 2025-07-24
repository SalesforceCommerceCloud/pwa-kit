/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Checkout from '../../pages/checkout/index'
import {Route, Switch} from 'react-router-dom'
import {act, screen, waitFor, within, fireEvent} from '@testing-library/react'

import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import {
    scapiBasketWithItem,
    mockShippingMethods,
    mockedRegisteredCustomer,
    mockedCustomerProductLists
} from '../../../mocks/mock-data'
import mockConfig from '../../../config/mocks/mock-config'
import {prependHandlersToServer} from '../../../jest-setup'

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
    prependHandlersToServer([
        {
            path: '*/products',
            method: 'get',
            status: 200,
            delay: 0,
            res: () => ({
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
        },
        {
            path: '*/shipments/me/shipping-methods',
            method: 'get',
            status: 200,
            delay: 0,
            res: () => mockShippingMethods
        }
    ])
})
afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.restoreAllMocks()
    localStorage.clear()
})

test('Renders skeleton until customer and basket are loaded', () => {
    const {getByTestId, queryByTestId} = renderWithProviders(<Checkout />)

    expect(getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
    expect(queryByTestId('sf-checkout-container')).not.toBeInTheDocument()
})

describe('Checkout happy path', () => {
    test('Can proceed through checkout steps as guest', async () => {
        // Keep a *deep* copy of the initial mocked basket. Our mocked fetch responses will continuously
        // update this object, which essentially mimics a saved basket on the backend.
        let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))
        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        // Set up additional requests for intercepting/mocking for just this test.
        prependHandlersToServer([
            {
                path: '*/baskets/:basketId/customer',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
                    currentBasket.customerInfo.email = 'test@test.com'
                    return currentBasket
                }
            },
            {
                path: '*/shipping-address',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
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
                    return currentBasket
                }
            },
            {
                path: '*/billing-address',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
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
                    return currentBasket
                }
            },
            {
                path: '*/shipments/me/shipping-method',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
                    currentBasket.shipments[0].shippingMethod = defaultShippingMethod
                    return currentBasket
                }
            },
            {
                path: '*/baskets/:basketId/payment-instruments',
                method: 'post',
                status: 200,
                delay: 0,
                res: () => {
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
                    return currentBasket
                }
            },
            {
                path: '*/orders',
                method: 'post',
                status: 200,
                delay: 0,
                res: () => {
                    const response = {
                        ...currentBasket,
                        ...scapiOrderResponse,
                        customerInfo: {
                            ...scapiOrderResponse.customerInfo,
                            email: 'customer@test.com'
                        },
                        status: 'created'
                    }
                    return response
                }
            },
            {
                path: '*/baskets',
                method: 'get',
                status: 200,
                delay: 0,
                res: () => ({
                    baskets: [currentBasket],
                    total: 1
                })
            }
        ])

        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {isGuest: true, siteAlias: 'uk', config: mockConfig}
        })

        // Wait for checkout to load and display first step
        await screen.findByText(/checkout as guest/i)

        await act(async () => {
            // Verify cart products display
            await user.click(screen.getByText(/2 items in cart/i))
        })
        expect(await screen.findByText(/Long Sleeve Crew Neck$/i)).toBeInTheDocument()

        // Verify password field is reset if customer toggles login form
        const loginToggleButton = screen.getByText(/Already have an account\? Log in/i)
        await act(async () => {
            await user.click(loginToggleButton)
        })
        // Provide customer email and submit
        const passwordInput = document.querySelector('input[type="password"]')
        await act(async () => {
            await user.type(passwordInput, 'Password1!')
        })

        const checkoutAsGuestButton = screen.getByText(/Checkout as guest/i)
        await act(async () => {
            await user.click(checkoutAsGuestButton)
        })

        // Provide customer email and submit
        const emailInput = screen.getByLabelText(/email/i)
        const submitBtn = screen.getByText(/checkout as guest/i)
        await act(async () => {
            await user.type(emailInput, 'test@test.com')
            await user.click(submitBtn)
        })

        // Wait for next step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-1-content')).not.toBeEmptyDOMElement()
        })

        // Email should be displayed in previous step summary
        expect(screen.getByText('test@test.com')).toBeInTheDocument()

        // Shipping Address Form must be present
        expect(screen.getByLabelText('Shipping Address Form')).toBeInTheDocument()

        await act(async () => {
            // Fill out shipping address form and submit
            await user.type(screen.getByLabelText(/first name/i), 'Tester')
            await user.type(screen.getByLabelText(/last name/i), 'McTesting')
            await user.type(screen.getByLabelText(/phone/i), '(727) 555-1234')
            await user.type(screen.getAllByLabelText(/address/i)[0], '123 Main St')
            await user.type(screen.getByLabelText(/city/i), 'Tampa')
            await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
            await user.type(screen.getByLabelText(/zip code/i), '33610')
            await user.click(screen.getByText(/continue to shipping method/i))
        })

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

        await act(async () => {
            // Submit selected shipping method
            await user.click(screen.getByText(/continue to payment/i))
        })

        // Wait for next step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Applied shipping method should be displayed in previous step summary
        expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

        await act(async () => {
            // Fill out credit card payment form
            await user.type(screen.getByLabelText(/card number/i), '4111111111111111')
            await user.type(screen.getByLabelText(/name on card/i), 'Testy McTester')
            await user.type(screen.getByLabelText(/expiration date/i), '0140')
            // result returns two nodes, the first node is the button tooltip
            // second is the input for security node
            await user.type(
                screen.getAllByLabelText(/^security code$/i /* not "security code info" */)[1],
                '123'
            )
        })

        // Same as shipping checkbox selected by default
        expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

        // Should display billing address that matches shipping address
        const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
        expect(step3Content.getByText('Tester McTesting')).toBeInTheDocument()
        expect(step3Content.getByText('123 Main St')).toBeInTheDocument()
        expect(step3Content.getByText('Tampa, FL 33610')).toBeInTheDocument()
        expect(step3Content.getByText('US')).toBeInTheDocument()

        await act(async () => {
            // Move to final review step
            await user.click(screen.getByText(/review order/i))
        })

        const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn', undefined, {
            timeout: 5000
        })

        // Verify applied payment and billing address
        expect(step3Content.getByText('Visa')).toBeInTheDocument()
        expect(step3Content.getByText('•••• 1111')).toBeInTheDocument()
        expect(step3Content.getByText('1/2040')).toBeInTheDocument()

        expect(step3Content.getByText('Tester McTesting')).toBeInTheDocument()
        expect(step3Content.getByText('123 Main St')).toBeInTheDocument()
        expect(step3Content.getByText('Tampa, FL 33610')).toBeInTheDocument()
        expect(step3Content.getByText('US')).toBeInTheDocument()
        await act(async () => {
            await user.click(placeOrderBtn)
        })

        expect(await screen.findByText(/success/i)).toBeInTheDocument()
    })
    test('Can proceed through checkout as registered customer', async () => {
        let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))
        // Set up additional requests for intercepting/mocking for just this test.
        prependHandlersToServer([
            {
                path: '*/baskets/:basketId/customer',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
                    currentBasket.customerInfo.email = 'customer@test.com'
                    return currentBasket
                }
            },
            {
                path: '*/customers/:customerId/product-lists',
                method: 'get',
                status: 200,
                delay: 0,
                res: () => mockedCustomerProductLists
            },
            {
                path: '*/shipping-address',
                method: 'put',
                status: 200,
                delay: 0,
                res: (req) => {
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
                    return currentBasket
                }
            },
            {
                path: '*/billing-address',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
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
                    return currentBasket
                }
            },
            {
                path: '*/shipments/me/shipping-method',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
                    currentBasket.shipments[0].shippingMethod = defaultShippingMethod
                    return currentBasket
                }
            },
            {
                path: '*/baskets/:basketId/payment-instruments',
                method: 'post',
                status: 200,
                delay: 0,
                res: () => {
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
                    return currentBasket
                }
            },
            {
                path: '*/addresses/savedaddress1',
                method: 'patch',
                status: 200,
                delay: 0,
                res: () => mockedRegisteredCustomer.addresses[0]
            },
            {
                path: '*/orders',
                method: 'post',
                status: 200,
                delay: 0,
                res: () => {
                    const response = {
                        ...currentBasket,
                        ...scapiOrderResponse,
                        customerInfo: {
                            ...scapiOrderResponse.customerInfo,
                            email: 'customer@test.com'
                        },
                        status: 'created'
                    }
                    return response
                }
            },
            {
                path: '*/baskets',
                method: 'get',
                status: 200,
                delay: 0,
                res: () => ({
                    baskets: [currentBasket],
                    total: 1
                })
            }
        ])
        // Mock focus to avoid win.PointerEvent constructor is not defined errors in jsdom
        // This is more targeted than mocking PointerEvent globally
        // Mock PointerEvent globally will break entire form submission form of any test,
        const originalFocus = HTMLElement.prototype.focus
        const mockFocus = jest.fn().mockImplementation(function () {
            // Allow legitimate focus calls to work, just skip the PointerEvent parts
            this.dispatchEvent(new Event('focus', {bubbles: true}))
        })
        HTMLElement.prototype.focus = mockFocus

        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {
                // Not bypassing auth as usual, so we can test the guest-to-registered flow
                bypassAuth: true,
                isGuest: false,
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                config: mockConfig
            }
        })

        // Email should be displayed in previous step summary
        await waitFor(() => {
            expect(screen.getByText('customer@test.com')).toBeInTheDocument()
        })

        // Select a saved address and continue
        await waitFor(() => {
            expect(screen.getByTestId('sf-checkout-shipping-address-0')).toBeInTheDocument()
        })

        await act(async () => {
            // Click on the first (and only) saved address card to select it
            const addressCard = screen.getByTestId('sf-checkout-shipping-address-0')
            await user.click(addressCard)
        })

        // Wait for the address to be selected and form to be valid
        await waitFor(() => {
            const continueButton = screen.getByRole('button', {
                name: /continue to shipping method/i
            })
            expect(continueButton).not.toBeDisabled()
        })

        await act(async () => {
            const continueToShipping = screen.getByRole('button', {
                name: /continue to shipping method/i
            })
            await user.click(continueToShipping)
        })

        // Wait for next step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })

        expect(screen.getByText('Test McTester')).toBeInTheDocument()
        expect(screen.getByText('123 Main St')).toBeInTheDocument()

        const shippingOptionsForm = screen.getByTestId('sf-checkout-shipping-options-form')
        await waitFor(() =>
            expect(shippingOptionsForm).toHaveFormValues({
                'shipping-options-radiogroup': mockShippingMethods.defaultShippingMethodId
            })
        )

        await act(async () => {
            await user.click(screen.getByText(/continue to payment/i))
        })

        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-3-content')).not.toBeEmptyDOMElement()
        })

        // Applied shipping method should be displayed in previous step summary
        expect(screen.getByText(defaultShippingMethod.name)).toBeInTheDocument()

        // NOTE: using user.type won't work due to the focus mock, using fireEvent instead
        await act(async () => {
            fireEvent.change(screen.getByLabelText(/card number/i), {
                target: {value: '4111111111111111'}
            })
            fireEvent.change(screen.getByLabelText(/name on card/i), {
                target: {value: 'Testy McTester'}
            })
            fireEvent.change(screen.getByLabelText(/expiration date/i), {
                target: {value: '0140'}
            })
            // result returns two nodes, the first node is the button tooltip
            // second is the input for security node
            fireEvent.change(
                screen.getAllByLabelText(/^security code$/i /* not "security code info" */)[1],
                {target: {value: '123'}}
            )
        })

        // Assert that the form inputs contain the expected values
        expect(screen.getByLabelText(/card number/i)).toHaveValue('4111 1111 1111 1111')
        expect(screen.getByLabelText(/name on card/i)).toHaveValue('Testy McTester')
        expect(screen.getByLabelText(/expiration date/i)).toHaveValue('01/40')
        expect(screen.getAllByLabelText(/^security code$/i)[1]).toHaveValue('123')
        // Same as shipping checkbox selected by default
        expect(screen.getByLabelText(/same as shipping address/i)).toBeChecked()

        // Should display billing address that matches shipping address
        const step3Content = within(screen.getByTestId('sf-toggle-card-step-3-content'))
        expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

        // Edit billing address
        const sameAsShippingBtn = screen.getByText(/same as shipping address/i)
        await act(async () => {
            await user.click(sameAsShippingBtn)
        })

        const firstNameInput = screen.getByLabelText(/first name/i)
        const lastNameInput = screen.getByLabelText(/last name/i)
        expect(step3Content.queryByText(/Set as default/)).not.toBeInTheDocument()

        await act(async () => {
            // Because of the way we mock focus, we need to triple click to avoid focus issues
            await user.tripleClick(firstNameInput)
            await user.type(firstNameInput, 'John')
            await user.tripleClick(lastNameInput)
            await user.type(lastNameInput, 'Smith')
        })

        await act(async () => {
            // Move to final review step
            await user.click(screen.getByText(/review order/i))
        })

        const placeOrderBtn = await screen.findByTestId('sf-checkout-place-order-btn', undefined, {
            timeout: 5000
        })

        // Verify applied payment and billing address
        expect(step3Content.getByText('Master Card')).toBeInTheDocument()
        expect(step3Content.getByText('•••• 5454')).toBeInTheDocument()
        expect(step3Content.getByText('1/2040')).toBeInTheDocument()

        expect(step3Content.getByText('John Smith')).toBeInTheDocument()
        expect(step3Content.getByText('123 Main St')).toBeInTheDocument()

        await act(async () => {
            // Place the order
            await user.click(placeOrderBtn)
        })

        // Should now be on our mocked confirmation route/page
        expect(await screen.findByText(/success/i)).toBeInTheDocument()

        // Restore original focus method
        HTMLElement.prototype.focus = originalFocus
        document.cookie = ''
    })
})

describe('Checkout Addresses tests', () => {
    test('Can edit address during checkout as a registered customer', async () => {
        let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))

        // Set up mock handlers for the component to function properly
        prependHandlersToServer([
            {
                path: '*/baskets/:basketId/customer',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
                    currentBasket.customerInfo.email = 'customer@test.com'
                    return currentBasket
                }
            },
            {
                path: '*/customers/:customerId/product-lists',
                method: 'get',
                status: 200,
                delay: 0,
                res: () => mockedCustomerProductLists
            },
            {
                path: '*/shipping-address',
                method: 'put',
                status: 200,
                delay: 0,
                res: (req) => {
                    const shippingAddress = {
                        address1: req.body.address1,
                        city: req.body.city || 'Tampa',
                        countryCode: 'US',
                        firstName: req.body.firstName || 'Test',
                        fullName: `${req.body.firstName || 'Test'} ${req.body.lastName || 'McTester'}`,
                        id: '047b18d4aaaf4138f693a4b931',
                        lastName: req.body.lastName || 'McTester',
                        phone: req.body.phone || '(727) 555-1234',
                        postalCode: req.body.postalCode || '33712',
                        stateCode: req.body.stateCode || 'FL'
                    }
                    currentBasket.shipments[0].shippingAddress = shippingAddress
                    return currentBasket
                }
            },
            {
                path: '*/addresses/savedaddress1',
                method: 'patch',
                status: 200,
                delay: 0,
                res: (req) => ({
                    ...mockedRegisteredCustomer.addresses[0],
                    ...req.body
                })
            },
            {
                path: '*/baskets',
                method: 'get',
                status: 200,
                delay: 0,
                res: () => ({
                    baskets: [currentBasket],
                    total: 1
                })
            }
        ])

        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {
                // Not bypassing auth as usual, so we can test the guest-to-registered flow
                bypassAuth: true,
                isGuest: false,
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                config: mockConfig
            }
        })

        await waitFor(() => {
            expect(screen.getByTestId('sf-checkout-shipping-address-0')).toBeInTheDocument()
        })

        const firstAddress = screen.getByTestId('sf-checkout-shipping-address-0')
        await act(async () => {
            await user.click(within(firstAddress).getByText(/edit/i))
        })

        // Wait for the edit address form to render
        await waitFor(() =>
            expect(screen.getByTestId('sf-shipping-address-edit-form')).not.toBeEmptyDOMElement()
        )

        // Shipping Address Form must be present
        expect(screen.getByLabelText('Shipping Address Form')).toBeInTheDocument()
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()

        await act(async () => {
            // Edit and save the address
            await user.clear(screen.getByLabelText('Address'))
            await user.type(screen.getByLabelText('Address'), '369 Main Street')
            await user.click(screen.getByText(/save & continue to shipping method/i))
        })

        // Wait for next step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })

        expect(screen.getByText('369 Main Street')).toBeInTheDocument()
    })

    test('Can add address during checkout as a registered customer', async () => {
        let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))

        // Set up mock handlers for the component to function properly
        prependHandlersToServer([
            {
                path: '*/baskets/:basketId/customer',
                method: 'put',
                status: 200,
                delay: 0,
                res: () => {
                    currentBasket.customerInfo.email = 'customer@test.com'
                    return currentBasket
                }
            },
            {
                path: '*/customers/:customerId/product-lists',
                method: 'get',
                status: 200,
                delay: 0,
                res: () => mockedCustomerProductLists
            },
            {
                path: '*/shipping-address',
                method: 'put',
                status: 200,
                delay: 0,
                res: (req) => {
                    const shippingAddress = {
                        address1: req.body.address1,
                        city: req.body.city || 'Tampa',
                        countryCode: 'US',
                        firstName: req.body.firstName || 'Test',
                        fullName: `${req.body.firstName || 'Test'} ${req.body.lastName || 'McTester'}`,
                        id: '047b18d4aaaf4138f693a4b931',
                        lastName: req.body.lastName || 'McTester',
                        phone: req.body.phone || '(727) 555-1234',
                        postalCode: req.body.postalCode || '33712',
                        stateCode: req.body.stateCode || 'FL'
                    }
                    currentBasket.shipments[0].shippingAddress = shippingAddress
                    return currentBasket
                }
            },
            {
                path: '*/customers/:customerId/addresses',
                method: 'post',
                status: 200,
                delay: 0,
                res: (req) => req.body
            },
            {
                path: '*/baskets',
                method: 'get',
                status: 200,
                delay: 0,
                res: () => ({
                    baskets: [currentBasket],
                    total: 1
                })
            }
        ])

        // Set the initial browser router path and render our component tree.
        window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout'))
        const {user} = renderWithProviders(<WrappedCheckout history={history} />, {
            wrapperProps: {
                // Not bypassing auth as usual, so we can test the guest-to-registered flow
                bypassAuth: true,
                isGuest: false,
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                config: mockConfig
            }
        })

        await waitFor(() => {
            expect(screen.getByText(/add new address/i)).toBeInTheDocument()
        })
        await act(async () => {
            // Add address
            await user.click(screen.getByText(/add new address/i))
        })

        // Shipping Address Form must be present
        expect(screen.getByLabelText('Shipping Address Form')).toBeInTheDocument()

        const firstName = await screen.findByLabelText(/first name/i)
        await act(async () => {
            await user.type(firstName, 'Test2')
            await user.type(screen.getByLabelText(/last name/i), 'McTester')
            await user.type(screen.getByLabelText(/phone/i), '7275551234')
            await user.selectOptions(screen.getByLabelText(/country/i), ['US'])
            await user.type(screen.getAllByLabelText(/address/i)[0], 'Tropicana Field')
            await user.type(screen.getByLabelText(/city/i), 'Tampa')
            await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
            await user.type(screen.getByLabelText(/zip code/i), '33712')
            await user.click(screen.getByText(/save & continue to shipping method/i))
        })

        // Wait for next step to render
        await waitFor(() => {
            expect(screen.getByTestId('sf-toggle-card-step-2-content')).not.toBeEmptyDOMElement()
        })
    })
})
