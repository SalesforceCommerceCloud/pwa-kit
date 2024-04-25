/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getDisplayPrice,
    getDisplayVariationValues
} from '@salesforce/retail-react-app/app/utils/product-utils'
import {mockedCustomerProductListsDetails} from '@salesforce/retail-react-app/app/mocks/mock-data'

const variationAttributes = [
    {
        id: 'color',
        name: 'Colour',
        values: [
            {name: 'Black', orderable: true, value: 'BLACKLE'},
            {name: 'Taupe', orderable: true, value: 'TAUPETX'}
        ]
    },
    {
        id: 'size',
        name: 'Size',
        values: [
            {name: '6', orderable: true, value: '060'},
            {name: '6.5', orderable: true, value: '065'},
            {name: '7', orderable: true, value: '070'},
            {name: '7.5', orderable: true, value: '075'},
            {name: '8', orderable: true, value: '080'},
            {name: '8.5', orderable: true, value: '085'},
            {name: '9', orderable: true, value: '090'},
            {name: '9.5', orderable: true, value: '095'},
            {name: '10', orderable: true, value: '100'},
            {name: '11', orderable: true, value: '110'}
        ]
    },
    {id: 'width', name: 'Width', values: [{name: 'M', orderable: true, value: 'M'}]}
]

test('getDisplayVariationValues', () => {
    const selectedValues = {
        color: 'TAUPETX',
        size: '065',
        width: 'M'
    }
    const result = getDisplayVariationValues(variationAttributes, selectedValues)

    expect(result).toEqual({
        Colour: 'Taupe',
        Size: '6.5',
        Width: 'M'
    })
})

describe('getDisplayPrice', function () {
    test('returns listPrice and currentPrice for product that has only priceRanges', () => {
        const data = {
            name: 'product name',
            price: 37.76,
            priceRanges: [
                {
                    maxPrice: 40.76,
                    minPrice: 30.76,
                    pricebook: 'gbp-m-list-prices'
                },
                {
                    maxPrice: 37.76,
                    minPrice: 37.76,
                    pricebook: 'gbp-m-sale-prices'
                }
            ]
        }
        const {listPrice, currentPrice} = getDisplayPrice(data)

        expect(listPrice).toBe(40.76)
        expect(currentPrice).toBe(37.76)
    })

    test('returns listPrice and currentPrice for product that has only tieredPrices', () => {
        const data = {
            name: 'product name',
            price: 25.6,
            priceRanges: [
                {
                    maxPrice: 25.6,
                    minPrice: 25.6,
                    pricebook: 'gbp-m-list-prices'
                },
                {
                    maxPrice: 25.6,
                    minPrice: 25.6,
                    pricebook: 'gbp-m-sale-prices'
                }
            ],
            tieredPrices: [
                {
                    price: 30.6,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 25.6,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ]
        }
        const {listPrice, currentPrice} = getDisplayPrice(data)

        expect(listPrice).toBe(30.6)
        expect(currentPrice).toBe(25.6)
    })
})
