/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import OrderLoadError from '@salesforce/retail-react-app/app/components/order-load-error/index'

describe('OrderLoadError component', () => {
    test('renders the full-card error with title and description', () => {
        renderWithProviders(<OrderLoadError />)
        expect(screen.getByTestId('account-order-details-error')).toBeInTheDocument()
        expect(screen.getByRole('heading', {name: /Order Not Found/i})).toBeInTheDocument()
        expect(
            screen.getByText(/We couldn't find the order you're looking for/i)
        ).toBeInTheDocument()
    })

    test('renders a "Back to Order History" link pointing at the order history route', () => {
        renderWithProviders(<OrderLoadError />)
        const backLink = screen.getByRole('link', {name: /Back to Order History/i})
        expect(backLink).toBeInTheDocument()
        // The link routes to /account/orders (locale/site prefix is added by the router).
        expect(backLink.getAttribute('href')).toMatch(/\/account\/orders$/)
    })
})
