/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant/index'
import ItemPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import {
    cartVariant,
    wishlistVariant
} from '@salesforce/retail-react-app/app/components/item-variant/data.mock'
import {within} from '@testing-library/react'
import {useMediaQuery} from '@salesforce/retail-react-app/app/components/shared/ui'

jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => {
    const originalModule = jest.requireActual(
        '@salesforce/retail-react-app/app/components/shared/ui'
    )
    return {
        ...originalModule,
        useMediaQuery: jest.fn()
    }
})
const MockedComponent = ({variant}) => {
    return (
        <ItemVariantProvider variant={variant}>
            <ItemPrice currency="GBP" />
        </ItemVariantProvider>
    )
}
MockedComponent.propTypes = {
    variant: PropTypes.object
}

describe('ItemPrice', function () {
    test('should display basket prices if variant is for cart page on mobile', () => {
        useMediaQuery.mockReturnValue([false])
        const {getByText, getAllByText} = renderWithProviders(
            <MockedComponent variant={cartVariant} />
        )
        // current price
        expect(getByText(/^£0\.00$/i)).toBeInTheDocument()
        // price per item
        const pricePerItemEls = getAllByText(/£24\.00ea/i)
        // make sure that only one price per item is shown on mobile
        expect(pricePerItemEls).toHaveLength(1)
        expect(getByText(/£24\.00ea/i)).toBeInTheDocument()
    })

    test('should display basket prices if variant is for cart page on desktop', () => {
        useMediaQuery.mockReturnValue([true])
        const {getByText, getAllByText} = renderWithProviders(
            <MockedComponent variant={cartVariant} />
        )
        // price per item
        expect(getByText(/£24\.00ea/i)).toBeInTheDocument()
        const pricePerItemEls = getAllByText(/£24\.00ea/i)
        // make sure that only one price per item is shown on mobile
        expect(pricePerItemEls).toHaveLength(1)

        // current price
        expect(getByText(/^£0\.00$/i)).toBeInTheDocument()
    })

    test('should display product prices if variant is for wishlist page on desktop', () => {
        useMediaQuery.mockReturnValue([true])
        const {getByText, container, getAllByText} = renderWithProviders(
            <MockedComponent variant={wishlistVariant} />
        )

        // current price
        expect(getByText(/^£355\.15$/i)).toBeInTheDocument()
        // strikethrough price
        const strikethroughPriceTag = container.querySelector('s')
        expect(within(strikethroughPriceTag).getByText(/£476\.80/i)).toBeInTheDocument()
        // price per unit
        expect(getByText(/£71\.03ea/i)).toBeInTheDocument()
        const pricePerItemEls = getAllByText(/£71\.03ea/i)
        expect(pricePerItemEls).toHaveLength(1)
    })

    test('should display product prices if variant is for wishlist page on mobile', () => {
        useMediaQuery.mockReturnValue([false])
        const {getByText, container, getAllByText} = renderWithProviders(
            <MockedComponent variant={wishlistVariant} />
        )
        // price per item
        expect(getByText(/£71\.03ea/i)).toBeInTheDocument()
        const pricePerItemEls = getAllByText(/£71\.03ea/i)
        expect(pricePerItemEls).toHaveLength(1)

        // current price
        expect(getByText(/^£355\.15$/i)).toBeInTheDocument()
        // strikethrough price
        const strikethroughPriceTag = container.querySelector('s')
        expect(within(strikethroughPriceTag).getByText(/£476\.80/i)).toBeInTheDocument()
    })
})
