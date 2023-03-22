/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import Confirmation from './confirmation'


const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/checkout/confirmation/:orderNo')}>
                <Confirmation />
            </Route>
        </Switch>
    )
}

const mockOrder = {
    "adjustedMerchandizeTotalTax": 9.50,
    "adjustedShippingTotalTax": 0.00,
    "billingAddress": {
      "address1": "123 Walnut Place",
      "city": "Coquitlam",
      "countryCode": "CA",
      "firstName": "Test",
      "fullName": "Test",
      "id": "b00586d85f0b5c514bffe45efa",
      "lastName": "Test",
      "phone": "(778) 888-8888",
      "postalCode": "V3J 888",
      "stateCode": "BC"
    },
    "channelType": "storefront",
    "confirmationStatus": "not_confirmed",
    "createdBy": "Customer",
    "creationDate": "2023-03-21T23:24:22.160Z",
    "currency": "GBP",
    "customerInfo": {
      "customerId": "ab3gGRbiTBIlqu4IEIQXx6zz5i",
      "customerName": "Kevin He",
      "customerNo": "00213505",
      "email": "test@gmail.com"
    },
    "customerName": "Kevin He",
    "exportStatus": "not_exported",
    "lastModified": "2023-03-21T23:24:22.179Z",
    "merchandizeTotalTax": 9.50,
    "notes": {
      
    },
    "orderNo": "00022108",
    "orderToken": "NyRJRVT5fZ7isnqrgbc3GZPKw82gBBn2YD_sAZISoAk",
    "orderTotal": 82.56,
    "paymentInstruments": [
      {
        "amount": 0.0,
        "paymentCard": {
          "cardType": "Visa",
          "creditCardExpired": false,
          "expirationMonth": 12,
          "expirationYear": 2023,
          "holder": "test",
          "maskedNumber": "************1111",
          "numberLastDigits": "1111"
        },
        "paymentInstrumentId": "eebb2adb2f44615b2559ee2624",
        "paymentMethodId": "CREDIT_CARD"
      }
    ],
    "paymentStatus": "not_paid",
    "productItems": [
      {
        "adjustedTax": 9.50,
        "basePrice": 82.56,
        "bonusProductLineItem": false,
        "gift": false,
        "itemId": "46133ac13092304bde7e32f508",
        "itemText": "Pleated Dress With Front Sash.",
        "price": 82.56,
        "priceAfterItemDiscount": 82.56,
        "priceAfterOrderDiscount": 82.56,
        "productId": "701644397425M",
        "productName": "Pleated Dress With Front Sash.",
        "quantity": 1,
        "shipmentId": "me",
        "tax": 9.50,
        "taxBasis": 82.56,
        "taxClassId": "standard",
        "taxRate": 0.13
      }
    ],
    "productSubTotal": 82.56,
    "productTotal": 82.56,
    "shipments": [
      {
        "adjustedMerchandizeTotalTax": 9.50,
        "adjustedShippingTotalTax": 0.00,
        "gift": false,
        "merchandizeTotalTax": 9.50,
        "productSubTotal": 82.56,
        "productTotal": 82.56,
        "shipmentId": "me",
        "shipmentTotal": 82.56,
        "shippingAddress": {
          "address1": "123 Walnut Place",
          "city": "Coquitlam",
          "countryCode": "CA",
          "firstName": "Test",
          "fullName": "Test",
          "id": "47a2440529ec183067f4f7be28",
          "lastName": "Test",
          "phone": "(778) 888-8888",
          "postalCode": "V3J 888",
          "stateCode": "BC"
        },
        "shippingMethod": {
          "description": "Super Saver delivery (arrives in 3-7 business days)",
          "id": "GBP004",
          "name": "Super Saver",
          "price": 1.99,
          "shippingPromotions": [
            {
              "calloutMsg": "Free Shipping Amount Above 50",
              "promotionId": "FreeShippingAmountAbove50",
              "promotionName": "Free Shipping Amount Above 50"
            }
          ],
          "c_estimatedArrivalTime": "3-7 Business Days"
        },
        "shippingStatus": "not_shipped",
        "shippingTotal": 0.00,
        "shippingTotalTax": 0.23,
        "taxTotal": 9.50
      }
    ],
    "shippingItems": [
      {
        "adjustedTax": 0.00,
        "basePrice": 1.99,
        "itemId": "c5c3a39622dd75b98339577648",
        "itemText": "Shipping",
        "price": 1.99,
        "priceAdjustments": [
          {
            "appliedDiscount": {
              "amount": 1
            },
            "creationDate": "2023-03-21T23:24:22.171Z",
            "custom": false,
            "itemText": "Free Shipping Amount Above 50",
            "lastModified": "2023-03-21T23:24:22.179Z",
            "manual": false,
            "price": -1.99,
            "priceAdjustmentId": "1b820eb19f203a1be1fdb1a3c5",
            "promotionId": "FreeShippingAmountAbove50"
          }
        ],
        "priceAfterItemDiscount": 0.00,
        "shipmentId": "me",
        "tax": 0.23,
        "taxBasis": 1.99,
        "taxClassId": "standard",
        "taxRate": 0.13
      }
    ],
    "shippingStatus": "not_shipped",
    "shippingTotal": 0.00,
    "shippingTotalTax": 0.23,
    "siteId": "RefArchGlobal",
    "status": "created",
    "taxation": "gross",
    "taxTotal": 9.50
  }

beforeEach(() => {
    global.server.use(
        rest.get('*/orders/:orderId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrder))
        })
    )
    window.history.pushState({}, 'Checkout', createPathWithDefaults('/checkout/confirmation/000123'))
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

    renderWithProviders(<MockedComponent />, {
        wrapperProps: {isGuest: true}
    })

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const passwordEl = await screen.findByLabelText('Password')
    user.type(passwordEl, 'P4ssword!')
    screen.logTestingPlaygroundURL()
    user.click(createAccountButton)
    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
})

test('Create Account form - successful submission results in redirect to the Account page', async () => {
    global.server.use(
        rest.post('*/customers', (_, res, ctx) => {
            return res(ctx.status(200))
        })
    )

    renderWithProviders(<MockedComponent />, {
        wrapperProps: {isGuest: true}
    })

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const password = screen.getByLabelText('Password')

    user.type(password, 'P4ssword!')
    user.click(createAccountButton)

    await waitFor(() => {
        expect(window.location.pathname).toEqual('/uk/en-GB/account')
    })
})
