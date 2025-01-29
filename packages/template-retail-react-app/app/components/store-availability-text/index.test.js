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

const selectedStore = {
    name: 'Test Store',
    id: 'test_store',
    inventoryId: 'inventory_1'
}

describe('Store Name Rendering', () => {
    test('renders "Select Store" if selectedStore does not contain a name field', () => {
        renderWithProviders(<StoreAvailabilityText selectedStore={{}} />)
        expect(screen.getByText(/Select Store/i)).toBeInTheDocument()
    })

    test('renders store name if selectedStore contains a name field', () => {
        renderWithProviders(<StoreAvailabilityText selectedStore={selectedStore} />)
        expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
    })
})

describe('Stock Availability Rendering', () => {
    test('renders "In Stock" when productInventories is undefined', () => {
        renderWithProviders(<StoreAvailabilityText selectedStore={selectedStore} />)
        expect(screen.getByText(/In Stock at/i)).toBeInTheDocument()
    })

    test('renders "In Stock" if orderable is true', () => {
        renderWithProviders(
            <StoreAvailabilityText
                selectedStore={selectedStore}
                productInventories={[{id: 'inventory_1', orderable: true}]}
            />
        )
        expect(screen.getByText(/In Stock at/i)).toBeInTheDocument()
    })

    test('renders "Out of Stock" if orderable is false', () => {
        renderWithProviders(
            <StoreAvailabilityText
                selectedStore={selectedStore}
                productInventories={[{id: 'inventory_1', orderable: false}]}
            />
        )
        expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
    })

    test('renders "Out of Stock" if selectedStore inventoryId is not in productInventories', () => {
        renderWithProviders(
            <StoreAvailabilityText
                selectedStore={selectedStore}
                productInventories={[{id: 'inventory_99', orderable: true}]}
            />
        )
        expect(screen.getByText(/Out of Stock at/i)).toBeInTheDocument()
    })
})
