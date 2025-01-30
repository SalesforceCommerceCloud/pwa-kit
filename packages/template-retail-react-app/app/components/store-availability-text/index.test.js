/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import StoreAvailabilityText from '@salesforce/retail-react-app/app/components/store-availability-text'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/components/store-locator-modal'

const selectedStore = {
    name: 'Test Store',
    id: 'test_store',
    inventoryId: 'inventory_1'
}

const renderWithStoreLocatorContextProvider = (selectedStore, productInventories = []) => {
    return renderWithProviders(
        <StoreLocatorContext.Provider value={{ selectedStore, isStoreSelected: true }}>
            <StoreAvailabilityText productInventories={productInventories} />
        </StoreLocatorContext.Provider>
    )
}

describe('StoreAvailability', () => {
    describe('store is not selected', () => {
        test('renders "In Stock at Select Store"', () => {
            renderWithProviders(
                <StoreLocatorContext.Provider value={{ selectedStore: {} }}>
                    <StoreAvailabilityText />
                </StoreLocatorContext.Provider>
            )
            expect(screen.getByText(/In Stock at/i)).toBeInTheDocument()
            expect(screen.getByText(/Select Store/i)).toBeInTheDocument()
        })
    })

    describe('store is selected', () => {
        test('renders "Out of Stock at Test Store" when productInventories is undefined', () => {
            renderWithStoreLocatorContextProvider(selectedStore)
            expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
            expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
        })

        test('renders "Out of Stock at Test Store" when selectedStore does not have an inventoryId', () => {
            renderWithStoreLocatorContextProvider({ ...selectedStore, inventoryId: null })
            expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
            expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
        })

        test('renders "Out of Stock at Test Store" if selectedStore inventoryId is not in productInventories', () => {
            renderWithStoreLocatorContextProvider(selectedStore, [{ id: 'inventory_99', orderable: true }])
            expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
            expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
        })

        test('renders "Out of Stock at Test Store" if orderable is false', () => {
            renderWithStoreLocatorContextProvider(selectedStore, [{ id: 'inventory_1', orderable: false }])
            expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
            expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
        })

        test('renders "In Stock at Test Store" if orderable is true', () => {
            renderWithStoreLocatorContextProvider(selectedStore, [{ id: 'inventory_1', orderable: true }])
            expect(screen.getByText(/In Stock at/i)).toBeInTheDocument()
            expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
        })
    })
})

