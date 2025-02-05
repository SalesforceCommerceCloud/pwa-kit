/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import PropTypes from 'prop-types'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'

const MockComponent = ({store} = {}) => {
    const {
        selectedStore,
        setStore,
        isStoreSelected,
        userHasSetManualGeolocation,
        setUserHasSetManualGeolocation,
        automaticGeolocationHasFailed,
        setAutomaticGeolocationHasFailed,
        userWantsToShareLocation,
        setUserWantsToShareLocation,
        searchStoresParams,
        setSearchStoresParams
    } = useStoreLocator()

    return (
        <>
            <div data-testid="selected-store">{JSON.stringify(selectedStore)}</div>
            <div data-testid="is-store-selected">{isStoreSelected.toString()}</div>
            <button data-testid="set-store" onClick={() => setStore(store)} />
            <div data-testid="user-has-set-manual-geolocation">
                {userHasSetManualGeolocation.toString()}
            </div>
            <button
                data-testid="set-user-has-set-manual-geolocation"
                onClick={() => setUserHasSetManualGeolocation(true)}
            />
            <div data-testid="automatic-geolocation-has-failed">
                {automaticGeolocationHasFailed.toString()}
            </div>
            <button
                data-testid="set-automatic-geolocation-has-failed"
                onClick={() => setAutomaticGeolocationHasFailed(true)}
            />
            <div data-testid="user-wants-to-share-location">
                {userWantsToShareLocation.toString()}
            </div>
            <button
                data-testid="set-user-wants-to-share-location"
                onClick={() => setUserWantsToShareLocation(true)}
            />
            <div data-testid="search-stores-params">{JSON.stringify(searchStoresParams)}</div>
            <button
                data-testid="set-search-stores-params"
                onClick={() =>
                    setSearchStoresParams({
                        countryCode: 'US',
                        postalCode: '94105',
                        limit: 10
                    })
                }
            />
        </>
    )
}
MockComponent.propTypes = {
    store: PropTypes.object
}

describe('useStoreLocator', () => {
    test('initial state with no store selected', () => {
        renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('selected-store')).toHaveTextContent(/{}/i)
        expect(screen.getByTestId('is-store-selected')).toHaveTextContent(/false/i)
    })

    test('selecting a store', () => {
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
        expect(localStorage.getItem(`store_${mockConfig.app.defaultSite}`)).toEqual(
            expectedStoreData
        )
    })

    test('set user has set manual geolocation', () => {
        renderWithProviders(<MockComponent />)
        fireEvent.click(screen.getByTestId('set-user-has-set-manual-geolocation'))
        expect(screen.getByTestId('user-has-set-manual-geolocation')).toHaveTextContent(/true/i)
    })

    test('set automatic geolocation has failed', () => {
        renderWithProviders(<MockComponent />)
        fireEvent.click(screen.getByTestId('set-automatic-geolocation-has-failed'))
        expect(screen.getByTestId('automatic-geolocation-has-failed')).toHaveTextContent(/true/i)
    })

    test('set user wants to share location', () => {
        renderWithProviders(<MockComponent />)
        fireEvent.click(screen.getByTestId('set-user-wants-to-share-location'))
        expect(screen.getByTestId('user-wants-to-share-location')).toHaveTextContent(/true/i)
    })

    test('set search stores params', () => {
        renderWithProviders(<MockComponent />)
        fireEvent.click(screen.getByTestId('set-search-stores-params'))
        expect(screen.getByTestId('search-stores-params')).toHaveTextContent(
            JSON.stringify({
                countryCode: 'US',
                postalCode: '94105',
                limit: 10
            })
        )
    })
})
