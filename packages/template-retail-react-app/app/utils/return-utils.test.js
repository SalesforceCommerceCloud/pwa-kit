/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getReturnableItems} from '@salesforce/retail-react-app/app/utils/return-utils'

const item = (id, qtyAvailableToReturn) => ({
    productId: id,
    productName: `Item ${id}`,
    quantity: 1,
    omsData: {
        status: 'fulfilled',
        quantityAvailableToReturn: qtyAvailableToReturn
    }
})

describe('getReturnableItems', () => {
    test('returns [] when order is null/undefined', () => {
        expect(getReturnableItems(null)).toEqual([])
        expect(getReturnableItems(undefined)).toEqual([])
    })

    test('returns [] when order has no productItems', () => {
        expect(getReturnableItems({omsData: {status: 'shipped'}})).toEqual([])
    })

    test('returns [] when product items have no omsData envelope (ECOM-only)', () => {
        const order = {
            productItems: [{productId: 'a', productName: 'Item a', quantity: 1}]
        }
        expect(getReturnableItems(order)).toEqual([])
    })

    test('returns [] when no item has quantityAvailableToReturn > 0', () => {
        const order = {productItems: [item('a', 0), item('b', 0)]}
        expect(getReturnableItems(order)).toEqual([])
    })

    test('returns ONLY items with quantityAvailableToReturn > 0', () => {
        const order = {productItems: [item('a', 1), item('b', 0), item('c', 2)]}
        expect(getReturnableItems(order).map((i) => i.productId)).toEqual(['a', 'c'])
    })

    test('rejects NaN, negative, and non-numeric quantityAvailableToReturn', () => {
        const order = {
            productItems: [
                {productId: 'nan', omsData: {quantityAvailableToReturn: NaN}},
                {productId: 'neg', omsData: {quantityAvailableToReturn: -1}},
                {productId: 'str', omsData: {quantityAvailableToReturn: '2'}},
                {productId: 'ok', omsData: {quantityAvailableToReturn: 1}}
            ]
        }
        expect(getReturnableItems(order).map((i) => i.productId)).toEqual(['ok'])
    })
})
