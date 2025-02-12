/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act} from 'react'
import {renderHook} from '@testing-library/react'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD
} from '@salesforce/retail-react-app/app/constants'

jest.mock('./use-multi-site', () => jest.fn())
useMultiSite.mockImplementation(() => ({site: {id: mockConfig.app.defaultSite}}))

beforeEach(() => {
    localStorage.clear()
    jest.spyOn(window.localStorage, 'setItem')
})

describe('useStoreLocator', () => {
    test('initial state with no store selected', () => {
        const {result} = renderHook(() => useStoreLocator())
        expect(result.current.selectedStore).toEqual({})
        expect(result.current.isStoreSelected).toBe(false)
    })

    test('selecting a store', () => {
        const store = {
            id: 'test-store',
            name: 'Test Store',
            inventoryId: 'inventory'
        }
        const expectedStoreData = JSON.stringify(store)

        const {result} = renderHook(() => useStoreLocator())

        act(() => {
            result.current.setStore(store)
        })

        expect(result.current.selectedStore).toEqual(store)
        expect(result.current.isStoreSelected).toBe(true)
        expect(localStorage.setItem).toHaveBeenCalledWith(
            `store_${mockConfig.app.defaultSite}`,
            expectedStoreData
        )
    })

    test('set user has set manual geolocation', () => {
        const {result} = renderHook(() => useStoreLocator())
        expect(result.current.userHasSetManualGeolocation).toBe(false)
        act(() => {
            result.current.setUserHasSetManualGeolocation(true)
        })
        expect(result.current.userHasSetManualGeolocation).toBe(true)
    })

    test('set automatic geolocation has failed', () => {
        const {result} = renderHook(() => useStoreLocator())
        expect(result.current.automaticGeolocationHasFailed).toBe(false)
        act(() => {
            result.current.setAutomaticGeolocationHasFailed(true)
        })
        expect(result.current.automaticGeolocationHasFailed).toBe(true)
    })

    test('set user wants to share location', () => {
        const {result} = renderHook(() => useStoreLocator())
        expect(result.current.userWantsToShareLocation).toBe(false)
        act(() => {
            result.current.setUserWantsToShareLocation(true)
        })
        expect(result.current.userWantsToShareLocation).toBe(true)
    })

    test('set search stores params', () => {
        const {result} = renderHook(() => useStoreLocator())
        expect(result.current.searchStoresParams).toEqual({
            countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
            postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
            limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
        })

        const newSearchStoresParams = {
            countryCode: 'US',
            postalCode: '94105',
            limit: 10
        }

        act(() => {
            result.current.setSearchStoresParams(newSearchStoresParams)
        })

        expect(result.current.searchStoresParams).toEqual(newSearchStoresParams)
    })
})
