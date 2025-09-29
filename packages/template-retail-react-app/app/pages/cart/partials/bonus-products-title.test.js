/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import BonusProductsTitle from '@salesforce/retail-react-app/app/pages/cart/partials/bonus-products-title'

describe('BonusProductsTitle', () => {
    it('renders title with 1 item when one bonus product', () => {
        renderWithProviders(<BonusProductsTitle bonusItemsCount={1} />)
        expect(screen.getByText('Bonus Products (1 item)')).toBeInTheDocument()
    })

    it('renders title with multiple items when multiple bonus products', () => {
        renderWithProviders(<BonusProductsTitle bonusItemsCount={2} />)
        expect(screen.getByText('Bonus Products (2 items)')).toBeInTheDocument()
    })

    it('renders title with 0 items when no bonus products', () => {
        renderWithProviders(<BonusProductsTitle bonusItemsCount={0} />)
        expect(screen.getByText('Bonus Products (0 items)')).toBeInTheDocument()
    })

    it('renders title with default count when no prop provided', () => {
        renderWithProviders(<BonusProductsTitle />)
        expect(screen.getByText('Bonus Products (0 items)')).toBeInTheDocument()
    })
})
