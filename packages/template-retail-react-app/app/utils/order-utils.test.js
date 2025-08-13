/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/order-utils'

describe('orders utils', () => {
    test('isPickupShipment returns true when c_storePickupEnabled is true', () => {
        expect(isPickupShipment({shippingMethod: {id: '005', c_storePickupEnabled: true}})).toBe(
            true
        )
    })

    test('isPickupShipment returns false when c_storePickupEnabled is false', () => {
        expect(isPickupShipment({shippingMethod: {id: '001', c_storePickupEnabled: false}})).toBe(
            false
        )
    })

    test('isPickupShipment returns false when shippingMethod is missing', () => {
        expect(isPickupShipment({shipmentId: 'me'})).toBe(false)
    })

    test('isPickupShipment returns false when shipment is nullish', () => {
        expect(isPickupShipment(null)).toBe(false)
        expect(isPickupShipment(undefined)).toBe(false)
    })
})
