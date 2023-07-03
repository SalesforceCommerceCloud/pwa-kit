/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {screen, waitFor} from '@testing-library/react'
import ItemAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import {getDisplayVariationValues} from '@salesforce/retail-react-app/app/utils/product-utils'
import PropTypes from 'prop-types'
import {rest} from 'msw'
import {
    mockBundledProductItemsVariant,
    mockProductBundleWithVariants,
    mockProductBundle
} from '@salesforce/retail-react-app/app/mocks/product-bundle'

const MockedComponent = ({variant}) => {
    return (
        <ItemVariantProvider variant={variant}>
            <ItemAttributes />
        </ItemVariantProvider>
    )
}
MockedComponent.propTypes = {
    variant: PropTypes.object
}

beforeEach(() => {
    global.server.use(
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductBundleWithVariants))
        }),
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductBundle))
        })
    )
})

test('component renders product bundles with variant data', async () => {
    renderWithProviders(<MockedComponent variant={mockBundledProductItemsVariant} />)
    await waitFor(() => {
        expect(screen.getByText(/selected options:/i)).toBeInTheDocument()
    })

    mockBundledProductItemsVariant.bundledProductItems.forEach((item) => {
        expect(screen.getByText(item.productName)).toBeInTheDocument()
        expect(screen.getAllByText(`Qty: ${item.quantity}`)[0]).toBeInTheDocument()
    })

    mockProductBundleWithVariants.data.forEach((item) => {
        const variationValues = getDisplayVariationValues(
            item.variationAttributes,
            item.variationValues
        )
        Object.keys(variationValues).forEach((key) => {
            expect(screen.getAllByText(`${key}: ${variationValues[key]}`)[0]).toBeInTheDocument()
        })
    })
})

test('component renders product bundles without variant data', async () => {
    const mockWithoutBundledProductItems = {...mockBundledProductItemsVariant}
    delete mockWithoutBundledProductItems.bundledProductItems
    renderWithProviders(<MockedComponent variant={mockWithoutBundledProductItems} />)
    await waitFor(() => {
        mockProductBundle.bundledProducts.forEach(({product, quantity}) => {
            expect(screen.getByText(product.name)).toBeInTheDocument()
            expect(screen.getAllByText(`Qty: ${quantity}`)[0]).toBeInTheDocument()
        })
    })
})
