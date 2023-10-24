/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

import {screen} from '@testing-library/react'
import {variantWithPromos} from '../commerce-api/mocks/variant-750518699578M'
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
const mockedBasePrice = 299.99
const mockedDiscountPrice = 149.99

MockComponent.propTypes = {
    product: PropTypes.object,
    quantity: PropTypes.number
}

describe('useProductPricing hook', () => {
    test('runs properly', () => {
        renderWithProviders(<MockComponent product={variantWithPromos} />)
        expect(screen.getByText(/Quantity: 1/)).toBeInTheDocument()
        expect(screen.getByText(/Product ID: 750518699578M/)).toBeInTheDocument()
    })

    test('has correct pricing data', () => {
        renderWithProviders(<MockComponent product={variantWithPromos} />)
        expect(screen.getByText(new RegExp(`^Base Price: ${mockedBasePrice}$`))).toBeInTheDocument()
        expect(
            screen.getByText(new RegExp(`^Discount Price: ${mockedDiscountPrice}$`))
        ).toBeInTheDocument()
    })

    test('has correct pricing data for quantity of 2', () => {
        const quantity = 2
        renderWithProviders(<MockComponent product={variantWithPromos} quantity={quantity} />)
        expect(
            screen.getByText(new RegExp(`^Base Price: ${mockedBasePrice * quantity}$`))
        ).toBeInTheDocument()
        expect(
            screen.getByText(new RegExp(`^Discount Price: ${mockedDiscountPrice * quantity}$`))
        ).toBeInTheDocument()
    })

    test('has correct pricing data for quantity of 0', () => {
        const quantity = 0
        renderWithProviders(<MockComponent product={variantWithPromos} quantity={quantity} />)
        expect(screen.getByText(new RegExp(`^Base Price: ${mockedBasePrice}$`))).toBeInTheDocument()
        expect(
            screen.getByText(new RegExp(`^Discount Price: ${mockedDiscountPrice}$`))
        ).toBeInTheDocument()
    })

    test('has correct pricing data for an invalid quantity', () => {
        const quantity = 'quantity-is-not-a-number'
        renderWithProviders(<MockComponent product={variantWithPromos} quantity={quantity} />)
        expect(screen.getByText(new RegExp(`^Base Price: ${mockedBasePrice}$`))).toBeInTheDocument()
        expect(
            screen.getByText(new RegExp(`^Discount Price: ${mockedDiscountPrice}$`))
        ).toBeInTheDocument()
    })
})
