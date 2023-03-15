/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within} from '@testing-library/react'
import user from '@testing-library/user-event'

import ContactInfo from './contact-info'
import {renderWithProviders} from '../../../utils/test-utils'

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
