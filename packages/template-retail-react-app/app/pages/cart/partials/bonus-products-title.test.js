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
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

// Mock the useCurrentBasket hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

describe('BonusProductsTitle', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Provide a default mock that includes derivedData to prevent AddToCartModal errors
        useCurrentBasket.mockReturnValue({
            data: {},
            derivedData: {totalItems: 0}
        })
    })

    it('renders title with 1 item when one bonus product', () => {
        const basketData = {
            productItems: [
                {id: '1', bonusProductLineItem: true},
                {id: '2', bonusProductLineItem: false}
            ]
        }
        useCurrentBasket.mockReturnValue({
            data: basketData,
            derivedData: {totalItems: 2}
        })

        renderWithProviders(<BonusProductsTitle />)
        expect(screen.getByText('Bonus Products (1 item)')).toBeInTheDocument()
    })

    it('renders title with multiple items when multiple bonus products', () => {
        const basketData = {
            productItems: [
                {id: '1', bonusProductLineItem: true},
                {id: '2', bonusProductLineItem: true},
                {id: '3', bonusProductLineItem: false}
            ]
        }
        useCurrentBasket.mockReturnValue({
            data: basketData,
            derivedData: {totalItems: 3}
        })

        renderWithProviders(<BonusProductsTitle />)
        expect(screen.getByText('Bonus Products (2 items)')).toBeInTheDocument()
    })
})
