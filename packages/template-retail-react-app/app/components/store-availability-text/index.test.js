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

describe('Store Name Rendering', () => {
    test('renders "Select Store" if selectedStore does not contain a name field', () => {
        renderWithProviders(
            <StoreLocatorContext.Provider value={{selectedStore: {}}}>
                <StoreAvailabilityText />
            </StoreLocatorContext.Provider>
        )
        expect(screen.getByText(/Select Store/i)).toBeInTheDocument()
    })

    test('renders store name if selectedStore contains a name field', () => {
        renderWithProviders(
            <StoreLocatorContext.Provider value={{selectedStore}}>
                <StoreAvailabilityText />
            </StoreLocatorContext.Provider>
        )
        expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
    })
})

describe('Stock Availability Rendering', () => {
    test('renders "In Stock" when productInventories is undefined', () => {
        renderWithProviders(
            <StoreLocatorContext.Provider value={{selectedStore}}>
                <StoreAvailabilityText />
            </StoreLocatorContext.Provider>
        )
        expect(screen.getByText(/In Stock at/i)).toBeInTheDocument()
    })
    test

    test('renders "In Stock" if orderable is true', () => {
        renderWithProviders(
            <StoreLocatorContext.Provider value={{selectedStore}}>
                <StoreAvailabilityText
                    productInventories={[{id: 'inventory_1', orderable: true}]}
                />
            </StoreLocatorContext.Provider>
        )
        expect(screen.getByText(/In Stock at/i)).toBeInTheDocument()
    })

    test('renders "Out of Stock" if orderable is false', () => {
        renderWithProviders(
            <StoreLocatorContext.Provider value={{selectedStore}}>
                <StoreAvailabilityText
                    productInventories={[{id: 'inventory_1', orderable: false}]}
                />
            </StoreLocatorContext.Provider>
        )
        expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
    })

    test('renders "Out of Stock" if selectedStore inventoryId is not in productInventories', () => {
        renderWithProviders(
            <StoreLocatorContext.Provider value={{selectedStore}}>
                <StoreAvailabilityText
                    productInventories={[{id: 'inventory_99', orderable: true}]}
                />
            </StoreLocatorContext.Provider>
        )
        expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
    })
})
