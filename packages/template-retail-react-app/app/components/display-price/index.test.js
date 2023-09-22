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
    test('should render without error', () => {
        renderWithProviders(<DisplayPrice currency="GBP" basePrice={100} discountPrice={90} />)
        expect(screen.getByText(/£90\.00/i)).toBeInTheDocument()
        expect(screen.getByText(/£100\.00/i)).toBeInTheDocument()
    })

    test('should render according html tag for prices', () => {
        const {container} = renderWithProviders(
            <DisplayPrice currency="GBP" basePrice={100} discountPrice={90} />
        )
        const discountPriceTag = container.querySelectorAll('b')
        const basePriceTag = container.querySelectorAll('s')
        expect(within(discountPriceTag[0]).getByText(/£90\.00/i)).toBeDefined()
        expect(within(basePriceTag[0]).getByText(/£100\.00/i)).toBeDefined()
        expect(discountPriceTag).toHaveLength(1)
        expect(basePriceTag).toHaveLength(1)
    })

    test('should not render discount price if not available', () => {
        renderWithProviders(<DisplayPrice currency="GBP" basePrice={100} />)
        expect(screen.queryByText(/£90\.00/i)).not.toBeInTheDocument()
        expect(screen.getByText(/£100\.00/i)).toBeInTheDocument()
    })
})
