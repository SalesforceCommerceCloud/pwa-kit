/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

import {screen} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import mockProductDetail from '../commerce-api/mocks/variant-750518699578M'
import {renderWithProviders} from '../utils/test-utils'
import useProductPricing from './use-product-pricing'

const MockComponent = ({product, quantity = 1}) => {
    const {basePrice, discountPrice} = useProductPricing(product, quantity)

    return (
        <div>
            <div>{`Quantity: ${quantity}`}</div>
            <div>{`Product ID: ${product.id}`}</div>
            <div>{`Base Price: ${basePrice}`}</div>
            <div>{`Discount Price: ${discountPrice}`}</div>
        </div>
    )
}

MockComponent.propTypes = {
    product: PropTypes.object,
    quantity: PropTypes.number
}

describe('useProductPricing hook', () => {
    test('runs properly', () => {
        const history = createMemoryHistory()
        history.push('/test/path?test')

        renderWithProviders(<MockComponent product={mockProductDetail} />)

        expect(screen.getByText(/Quantity: 1/)).toBeInTheDocument()
        expect(screen.getByText(/Product ID: 750518699578M/)).toBeInTheDocument()
    })

    test('has correct pricing data', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        renderWithProviders(<MockComponent product={mockProductDetail} />)

        expect(screen.getByText(/Base Price: 299.99/)).toBeInTheDocument()
        expect(screen.getByText(/Discount Price: 149.99/)).toBeInTheDocument()
    })
})
