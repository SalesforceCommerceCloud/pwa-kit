/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import MultiShipOrderSummary from '@salesforce/retail-react-app/app/components/multiship/multiship-order-summary'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

describe('MultiShipOrderSummary', () => {
    const mockOrder = {
        shipments: [
            {
                shipmentId: 'shipment-1',
                shippingMethod: {
                    c_storePickupEnabled: true
                }
            },
            {
                shipmentId: 'shipment-2',
                shippingMethod: {
                    c_storePickupEnabled: false
                }
            }
        ],
        productItems: [
            {
                productId: 'product-1',
                shipmentId: 'shipment-1',
                price: 29.99
            },
            {
                productId: 'product-2',
                shipmentId: 'shipment-2',
                price: 49.99
            }
        ]
    }

    const mockProductItemsMap = {
        'product-1': {
            name: 'Test Product 1',
            image: 'test-image-1.jpg'
        },
        'product-2': {
            name: 'Test Product 2',
            image: 'test-image-2.jpg'
        }
    }

    const defaultProps = {
        order: mockOrder,
        productItemsMap: mockProductItemsMap,
        currency: 'USD'
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders component with pickup and delivery items', () => {
        renderWithProviders(<MultiShipOrderSummary {...defaultProps} />)

        // Check that pickup and delivery sections are rendered
        expect(screen.getByText('Pickup Items')).toBeInTheDocument()
        expect(screen.getByText('Delivery Items')).toBeInTheDocument()
    })

    test('does not render pickup section when no pickup shipments exist', () => {
        const orderWithNoPickups = {
            ...mockOrder,
            shipments: [
                {
                    shipmentId: 'delivery-1',
                    shippingMethod: {c_storePickupEnabled: false}
                }
            ],
            productItems: [
                {
                    productId: 'product-1',
                    shipmentId: 'delivery-1',
                    price: 29.99
                }
            ]
        }

        renderWithProviders(<MultiShipOrderSummary {...defaultProps} order={orderWithNoPickups} />)

        expect(screen.queryByText('Pickup Items')).not.toBeInTheDocument()
        expect(screen.getByText('Delivery Items')).toBeInTheDocument()
    })

    test('does not render delivery section when no delivery shipments exist', () => {
        const orderWithNoDeliveries = {
            ...mockOrder,
            shipments: [
                {
                    shipmentId: 'pickup-1',
                    shippingMethod: {c_storePickupEnabled: true}
                }
            ],
            productItems: [
                {
                    productId: 'product-1',
                    shipmentId: 'pickup-1',
                    price: 29.99
                }
            ]
        }

        renderWithProviders(
            <MultiShipOrderSummary {...defaultProps} order={orderWithNoDeliveries} />
        )

        expect(screen.getByText('Pickup Items')).toBeInTheDocument()
        expect(screen.queryByText('Delivery Items')).not.toBeInTheDocument()
    })
})
