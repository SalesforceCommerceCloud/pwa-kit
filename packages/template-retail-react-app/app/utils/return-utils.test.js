/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getReturnableItems} from '@salesforce/retail-react-app/app/utils/return-utils'

const ELIGIBLE = ['SHIPPED', 'DELIVERED']

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
    test('returns [] when order is null', () => {
        expect(getReturnableItems(null, ELIGIBLE)).toEqual([])
    })

    test('returns [] when order is undefined', () => {
        expect(getReturnableItems(undefined, ELIGIBLE)).toEqual([])
    })

    test('returns [] when order has no productItems', () => {
        expect(getReturnableItems({omsData: {status: 'shipped'}}, ELIGIBLE)).toEqual([])
    })

    test('returns [] when order has no omsData envelope (ECOM-only)', () => {
        const order = {
            status: 'open', // ECOM status, not in eligible list
            productItems: [item('a', 1)]
        }
        expect(getReturnableItems(order, ELIGIBLE)).toEqual([])
    })

    test('returns [] when order status is NOT in returnEligibleStatuses', () => {
        const order = {
            omsData: {status: 'Created'},
            productItems: [item('a', 1), item('b', 2)]
        }
        expect(getReturnableItems(order, ELIGIBLE)).toEqual([])
    })

    test('returns [] when order status IS eligible but no item has quantityAvailableToReturn > 0', () => {
        const order = {
            omsData: {status: 'shipped'},
            productItems: [item('a', 0), item('b', 0)]
        }
        expect(getReturnableItems(order, ELIGIBLE)).toEqual([])
    })

    test('returns [] when product items have no omsData envelope', () => {
        const order = {
            omsData: {status: 'shipped'},
            productItems: [{productId: 'a', productName: 'Item a', quantity: 1}]
        }
        expect(getReturnableItems(order, ELIGIBLE)).toEqual([])
    })

    test('returns ONLY items with quantityAvailableToReturn > 0 (partial-eligible)', () => {
        const order = {
            omsData: {status: 'shipped'},
            productItems: [item('a', 1), item('b', 0), item('c', 2)]
        }
        const result = getReturnableItems(order, ELIGIBLE)
        expect(result.map((i) => i.productId)).toEqual(['a', 'c'])
    })

    test('returns ALL items when every item has quantityAvailableToReturn > 0', () => {
        const order = {
            omsData: {status: 'delivered'},
            productItems: [item('a', 1), item('b', 3)]
        }
        expect(getReturnableItems(order, ELIGIBLE)).toHaveLength(2)
    })

    test('prefers omsData.status over status when both are present', () => {
        const order = {
            status: 'open', // ECOM/legacy status that would not match
            omsData: {status: 'shipped'},
            productItems: [item('a', 1)]
        }
        expect(getReturnableItems(order, ELIGIBLE)).toHaveLength(1)
    })

    test('case-insensitive match on status', () => {
        const order = {
            omsData: {status: 'Shipped'},
            productItems: [item('a', 1)]
        }
        expect(getReturnableItems(order, ['shipped'])).toHaveLength(1)
    })

    test('trims whitespace on both order status and configured values', () => {
        const order = {
            omsData: {status: '  delivered  '},
            productItems: [item('a', 1)]
        }
        expect(getReturnableItems(order, ['  DELIVERED  '])).toHaveLength(1)
    })

    test('returns [] when returnEligibleStatuses is empty', () => {
        const order = {
            omsData: {status: 'shipped'},
            productItems: [item('a', 1)]
        }
        expect(getReturnableItems(order, [])).toEqual([])
    })

    test('returns [] when returnEligibleStatuses is missing (default)', () => {
        const order = {
            omsData: {status: 'shipped'},
            productItems: [item('a', 1)]
        }
        expect(getReturnableItems(order)).toEqual([])
    })

    test('treats null/undefined entries in returnEligibleStatuses as no-ops', () => {
        const order = {
            omsData: {status: 'shipped'},
            productItems: [item('a', 1)]
        }
        expect(getReturnableItems(order, [null, undefined, '', 'SHIPPED'])).toHaveLength(1)
    })
})
