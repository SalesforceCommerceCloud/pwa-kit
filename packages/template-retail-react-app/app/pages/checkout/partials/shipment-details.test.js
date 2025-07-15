/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import ShipmentDetails from '@salesforce/retail-react-app/app/pages/checkout/partials/shipment-details'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// Mock the useStores hook
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useStores: jest.fn()
}))

import {useStores} from '@salesforce/commerce-sdk-react'

describe('ShipmentDetails', () => {
    const mockStoresData = {
        data: [
            {
                id: 'store-001',
                name: 'Downtown Store',
                address1: '123 Main Street',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94105',
                countryCode: 'US',
                phone: '(555) 123-4567',
                c_customerServiceEmail: 'downtown@example.com',
                storeHours:
                    'Monday - Friday: 9:00 AM - 8:00 PM\nSaturday: 10:00 AM - 6:00 PM\nSunday: 12:00 PM - 5:00 PM',
                storeType: 'retail'
            },
            {
                id: 'store-002',
                name: 'Uptown Store',
                address1: '456 Oak Avenue',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94102',
                countryCode: 'US',
                phone: '(555) 987-6543',
                c_customerServiceEmail: 'uptown@example.com',
                storeHours:
                    'Monday - Friday: 10:00 AM - 9:00 PM\nSaturday: 11:00 AM - 7:00 PM\nSunday: 1:00 PM - 6:00 PM',
                storeType: 'retail'
            }
        ]
    }

    const mockPickupShipment = {
        shipmentId: 'pickup-1',
        c_fromStoreId: 'store-001',
        shippingMethod: {
            c_storePickupEnabled: true,
            name: 'Store Pickup',
            description: 'Pick up at store location'
        }
    }

    const mockDeliveryShipment = {
        shipmentId: 'delivery-1',
        shippingMethod: {
            c_storePickupEnabled: false,
            name: 'Standard Shipping',
            description: '3-5 business days'
        },
        shippingAddress: {
            address1: '123 Delivery Street',
            city: 'San Francisco',
            stateCode: 'CA',
            postalCode: '94105',
            countryCode: 'US'
        }
    }

    const defaultProps = {
        shipments: [mockPickupShipment, mockDeliveryShipment]
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Default mock implementation for useStores
        useStores.mockReturnValue({
            data: mockStoresData,
            isLoading: false,
            error: null
        })
    })

    test('renders component with pickup and delivery sections', () => {
        renderWithProviders(<ShipmentDetails {...defaultProps} />)

        expect(screen.getByText('Pickup Details')).toBeInTheDocument()
        expect(screen.getByText('Delivery Details')).toBeInTheDocument()
    })

    test('renders pickup location information when store data is available', () => {
        renderWithProviders(<ShipmentDetails {...defaultProps} />)

        expect(screen.getByText('Pickup Address')).toBeInTheDocument()
        expect(screen.getByText('Downtown Store')).toBeInTheDocument()
        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
    })

    test('renders delivery address and shipping method information', () => {
        renderWithProviders(<ShipmentDetails {...defaultProps} />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByText('Shipping Method')).toBeInTheDocument()
        expect(screen.getByText('123 Delivery Street')).toBeInTheDocument()
        expect(screen.getByText('Standard Shipping')).toBeInTheDocument()
        expect(screen.getByText('3-5 business days')).toBeInTheDocument()
    })

    test('renders pickup location numbers when multiple pickup shipments exist', () => {
        const multiplePickupShipments = [
            {
                ...mockPickupShipment,
                c_fromStoreId: 'store-001'
            },
            {
                ...mockPickupShipment,
                shipmentId: 'pickup-2',
                c_fromStoreId: 'store-002'
            }
        ]

        renderWithProviders(<ShipmentDetails shipments={multiplePickupShipments} />)

        expect(screen.getByText('Pickup Location 1')).toBeInTheDocument()
        expect(screen.getByText('Pickup Location 2')).toBeInTheDocument()
    })

    test('renders delivery numbers when multiple delivery shipments exist', () => {
        const multipleDeliveryShipments = [
            mockDeliveryShipment,
            {
                ...mockDeliveryShipment,
                shipmentId: 'delivery-2',
                shippingAddress: {
                    address1: '456 Second Street',
                    city: 'Los Angeles',
                    stateCode: 'CA',
                    postalCode: '90210',
                    countryCode: 'US'
                }
            }
        ]

        renderWithProviders(<ShipmentDetails shipments={multipleDeliveryShipments} />)

        expect(screen.getByText('Delivery 1')).toBeInTheDocument()
        expect(screen.getByText('Delivery 2')).toBeInTheDocument()
    })

    test('shows store information unavailable message when store data is not available', () => {
        useStores.mockReturnValue({
            data: null,
            isLoading: false,
            error: null
        })

        renderWithProviders(<ShipmentDetails shipments={[mockPickupShipment]} />)

        expect(screen.getByText("Store information isn't available")).toBeInTheDocument()
    })

    test('does not render pickup section when no pickup shipments exist', () => {
        const deliveryOnlyShipments = [mockDeliveryShipment]

        renderWithProviders(<ShipmentDetails shipments={deliveryOnlyShipments} />)

        expect(screen.queryByText('Pickup Details')).not.toBeInTheDocument()
        expect(screen.getByText('Delivery Details')).toBeInTheDocument()
    })

    test('does not render delivery section when no delivery shipments exist', () => {
        const pickupOnlyShipments = [mockPickupShipment]

        renderWithProviders(<ShipmentDetails shipments={pickupOnlyShipments} />)

        expect(screen.getByText('Pickup Details')).toBeInTheDocument()
        expect(screen.queryByText('Delivery Details')).not.toBeInTheDocument()
    })

    test('handles shipments without store IDs gracefully', () => {
        const shipmentWithoutStoreId = {
            ...mockPickupShipment,
            c_fromStoreId: null
        }

        renderWithProviders(<ShipmentDetails shipments={[shipmentWithoutStoreId]} />)

        expect(screen.getByText('Pickup Details')).toBeInTheDocument()
        expect(screen.getByText("Store information isn't available")).toBeInTheDocument()
    })

    test('calls useStores with correct parameters for pickup shipments', () => {
        const pickupShipments = [
            {
                ...mockPickupShipment,
                c_fromStoreId: 'store-001'
            },
            {
                ...mockPickupShipment,
                shipmentId: 'pickup-2',
                c_fromStoreId: 'store-002'
            }
        ]

        renderWithProviders(<ShipmentDetails shipments={pickupShipments} />)

        expect(useStores).toHaveBeenCalledWith(
            {
                parameters: {
                    ids: 'store-001,store-002'
                }
            },
            {
                enabled: true
            }
        )
    })

    test('does not call useStores when no pickup shipments exist', () => {
        const deliveryOnlyShipments = [mockDeliveryShipment]

        renderWithProviders(<ShipmentDetails shipments={deliveryOnlyShipments} />)

        expect(useStores).toHaveBeenCalledWith(
            {
                parameters: {
                    ids: ''
                }
            },
            {
                enabled: false
            }
        )
    })
})
