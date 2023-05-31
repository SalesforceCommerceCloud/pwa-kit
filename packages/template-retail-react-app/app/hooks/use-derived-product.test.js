/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

import {screen} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {useDerivedProduct} from '@salesforce/retail-react-app/app/hooks/use-derived-product'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const MockComponent = ({product}) => {
    const {inventoryMessage, quantity, variationParams, variant} = useDerivedProduct(product)

    return (
        <div>
            <div>{`Quantity: ${quantity}`}</div>
            <div>{inventoryMessage}</div>
            <div>{JSON.stringify(variant)}</div>
            <div>{JSON.stringify(variationParams)}</div>
        </div>
    )
}

MockComponent.propTypes = {
    product: PropTypes.object
}

describe('useDerivedProduct hook', () => {
    test('runs properly', () => {
        const history = createMemoryHistory()
        history.push('/test/path?test')

        renderWithProviders(<MockComponent product={mockProductDetail} />)

        expect(screen.getByText(/Quantity: 1/)).toBeInTheDocument()
        expect(
            screen.getByText(
                /{"orderable":true,"price":299.99,"productId":"750518699578M","variationValues":{"color":"BLACKFB","size":"038","width":"V"}}/
            )
        ).toBeInTheDocument()
    })

    test('has out of stock message', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        const mockData = {
            ...mockProductDetail,
            inventory: {
                ats: 0,
                backorderable: false,
                id: 'inventory_m',
                orderable: false,
                preorderable: false,
                stockLevel: 0
            }
        }

        renderWithProviders(<MockComponent product={mockData} />)

        expect(screen.getByText(/Out of stock/)).toBeInTheDocument()
    })
})
