/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import BonusProductQuantity from '@salesforce/retail-react-app/app/components/product-item/partials/BonusProductQuantity'

const mockProduct = {
    id: 'test-id',
    quantity: 2,
    name: 'Test Product'
}

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="en" messages={{}}>
            {component}
        </IntlProvider>
    )
}

describe('BonusProductQuantity', () => {
    test('renders quantity for bonus product', () => {
        renderWithIntl(<BonusProductQuantity product={mockProduct} />)
        expect(screen.getByText('Quantity: 2')).toBeInTheDocument()
    })

    test('has correct aria label', () => {
        renderWithIntl(<BonusProductQuantity product={mockProduct} />)
        const element = screen.getByText('Quantity: 2')
        expect(element).toHaveAttribute('aria-label', 'Quantity 2')
    })

    test('handles undefined quantity gracefully', () => {
        const productWithoutQuantity = {
            id: 'test-id',
            name: 'Test Product'
        }
        renderWithIntl(<BonusProductQuantity product={productWithoutQuantity} />)
        expect(screen.getByText('Quantity:')).toBeInTheDocument()
    })
})
