/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {fireEvent, screen} from '@testing-library/react'
import PropTypes from 'prop-types'
import {useSelectStore} from '@salesforce/retail-react-app/app/hooks/use-select-store'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

const MockComponent = ({store} = {}) => {
    const {selectedStore, setStore, isStoreSelected} = useSelectStore()

    return (
        <>
            <div data-testid="selected-store">{JSON.stringify(selectedStore)}</div>
            <div data-testid="is-store-selected">{isStoreSelected.toString()}</div>
            <button data-testid="set-store" onClick={() => setStore(store)} />
        </>
    )
}
MockComponent.propTypes = {
    store: PropTypes.object
}

test('no store selected', () => {
    renderWithProviders(<MockComponent />)
    expect(screen.getByTestId('selected-store')).toHaveTextContent(/{}/i)
    expect(screen.getByTestId('is-store-selected')).toHaveTextContent(/false/i)
})

test('store selected', () => {
    const store = {
        id: 'test-store',
        name: 'Test Store',
        inventoryId: 'inventory'
    }

    const expectedStoreData = JSON.stringify(store)

    renderWithProviders(<MockComponent store={store} />)
    fireEvent.click(screen.getByTestId('set-store'))

    expect(screen.getByTestId('selected-store')).toHaveTextContent(expectedStoreData)
    expect(screen.getByTestId('is-store-selected')).toHaveTextContent(/true/i)
    expect(localStorage.getItem(`store_${mockConfig.app.defaultSite}`)).toEqual(expectedStoreData)
})
