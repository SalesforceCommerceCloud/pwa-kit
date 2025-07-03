/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import BonusProductQuantity from '@salesforce/retail-react-app/app/components/product-item/bonus-product-quantity'

const mockProduct = {quantity: 1}

const renderWithIntl = (component) =>
    render(
        <IntlProvider locale="en" defaultLocale="en">
            {component}
        </IntlProvider>
    )

describe('BonusProductQuantity', () => {
    test('renders the quantity text', () => {
        renderWithIntl(<BonusProductQuantity product={mockProduct} />)
        expect(screen.getByText(/Quantity: 1/)).toBeInTheDocument()
    })

    test('applies correct aria-label', () => {
        renderWithIntl(<BonusProductQuantity product={mockProduct} />)
        const quantityElement = screen.getByText(/Quantity: 1/)
        expect(quantityElement).toHaveAttribute('aria-label')
    })

    test('renders skeleton when product is undefined', () => {
        renderWithIntl(<BonusProductQuantity product={undefined} />)
        // The Skeleton component from Chakra UI renders a div with class "chakra-skeleton"
        expect(document.querySelector('.chakra-skeleton')).toBeInTheDocument()
    })
})
