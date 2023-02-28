/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within, fireEvent} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import ContactInfo from './contact-info'
import {renderWithProviders} from '../../../utils/test-utils'
import {mockCustomerBaskets} from '../../../commerce-api/mock-data'

jest.mock('../util/checkout-context', () => {
    return {
        useCheckout: jest.fn().mockReturnValue({
            customer: null,
            basket: {},
            isGuestCheckout: true,
            setIsGuestCheckout: jest.fn(),
            step: 0,
            login: null,
            checkoutSteps: {Contact_Info: 0},
            setCheckoutStep: null,
            goToNextStep: null
        })
    }
})

test('renders component', () => {
    renderWithProviders(<ContactInfo />)

    // switch to login
    const trigger = screen.getByText(/Already have an account\? Log in/i)
    user.click(trigger)

    // open forgot password modal
    const withinCard = within(screen.getByTestId('sf-toggle-card-step-0'))
    const openModal = withinCard.getByText(/Forgot password\?/i)
    user.click(openModal)

    // check that forgot password modal is open
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))
    expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()
})

test('can set customer email on the basket', async () => {
    const email = mockCustomerBaskets.baskets[0].customerInfo.email
    global.server.use(
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        }),
        rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets.baskets[0]))
        })
    )
    renderWithProviders(<ContactInfo />)

    const emailInput = screen.getByRole('textbox', {
        name: /email/i
    })

    fireEvent.change(emailInput, {target: {value: email}})
    const button = screen.getByRole('button', {
        name: /checkout as guest/i
    })
    user.click(button)
    expect(await screen.findByText(email)).toBeInTheDocument()
    screen.logTestingPlaygroundURL()

    // switch to login
    // const trigger = screen.getByText(/Already have an account\? Log in/i)
    // user.click(trigger)

    // // open forgot password modal
    // const withinCard = within(screen.getByTestId('sf-toggle-card-step-0'))
    // const openModal = withinCard.getByText(/Forgot password\?/i)
    // user.click(openModal)

    // // check that forgot password modal is open
    // const withinForm = within(screen.getByTestId('sf-auth-modal-form'))
    // expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()
})
