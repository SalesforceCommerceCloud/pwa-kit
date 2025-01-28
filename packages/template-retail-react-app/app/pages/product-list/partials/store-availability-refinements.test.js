/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {fireEvent, screen} from '@testing-library/react'

import {Accordion} from '@salesforce/retail-react-app/app/components/shared/ui'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import StoreAvailabilityRefinement from '@salesforce/retail-react-app/app/pages/product-list/partials/store-availability-refinement'
import {useSelectStore} from '@salesforce/retail-react-app/app/hooks/use-select-store';

jest.mock('@salesforce/retail-react-app/app/hooks/use-select-store', () => ({
    useSelectStore: jest.fn()
}));

const toggleFilter = jest.fn()

const WrappedComponent = (props) => {
    return <Accordion><StoreAvailabilityRefinement {...props} /></Accordion>
}

const selectedStore = {name: 'Test Store', id: 'test_store', inventoryId: '123'}

describe('StoreAvailabilityRefinement', function () {
    beforeEach(() => {
        jest.clearAllMocks()
    });

    test('renders properly when there is no selected store', () => {
        useSelectStore.mockReturnValue({
            selectedStore: {},
            isStoreSelected: false
        });

        renderWithProviders(
            <WrappedComponent
                toggleFilter={toggleFilter}
                selectedFilters={[]}
            />
        )
        expect(screen.getByText(/Shop By Availability/i)).toBeInTheDocument()
        expect(screen.getByText(/Select Store/i)).toBeInTheDocument()
    })

    test('renders properly when there is a selected store', async () => {
        useSelectStore.mockReturnValue({
            selectedStore: selectedStore,
            isStoreSelected: true
        });

        renderWithProviders(
            <WrappedComponent
                toggleFilter={toggleFilter}
                selectedFilters={[]}
            />
        )
        expect(screen.getByText(/Shop By Availability/i)).toBeInTheDocument()
        expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
    })
})
