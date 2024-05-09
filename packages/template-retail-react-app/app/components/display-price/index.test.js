/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within} from '@testing-library/react'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

describe('DisplayPrice', function () {
    const data = {
        salePrice: 90,
        listPrice: 100,
        isASet: false,
        isOnSale: true,
        isMaster: true,
        isRange: true,
        hasRepresentedProduct: false
    }
    test('should render without error', () => {
        renderWithProviders(<DisplayPrice currency="GBP" priceData={data} />)
        expect(screen.getByText(/£90\.00/i)).toBeInTheDocument()
        expect(screen.getByText(/£100\.00/i)).toBeInTheDocument()
    })

    test('should render according html tag for prices', () => {
        const {container} = renderWithProviders(<DisplayPrice currency="GBP" priceData={data} />)
        const currentPriceTag = container.querySelectorAll('b')
        const strikethroughPriceTag = container.querySelectorAll('s')
        expect(within(currentPriceTag[0]).getByText(/£90\.00/i)).toBeDefined()
        expect(within(strikethroughPriceTag[0]).getByText(/£100\.00/i)).toBeDefined()
        expect(currentPriceTag).toHaveLength(1)
        expect(strikethroughPriceTag).toHaveLength(1)
    })

    test('should not render list price when price is not on sale', () => {
        renderWithProviders(
            <DisplayPrice currency="GBP" priceData={{...data, salePrice: 100, isOnSale: false}} />
        )
        expect(screen.queryByText(/£90\.`00/i)).not.toBeInTheDocument()
        expect(screen.getByText(/£100\.00/i)).toBeInTheDocument()
    })
})
