/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getDisplayVariationValues,
    normalizeSetBundleProduct
} from '@salesforce/retail-react-app/app/utils/product-utils'

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
        const mockProduct = {
            name: 'Spring Has Sprung',
            id: 'Spring-look-2M',
            type: {set: true},
            setProducts: [
                {
                    name: 'Scoop Neck Tee With Applique',
                    id: '25565826M'
                },
                {
                    name: 'Extend Tab Straight Leg Pant',
                    id: '25518009M'
                }
            ]
        }

        const normalizedProduct = normalizeSetBundleProduct(mockProduct)

        for (let i = 0; i < mockProduct.setProducts.length; i++) {
            expect(normalizedProduct.childProducts[i].quantity).toBeNull()
            expect(normalizedProduct.childProducts[i].product).toStrictEqual(
                mockProduct.setProducts[i]
            )
        }
    })

    test('passing in product bundle normalizes data', () => {
        const mockProduct = {
            name: 'Turquoise Jewelry Bundle',
            id: 'womens-jewelry-bundleM',
            type: {bundle: true},
            bundledProducts: [
                {
                    product: {name: 'Turquoise and Gold Bracelet', id: '013742002836M'},
                    quantity: 1
                },
                {
                    product: {name: 'Turquoise and Gold Necklace', id: '013742002805M'},
                    quantity: 1
                }
            ]
        }

        const normalizedProduct = normalizeSetBundleProduct(mockProduct)
        expect(normalizedProduct.childProducts).toStrictEqual(mockProduct.bundledProducts)
    })
})
