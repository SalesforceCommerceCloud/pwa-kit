/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import CartSummarySection from './cart-summary-section'
import {renderWithProviders} from '../../../utils/test-utils'

jest.mock('../../../components/order-summary', () => {
    return function MockOrderSummary() {
        return <div data-testid="sf-order-summary">Order Summary Mock</div>
    }
})

describe('CartSummarySection', () => {
    it('renders desktop version with OrderSummary and CartCta', () => {
        const basket = {id: 'basket-1'}
        renderWithProviders(<CartSummarySection basket={basket} isDesktop={true} />)

        // Check for OrderSummary component using its test ID
        expect(screen.getByTestId('sf-order-summary')).toBeInTheDocument()

        // Check for CartCta component by looking for the checkout button text
        expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument()
    })

    it('renders mobile version with only CartCta', () => {
        const basket = {id: 'basket-1'}
        renderWithProviders(<CartSummarySection basket={basket} isDesktop={false} />)

        // Mobile version should have CartCta
        expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument()

        // Mobile version should NOT have OrderSummary
        expect(screen.queryByTestId('sf-order-summary')).not.toBeInTheDocument()
    })
})
