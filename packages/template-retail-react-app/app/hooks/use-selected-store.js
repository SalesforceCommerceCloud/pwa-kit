/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {useStores} from '@salesforce/commerce-sdk-react'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'

/**
 * Custom hook to get the selected store from StoreLocatorContext and retrieve store details
 * @returns {Object} Object containing store data, loading state, and error state
 */
export const useSelectedStore = () => {
    const context = useContext(StoreLocatorContext)

    if (!context) {
        throw new Error('useSelectedStore must be used within a StoreLocatorProvider')
    }

    const {state} = context
    const selectedStoreId = state.selectedStoreId

    // Use the useStores hook to fetch store details by ID
    const {data: storeData, ...restOfQuery} = useStores(
        {
            parameters: {
                ids: selectedStoreId
            }
        },
        {
            enabled: !!selectedStoreId
        }
    )

    // Extract the first store from the response data
    const selectedStore = storeData?.data?.[0]

    return {
        ...restOfQuery,
        selectedStore,
        hasSelectedStore: !!selectedStoreId
    }
}
