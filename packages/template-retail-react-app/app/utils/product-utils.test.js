/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getDisplayPrice,
    getDisplayVariationValues,
    normalizeSetBundleProduct
} from '@salesforce/retail-react-app/app/utils/product-utils'
import mockProductSet from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'
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

describe('normalizeSetBundleProduct', () => {
    test('passing in regular product returns original product', () => {
        const mockProduct = {
            name: 'Striped Silk Tie',
            id: '25752986M',
            type: {master: true}
        }

        const normalizedProduct = normalizeSetBundleProduct(mockProduct)

        expect(normalizedProduct).toStrictEqual(mockProduct)
    })

    test('passing in product set normalizes data', () => {
        const normalizedProduct = normalizeSetBundleProduct(mockProductSet)

        for (let i = 0; i < mockProductSet.setProducts.length; i++) {
            expect(normalizedProduct.childProducts[i].quantity).toBeNull()
            expect(normalizedProduct.childProducts[i].product).toStrictEqual(
                mockProductSet.setProducts[i]
            )
        }
    })

    test('passing in product bundle normalizes data', () => {
        const normalizedProduct = normalizeSetBundleProduct(mockProductBundle)
        expect(normalizedProduct.childProducts).toStrictEqual(mockProductBundle.bundledProducts)
    })
})

describe('getDisplayPrice', function () {
    test('returns basePrice and discountPrice', () => {
        const {basePrice, discountPrice} = getDisplayPrice(
            mockedCustomerProductListsDetails.data[0]
        )

        expect(basePrice).toBe(199.0)
        expect(discountPrice).toBe(189.0)
    })

    test('returns null if there is not discount promotion', () => {
        const data = {
            ...mockedCustomerProductListsDetails.data[0],
            productPromotions: []
        }
        const {basePrice, discountPrice} = getDisplayPrice(data)

        expect(basePrice).toBe(199.0)
        expect(discountPrice).toBeNull()
    })
})
