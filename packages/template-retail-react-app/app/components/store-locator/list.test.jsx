/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {StoreLocatorList} from '@salesforce/retail-react-app/app/components/store-locator/list'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'

// Mock the useStoreLocator hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-store-locator')

// Mock store data
const mockStores = {
    total: 3,
    data: [
        {
            id: 'store-1',
            name: 'Store 1',
            address1: '123 Main St',
            city: 'Boston',
            stateCode: 'MA',
            postalCode: '02108',
            phone: '555-0123'
        },
        {
            id: 'store-2',
            name: 'Store 2',
            address1: '456 Oak St',
            city: 'Boston',
            stateCode: 'MA',
            postalCode: '02109',
            phone: '555-0124'
        },
        {
            id: 'store-3',
            name: 'Store 3',
            address1: '789 Pine St',
            city: 'Boston',
            stateCode: 'MA',
            postalCode: '02110',
            phone: '555-0125'
        }
    ]
}

const defaultConfig = {
    radius: 10,
    radiusUnit: 'mi',
    defaultPageSize: 2,
    defaultCountry: 'United States',
    supportedCountries: [{countryCode: 'US', countryName: 'United States'}]
}

describe('StoreLocatorList', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    test('renders loading state', () => {
        useStoreLocator.mockReturnValue({
            isLoading: true,
            data: null,
            config: defaultConfig,
            formValues: {},
            mode: 'input'
        })

        renderWithProviders(<StoreLocatorList />)
        expect(screen.getByText('Loading locations...')).toBeTruthy()
    })

    test('renders no locations message', () => {
        useStoreLocator.mockReturnValue({
            isLoading: false,
            data: {total: 0, data: []},
            config: defaultConfig,
            formValues: {},
            mode: 'input'
        })

        renderWithProviders(<StoreLocatorList />)
        expect(screen.getByText('Sorry, there are no locations in this area.')).toBeTruthy()
    })

    test('renders stores with pagination', () => {
        useStoreLocator.mockReturnValue({
            isLoading: false,
            data: mockStores,
            config: defaultConfig,
            formValues: {countryCode: 'US'},
            mode: 'input'
        })

        renderWithProviders(<StoreLocatorList />)

        // Initially shows only first 2 stores (defaultPageSize)
        expect(screen.getByText('Store 1')).toBeTruthy()
        expect(screen.getByText('Store 2')).toBeTruthy()
        expect(screen.queryByText('Store 3')).toBeNull()

        // Load more button should be visible
        const loadMoreButton = screen.getByText('Load More')
        expect(loadMoreButton).toBeTruthy()

        // Click load more
        fireEvent.click(loadMoreButton)

        // Should now show all 3 stores
        expect(screen.getByText('Store 1')).toBeTruthy()
        expect(screen.getByText('Store 2')).toBeTruthy()
        expect(screen.getByText('Store 3')).toBeTruthy()
    })

    test('renders correct status message for input mode', () => {
        useStoreLocator.mockReturnValue({
            isLoading: false,
            data: mockStores,
            config: defaultConfig,
            formValues: {countryCode: 'US'},
            mode: 'input'
        })

        renderWithProviders(<StoreLocatorList />)
        expect(
            screen.getByText(/Viewing stores within 10 mi of 02108 in United States/)
        ).toBeTruthy()
    })

    test('renders correct status message for geolocation mode', () => {
        useStoreLocator.mockReturnValue({
            isLoading: false,
            data: mockStores,
            config: defaultConfig,
            formValues: {},
            mode: 'geolocation'
        })

        renderWithProviders(<StoreLocatorList />)
        expect(screen.getByText('Viewing stores near your location')).toBeTruthy()
    })
})
