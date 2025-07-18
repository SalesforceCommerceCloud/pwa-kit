/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import AppFooter from './app-footer'

// Mock Footer component
jest.mock('../../footer', () => {
    return function MockFooter() {
        return <div data-testid="footer">Main Footer</div>
    }
})

// Mock CheckoutFooter component
jest.mock('../../../pages/checkout/partials/checkout-footer', () => {
    return function MockCheckoutFooter() {
        return <div data-testid="checkout-footer">Checkout Footer</div>
    }
})

describe('AppFooter', () => {
    it('renders footer when not on checkout page', () => {
        renderWithProviders(<AppFooter isCheckout={false} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.queryByTestId('checkout-footer')).not.toBeInTheDocument()
    })

    it('does not render footer on checkout page', () => {
        renderWithProviders(<AppFooter isCheckout={true} />)

        expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
        expect(screen.getByTestId('checkout-footer')).toBeInTheDocument()
    })

    it('renders footer by default when isCheckout prop is not provided', () => {
        renderWithProviders(<AppFooter />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('handles undefined isCheckout prop gracefully', () => {
        renderWithProviders(<AppFooter isCheckout={undefined} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('handles null isCheckout prop gracefully', () => {
        renderWithProviders(<AppFooter isCheckout={null} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
})
