/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ProductTile, {Skeleton} from './index'
import {renderWithProviders} from '../../utils/test-utils'

const mockProductSearchItem = {
    currency: 'USD',
    image: {
        alt: 'Charcoal Single Pleat Wool Suit, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4de8166b/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg'
    },
    price: 299.99,
    productName: 'Charcoal Single Pleat Wool Suit'
}

const mockProductSet = {
    currency: 'GBP',
    hitType: 'set',
    image: {
        alt: 'Winter Look, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1c4cd52/images/large/PG.10205921.JJ5FUXX.PZ.jpg',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1c4cd52/images/large/PG.10205921.JJ5FUXX.PZ.jpg',
        title: 'Winter Look, '
    },
    orderable: true,
    price: 44.16,
    priceMax: 71.03,
    pricePerUnit: 44.16,
    pricePerUnitMax: 71.03,
    productId: 'winter-lookM',
    productName: 'Winter Look',
    productType: {
        set: true
    },
    representedProduct: {
        id: '701642853695M'
    },
    representedProducts: [
        {id: '701642853695M'},
        {id: '701642853718M'},
        {id: '701642853725M'},
        {id: '701642853701M'},
        {id: '740357357531M'},
        {id: '740357358095M'},
        {id: '740357357623M'},
        {id: '740357357609M'},
        {id: '740357358156M'},
        {id: '740357358132M'},
        {id: '740357358101M'},
        {id: '740357357562M'},
        {id: '740357357548M'},
        {id: '740357358187M'},
        {id: '740357357593M'},
        {id: '740357357555M'},
        {id: '740357357524M'},
        {id: '740357358149M'},
        {id: '740357358088M'},
        {id: '701642867098M'},
        {id: '701642867111M'},
        {id: '701642867104M'},
        {id: '701642867128M'},
        {id: '701642867135M'}
    ]
}

test('Renders links and images', () => {
    const {getAllByRole} = renderWithProviders(<ProductTile product={mockProductSearchItem} />)

    const link = getAllByRole('link')
    const img = getAllByRole('img')

    expect(link).toBeDefined()
    expect(img).toBeDefined()
})

test('Renders Skeleton', () => {
    const {getAllByTestId} = renderWithProviders(<Skeleton />)

    const skeleton = getAllByTestId('sf-product-tile-skeleton')

    expect(skeleton).toBeDefined()
})

test('Product set - renders the appropriate price label', async () => {
    const {getByTestId} = renderWithProviders(<ProductTile product={mockProductSet} />)

    const container = getByTestId('product-tile-price')
    expect(container).toHaveTextContent(/starting at/i)
})
