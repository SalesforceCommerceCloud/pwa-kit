/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getPriceData,
    getDisplayVariationValues,
    findLowestPrice
} from '@salesforce/retail-react-app/app/utils/product-utils'
import {
    mockMasterProductHitWithMultipleVariants,
    mockMasterProductHitWithOneVariant,
    mockProductSetHit,
    mockStandardProductHit
} from '@salesforce/retail-react-app/app/mocks/product-search-hit-data'
import {productSearch} from '@salesforce/retail-react-app/app/components/product-tile/promo-callout.mock'

describe('getDisplayVariationValues', function () {
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

    test('returned selected values', () => {
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
})

describe('getPriceData', function () {
    test('returns price data for master product that has more than one variant', () => {
        const priceData = getPriceData(mockMasterProductHitWithMultipleVariants)
        expect(priceData).toEqual({
            currentPrice: 191.99,
            listPrice: 223.99,
            isOnSale: true,
            isASet: false,
            isMaster: true,
            isRange: true,
            tieredPrice: 223.99,
            maxPrice: 223.99
        })
    })

    test('returns price data for master product that has ONLY one variant', () => {
        const priceData = getPriceData(mockMasterProductHitWithOneVariant)
        expect(priceData).toEqual({
            currentPrice: 191.99,
            listPrice: 320,
            isOnSale: true,
            isASet: false,
            isMaster: true,
            isRange: false,
            tieredPrice: 320,
            maxPrice: 320
        })
    })

    test('returns correct priceData for product set', () => {
        const priceData = getPriceData(mockProductSetHit)
        expect(priceData).toEqual({
            currentPrice: 40.16,
            listPrice: undefined,
            isOnSale: false,
            isASet: true,
            isMaster: false,
            isRange: true,
            tieredPrice: undefined,
            maxPrice: 71.03
        })
    })

    test('returns correct priceData for standard product', () => {
        const priceData = getPriceData(mockStandardProductHit)
        expect(priceData).toEqual({
            currentPrice: 63.99,
            listPrice: 67.99,
            isOnSale: true,
            isASet: false,
            isMaster: false,
            isRange: false,
            tieredPrice: 67.99,
            maxPrice: 67.99
        })
    })
})

describe('findLowestPrice', function () {
    test('without passing in a product', () => {
        const result = findLowestPrice()
        expect(result).toBeUndefined()
    })

    test('lowest price is a promotional price', () => {
        const result = findLowestPrice(productSearch.rollSleeveBlouse)
        expect(result.promotion).toBeDefined()
    })
    test('lowest price is NOT a promotional price', () => {
        const result = findLowestPrice(productSearch.sleevelessBlouse)
        expect(result.promotion).toBeNull()
    })
    test('returned `data` is either a single variant or a product', () => {
        const result = findLowestPrice(productSearch.rollSleeveBlouse)
        expect(Array.isArray(result.data)).toBe(false)
    })
    // NOTE: we won't test the returned `minPrice`, since the price is already covered indirectly via testing of getPriceData
})
