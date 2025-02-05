/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'

// Hooks
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Others
import {
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD
} from '@salesforce/retail-react-app/app/constants'

/*
 * This hook returns all store locator search and selection parameters
 * relevant to the StoreLocator component.
 */
export const useStoreLocator = () => {
    // Store Locator
    const [userHasSetManualGeolocation, setUserHasSetManualGeolocation] = useState(false)
    const [automaticGeolocationHasFailed, setAutomaticGeolocationHasFailed] = useState(false)
    const [userWantsToShareLocation, setUserWantsToShareLocation] = useState(false)

    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
    })

    // Store Selection
    const {site} = useMultiSite()
    const storeInfoKey = `store_${site.id}`
    const [selectedStore, setSelectedStore] = useState({})

    useEffect(() => {
        setSelectedStore(JSON.parse(window.localStorage.getItem(storeInfoKey)) || {})
    }, [storeInfoKey])

    const setStore = (store) => {
        const storeInfo = {
            id: store.id,
            name: store.name || null,
            inventoryId: store.inventoryId || null
        }
        window.localStorage.setItem(storeInfoKey, JSON.stringify(storeInfo))
        setSelectedStore(storeInfo)
    }

    return {
        userHasSetManualGeolocation,
        setUserHasSetManualGeolocation,
        automaticGeolocationHasFailed,
        setAutomaticGeolocationHasFailed,
        userWantsToShareLocation,
        setUserWantsToShareLocation,
        searchStoresParams,
        setSearchStoresParams,
        selectedStore,
        setStore,
        isStoreSelected: !!selectedStore.id
    }
}
