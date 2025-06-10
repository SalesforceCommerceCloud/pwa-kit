/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import BonusProductsTitle from './bonus-products-title'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

// Mock the useCurrentBasket hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

const MockedComponent = ({basketData}) => {
    useCurrentBasket.mockReturnValue({data: basketData})
    return (
        <IntlProvider messages={{}} locale="en">
            <BonusProductsTitle />
        </IntlProvider>
    )
}

describe('BonusProductsTitle', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders title with 1 item when one bonus product', () => {
        const basketData = {
            productItems: [
                {id: '1', bonusProductLineItem: true},
                {id: '2', bonusProductLineItem: false}
            ]
        }
        render(<MockedComponent basketData={basketData} />)
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
        render(<MockedComponent basketData={basketData} />)
        expect(screen.getByText('Bonus Products (2 items)')).toBeInTheDocument()
    })
}) 