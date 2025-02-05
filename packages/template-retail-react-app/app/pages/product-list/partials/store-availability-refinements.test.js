/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import PropTypes from 'prop-types'

import {Accordion} from '@salesforce/retail-react-app/app/components/shared/ui'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import StoreAvailabilityRefinement from '@salesforce/retail-react-app/app/pages/product-list/partials/store-availability-refinement'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/components/store-locator-modal'

const toggleFilter = jest.fn()

const MockComponent = ({selectedStore, isStoreSelected, ...props}) => {
    return (
        <Accordion>
            <StoreLocatorContext.Provider value={{selectedStore, isStoreSelected}}>
                <StoreAvailabilityRefinement {...props} />
            </StoreLocatorContext.Provider>
        </Accordion>
    )
}
MockComponent.propTypes = {
    selectedStore: PropTypes.object,
    isStoreSelected: PropTypes.bool
}

const selectedStore = {name: 'Test Store', id: 'test_store', inventoryId: '123'}

describe('StoreAvailabilityRefinement', function () {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders properly when there is no selected store', () => {
        renderWithProviders(
            <MockComponent
                selectedStore={{}}
                isStoreSelected={false}
                toggleFilter={toggleFilter}
                selectedFilters={[]}
            />
        )
        expect(screen.getByText(/Shop By Availability/i)).toBeInTheDocument()
        expect(screen.getByText(/Select Store/i)).toBeInTheDocument()
    })

    test('renders properly when there is a selected store', async () => {
        renderWithProviders(
            <MockComponent
                selectedStore={selectedStore}
                isStoreSelected={true}
                toggleFilter={toggleFilter}
                selectedFilters={[]}
            />
        )
        expect(screen.getByText(/Shop By Availability/i)).toBeInTheDocument()
        expect(screen.getByText(selectedStore.name)).toBeInTheDocument()
    })
})
