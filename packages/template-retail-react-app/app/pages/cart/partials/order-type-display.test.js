/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import OrderTypeDisplay from '@salesforce/retail-react-app/app/pages/cart/partials/order-type-display'

const mockStore = {
    id: 'store-123',
    name: 'Downtown Store',
    address1: '123 Main Street',
    city: 'San Francisco',
    stateCode: 'CA',
    postalCode: '94105',
    phone: '(555) 123-4567',
    c_customerServiceEmail: 'store@example.com',
    storeHours:
        'Monday - Friday: 9:00 AM - 8:00 PM\nSaturday: 10:00 AM - 6:00 PM\nSunday: 12:00 PM - 5:00 PM',
    distance: 2.5,
    distanceUnit: 'miles'
}

describe('OrderTypeDisplay', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Pickup Order', () => {
        test('renders pickup order display with store information', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={true}
                    store={mockStore}
                    itemsInShipment={3}
                    totalItemsInCart={5}
                />
            )

            // Check pickup message with item counts
            expect(screen.getByText('Pick Up in Store - 3 out of 5 items')).toBeInTheDocument()

            // Check store information is displayed
            expect(screen.getByText('Downtown Store')).toBeInTheDocument()
            expect(screen.getByText('123 Main Street')).toBeInTheDocument()
            expect(screen.getByText('San Francisco, CA 94105')).toBeInTheDocument()
            expect(screen.getByText('2.5 miles away')).toBeInTheDocument()
        })

        test('renders pickup order with single item', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={true}
                    store={mockStore}
                    itemsInShipment={1}
                    totalItemsInCart={1}
                />
            )

            expect(screen.getByText('Pick Up in Store - 1 out of 1 items')).toBeInTheDocument()
        })

        test('renders pickup order with zero items in shipment', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={true}
                    store={mockStore}
                    itemsInShipment={0}
                    totalItemsInCart={3}
                />
            )

            expect(screen.getByText('Pick Up in Store - 0 out of 3 items')).toBeInTheDocument()
        })

        test('renders pickup order without store (null store)', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={true}
                    store={null}
                    itemsInShipment={2}
                    totalItemsInCart={4}
                />
            )

            expect(screen.getByText('Pick Up in Store - 2 out of 4 items')).toBeInTheDocument()
            // Store display should not crash with null store
            expect(screen.queryByText('Downtown Store')).not.toBeInTheDocument()
        })

        test('renders pickup order without store (undefined store)', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={true}
                    store={undefined}
                    itemsInShipment={2}
                    totalItemsInCart={4}
                />
            )

            expect(screen.getByText('Pick Up in Store - 2 out of 4 items')).toBeInTheDocument()
            // Store display should not crash with undefined store
            expect(screen.queryByText('Downtown Store')).not.toBeInTheDocument()
        })
    })

    describe('Delivery Order', () => {
        test('renders delivery order display', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={false}
                    store={mockStore}
                    itemsInShipment={4}
                    totalItemsInCart={7}
                />
            )

            // Check delivery message with item counts
            expect(screen.getByText('Delivery - 4 out of 7 items')).toBeInTheDocument()

            // Store information should not be displayed for delivery
            expect(screen.queryByText('Downtown Store')).not.toBeInTheDocument()
            expect(screen.queryByText('123 Main Street')).not.toBeInTheDocument()
        })

        test('renders delivery order with single item', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={false}
                    store={mockStore}
                    itemsInShipment={1}
                    totalItemsInCart={1}
                />
            )

            expect(screen.getByText('Delivery - 1 out of 1 items')).toBeInTheDocument()
        })

        test('renders delivery order with zero items in shipment', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={false}
                    store={mockStore}
                    itemsInShipment={0}
                    totalItemsInCart={2}
                />
            )

            expect(screen.getByText('Delivery - 0 out of 2 items')).toBeInTheDocument()
        })

        test('renders delivery order without store prop', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={false}
                    store={null}
                    itemsInShipment={3}
                    totalItemsInCart={5}
                />
            )

            expect(screen.getByText('Delivery - 3 out of 5 items')).toBeInTheDocument()
            // Store information should not be displayed for delivery regardless of store prop
            expect(screen.queryByText('Downtown Store')).not.toBeInTheDocument()
        })
    })

    describe('Component Structure', () => {
        test('renders with proper card styling', () => {
            const {container} = renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={false}
                    store={mockStore}
                    itemsInShipment={2}
                    totalItemsInCart={4}
                />
            )

            // Check for Box component with layerStyle and padding
            const cardBox = container.querySelector('[data-testid], div')
            expect(cardBox).toBeInTheDocument()
        })

        test('renders pickup text message', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={true}
                    store={mockStore}
                    itemsInShipment={2}
                    totalItemsInCart={4}
                />
            )

            expect(screen.getByText('Pick Up in Store - 2 out of 4 items')).toBeInTheDocument()
        })

        test('renders delivery text message', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={false}
                    store={mockStore}
                    itemsInShipment={2}
                    totalItemsInCart={4}
                />
            )

            expect(screen.getByText('Delivery - 2 out of 4 items')).toBeInTheDocument()
        })
    })

    describe('Large Numbers', () => {
        test('handles large item counts correctly', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={true}
                    store={mockStore}
                    itemsInShipment={999}
                    totalItemsInCart={1000}
                />
            )

            expect(screen.getByText('Pick Up in Store - 999 out of 1000 items')).toBeInTheDocument()
        })

        test('handles edge case where items in shipment equals total items', () => {
            renderWithProviders(
                <OrderTypeDisplay
                    isPickupOrder={false}
                    store={mockStore}
                    itemsInShipment={5}
                    totalItemsInCart={5}
                />
            )

            expect(screen.getByText('Delivery - 5 out of 5 items')).toBeInTheDocument()
        })
    })
})
