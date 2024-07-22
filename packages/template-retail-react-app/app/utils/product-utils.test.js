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
            currentPrice: 18.55,
            listPrice: 31.36,
            pricePerUnit: 18.55,
            isOnSale: true,
            isASet: false,
            isMaster: true,
            isRange: true,
            tieredPrice: 31.36,
            maxPrice: 31.36
        })
    })

    test('returns price data for master product that has ONLY one variant', () => {
        const priceData = getPriceData(mockMasterProductHitWithOneVariant)

        expect(priceData).toEqual({
            currentPrice: 191.99,
            listPrice: 320,
            pricePerUnit: 191.99,
            isOnSale: true,
            isASet: false,
            isMaster: true,
            isRange: false,
            maxPrice: 320,
            tieredPrice: 320
        })
    })

    test('returns correct priceData for product set', () => {
        const priceData = getPriceData(mockProductSetHit)
        expect(priceData).toEqual({
            currentPrice: 40.16,
            listPrice: undefined,
            pricePerUnit: 44.16,
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
            pricePerUnit: 63.99,
            isOnSale: true,
            isASet: false,
            isMaster: false,
            isRange: false,
            maxPrice: 67.99,
            tieredPrice: 67.99
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
    test('master product that does not have variants', () => {
        // It's possible that the API data for this master product to not have variants.
        // The API request needs to include allVariationProperties=true
        const product = {...mockProductSearch.hits[0]}
        delete product.variants
        const result = findLowestPrice(product)
        expect(result.minPrice).toBe(product.price)
        expect(result.data).toBe(product)
    })
    // NOTE: we won't test the returned `minPrice`, since the price is already covered indirectly via testing of getPriceData
})

describe('findLowestPrice - confirm API inconsistency', () => {
    test('getProduct call for a master type', () => {
        const result = findLowestPrice(getProduct.rollSleeveBlouseMaster)
        expect(result.minPrice).toBe(44.16) // unexpected
        expect(result.promotion).toBeNull()
        // The API response does not include productPromotions in the variants.
        // Once fixed, the API is supposed to return 34.16, which is a promotional price.
    })
    test('getProduct call for a variant type', () => {
        const result = findLowestPrice(getProduct.rollSleeveBlouseVariant)
        expect(result.minPrice).toBe(34.16)
        expect(result.promotion).toBeDefined()
    })

    test('standard product with getProduct call', () => {
        const result = findLowestPrice(getProduct.uprightCase)
        expect(result.minPrice).toBe(43.99)
        expect(result.promotion).toBeDefined()
    })
    test('standard product with productSearch call', () => {
        const result = findLowestPrice(productSearch.uprightCase)
        expect(result.minPrice).toBe(63.99) // unexpected
        expect(result.promotion).toBeNull()
        // The API response does not include the promotional price.. only the callout message.
        // Once fixed, it's supposed to return the promo price of 43.99
    })

    test("product set's children do not have promotional price", () => {
        const childItem = productSetWinterLookM.setProducts[0]
        const result = findLowestPrice(childItem)
        expect(result.minPrice).toBe(71.03) // unexpected
        expect(result.promotion).toBeNull()
        // The API response does not include the promotional price.. only the callout message.
        // Once fixed, it's supposed to return the promo price of 61.03
    })
})
