/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within} from '@testing-library/react'
import DisplayPrice from '../display-price/index'
import {renderWithProviders} from '../../utils/test-utils'
import mockProductDetail from '../../commerce-api/mocks/variant-750518699578M'

const mockedBasePrice = /\$299\.99/i
const mockedDiscountPrice = /\$149\.99/i

describe('DisplayPrice', function () {
    test('should render without error', () => {
        renderWithProviders(<DisplayPrice product={mockProductDetail} scope="pdp" />)
        expect(screen.getByText(mockedBasePrice)).toBeInTheDocument()
        expect(screen.getByText(mockedDiscountPrice)).toBeInTheDocument()
    })

    test('should render according html tag for prices', () => {
        const {getByTestId} = renderWithProviders(
            <DisplayPrice product={mockProductDetail} scope="pdp" />
        )
        const basePriceTag = getByTestId('base-price')
        const discountPriceTag = getByTestId('discount-price')
        expect(within(basePriceTag).getByText(mockedBasePrice)).toBeDefined()
        expect(within(discountPriceTag).getByText(mockedDiscountPrice)).toBeDefined()
    })

    test('should not render discount price if not available', () => {
        delete mockProductDetail.productPromotions
        renderWithProviders(<DisplayPrice product={mockProductDetail} scope="pdp" />)
        expect(screen.getByText(mockedBasePrice)).toBeInTheDocument()
        expect(screen.queryByText(mockedDiscountPrice)).not.toBeInTheDocument()
    })
})
