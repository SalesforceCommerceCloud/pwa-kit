/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getSlowestDeliveryEstimate} from '@salesforce/retail-react-app/app/components/delivery-estimate/utils'

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
