/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getPostalCodeFormat,
    getPreferredDeliveryDestination,
    getSlowestDeliveryEstimate,
    isValidDestination,
    normalizeDestination
} from '@salesforce/retail-react-app/app/components/delivery-estimate/utils'

const estimate = (productId, shippingOptions) => ({productId, shippingOptions})

describe('getSlowestDeliveryEstimate', () => {
    test('chooses the option with the latest delivery-window start for the requested product', () => {
        const result = getSlowestDeliveryEstimate('sku-a', {
            productDeliveryEstimates: [
                estimate('sku-b', []),
                estimate('sku-a', [
                    {
                        shippingMethodId: 'express',
                        price: 1,
                        deliveryWindow: {
                            startAt: '2026-09-15T14:00:00Z',
                            endAt: '2026-09-16T14:00:00Z'
                        }
                    },
                    {
                        shippingMethodId: 'ground',
                        price: 99,
                        deliveryWindow: {
                            startAt: '2026-09-16T14:00:00Z',
                            endAt: '2026-09-18T14:00:00Z'
                        }
                    }
                ])
            ]
        })

        expect(result.shippingMethodId).toBe('ground')
    })

    test('uses the latest delivery-window end time when start times match', () => {
        const result = getSlowestDeliveryEstimate('sku-a', {
            productDeliveryEstimates: [
                estimate('sku-a', [
                    {
                        shippingMethodId: 'ground',
                        deliveryWindow: {
                            startAt: '2026-09-15T14:00:00Z',
                            endAt: '2026-09-18T14:00:00Z'
                        }
                    },
                    {
                        shippingMethodId: 'express',
                        deliveryWindow: {
                            startAt: '2026-09-15T14:00:00Z',
                            endAt: '2026-09-16T14:00:00Z'
                        }
                    }
                ])
            ]
        })

        expect(result.shippingMethodId).toBe('ground')
    })

    test('ignores non-deliverable and malformed delivery windows', () => {
        const result = getSlowestDeliveryEstimate('sku-a', {
            productDeliveryEstimates: [
                estimate('sku-a', [
                    {
                        shippingMethodId: 'unavailable',
                        nonDeliverableReason: 'INSUFFICIENT_INVENTORY'
                    },
                    {
                        shippingMethodId: 'invalid',
                        deliveryWindow: {
                            startAt: 'not-a-date',
                            endAt: '2026-09-16T14:00:00Z'
                        }
                    },
                    {
                        shippingMethodId: 'backwards',
                        deliveryWindow: {
                            startAt: '2026-09-18T14:00:00Z',
                            endAt: '2026-09-16T14:00:00Z'
                        }
                    }
                ])
            ]
        })

        expect(result).toBeNull()
    })
})

describe('delivery destination validation', () => {
    test('normalizes postal codes using the destination country format', () => {
        expect(normalizeDestination({countryCode: 'ca', postalCode: 'm5v3a8'})).toEqual({
            countryCode: 'CA',
            postalCode: 'M5V 3A8'
        })
        expect(normalizeDestination({countryCode: 'gb', postalCode: 'sw1a1aa'})).toEqual({
            countryCode: 'GB',
            postalCode: 'SW1A 1AA'
        })
    })

    test('matches Storefront Next postal-code validation', () => {
        expect(isValidDestination({countryCode: 'US', postalCode: '94105'})).toBe(true)
        expect(isValidDestination({countryCode: 'US', postalCode: '9410'})).toBe(false)
        expect(isValidDestination({countryCode: 'GB', postalCode: 'SW1A 1AA'})).toBe(true)
        expect(isValidDestination({countryCode: 'GB', postalCode: '12345'})).toBe(false)
        expect(getPostalCodeFormat('JP')).toMatchObject({inputMode: 'numeric', maxLength: 8})
    })

    test('follows Storefront Next address precedence', () => {
        expect(
            getPreferredDeliveryDestination(
                [
                    {addressId: 'billing', postalCode: '10001', countryCode: 'US', preferred: true},
                    {
                        addressId: 'shipping-secondary',
                        postalCode: 'M5V3A8',
                        countryCode: 'CA'
                    },
                    {
                        addressId: 'shipping-primary',
                        postalCode: 'SW1A1AA',
                        countryCode: 'GB',
                        preferred: true
                    }
                ],
                'US'
            )
        ).toEqual({countryCode: 'GB', postalCode: 'SW1A 1AA'})
    })
})
