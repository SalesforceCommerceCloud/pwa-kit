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
    const defaultProps = {
        isCheckout: false
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders footer when not on checkout page', () => {
        renderWithProviders(<AppFooter {...defaultProps} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.queryByTestId('checkout-footer')).not.toBeInTheDocument()
    })

    test('does not render footer on checkout page', () => {
        const props = {...defaultProps, isCheckout: true}
        renderWithProviders(<AppFooter {...props} />)

        expect(screen.getByTestId('checkout-footer')).toBeInTheDocument()
        expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    })

    test('renders footer by default when isCheckout prop is not provided', () => {
        renderWithProviders(<AppFooter />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    test('handles undefined isCheckout prop gracefully', () => {
        const props = {...defaultProps, isCheckout: undefined}
        renderWithProviders(<AppFooter {...props} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    test('handles null isCheckout prop gracefully', () => {
        const props = {...defaultProps, isCheckout: null}
        renderWithProviders(<AppFooter {...props} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
})
