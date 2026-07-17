/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    buildReturnProductItems,
    getReturnableItems
} from '@salesforce/retail-react-app/app/utils/return-utils'

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

    test('drops OMS shipping-cost surcharge (productId misses productsById) when the lookup is provided', () => {
        // OMS emits shipping surcharges as productItems entries with a shipping-method
        // id (e.g. UK_Ground) in `productId` and `quantityAvailableToReturn > 0`. Shopper
        // Products doesn't return them, so a productsById miss identifies the surcharge.
        const order = {productItems: [item('013742002997M', 5), item('UK_Ground', 5)]}
        const productsById = {'013742002997M': {id: '013742002997M', name: 'Bracelet'}}
        expect(getReturnableItems(order, productsById).map((i) => i.productId)).toEqual([
            '013742002997M'
        ])
    })

    test('leaves the list intact when productsById is empty (batch getProducts failed)', () => {
        // Defense in depth: if the products batch fetch is empty, do NOT hide every line —
        // that would blank the entire return dialog on a transient outage.
        const order = {productItems: [item('a', 1), item('b', 2)]}
        expect(getReturnableItems(order, {}).map((i) => i.productId)).toEqual(['a', 'b'])
    })

    test('leaves the list intact when productsById is undefined (loading state)', () => {
        const order = {productItems: [item('a', 1)]}
        expect(getReturnableItems(order, undefined).map((i) => i.productId)).toEqual(['a'])
    })
})

describe('buildReturnProductItems', () => {
    test('omits reason from payload when shopper kept the OMS default', () => {
        const selection = {'item-2': {checked: true, quantity: 1, reasonCode: 'Wrong size'}}
        expect(buildReturnProductItems(selection, 'Wrong size')).toEqual([
            {itemId: 'item-2', quantity: 1}
        ])
    })

    test('serializes quantity as a JS Number (not a string)', () => {
        const selection = {'item-2': {checked: true, quantity: '3', reasonCode: 'Defect'}}
        const [row] = buildReturnProductItems(selection, 'Wrong size')
        expect(typeof row.quantity).toBe('number')
        expect(row.quantity).toBe(3)
    })

    test('drops malformed rows (non-numeric or zero quantity) from the payload', () => {
        expect(
            buildReturnProductItems(
                {
                    'item-a': {checked: true, quantity: '', reasonCode: 'Defect'},
                    'item-b': {checked: true, quantity: 'abc', reasonCode: 'Defect'},
                    'item-c': {checked: true, quantity: 0, reasonCode: 'Defect'},
                    'item-d': {checked: true, quantity: 2, reasonCode: 'Defect'}
                },
                'Wrong size'
            )
        ).toEqual([{itemId: 'item-d', quantity: 2, reason: 'Defect'}])
    })

    test('skips unchecked rows', () => {
        const selection = {
            'item-1': {checked: false, quantity: 2, reasonCode: 'Defect'},
            'item-2': {checked: true, quantity: 1, reasonCode: 'Defect'}
        }
        expect(buildReturnProductItems(selection, 'Wrong size')).toEqual([
            {itemId: 'item-2', quantity: 1, reason: 'Defect'}
        ])
    })

    test('returns [] for null/undefined selection', () => {
        expect(buildReturnProductItems(null, 'Wrong size')).toEqual([])
        expect(buildReturnProductItems(undefined, 'Wrong size')).toEqual([])
    })
})
