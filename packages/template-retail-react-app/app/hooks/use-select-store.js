/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState} from 'react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

/**
 * Custom React hook to set and get the current store
 * @returns {{selectedStore: string, setStore: function}[]}
 */
export const useSelectStore = () => {
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

    return {selectedStore, setStore, isStoreSelected: !!selectedStore.id}
}
