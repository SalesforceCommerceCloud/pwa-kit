/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, createContext} from 'react'
import PropTypes from 'prop-types'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

const readValue = (key) => {
    if (typeof window === 'undefined') {
        return null
    }
    return window.localStorage.getItem(key)
}

export const StoreLocatorContext = createContext(null)

export const StoreLocatorProvider = ({config, children}) => {
    // remember the shopper's preferred store for the current site
    // TODO: Change this to `useLocalStorage` hook when localStorage detection is more robust
    const {site} = useMultiSite()
    const siteId = `selectedStore_${site?.id}`
    const selectedStoreId = readValue(siteId)

    const [state, setState] = useState({
        mode: 'input',
        formValues: {
            countryCode: config.defaultCountryCode,
            postalCode: config.defaultPostalCode
        },
        deviceCoordinates: {
            latitude: null,
            longitude: null
        },
        selectedStoreId,
        isSeSelection: false,
        config
    })

    useEffect(() => {
        if (typeof window !== 'undefined' && state.selectedStoreId) {
            window.localStorage.setItem(siteId, state.selectedStoreId)
        }
    }, [state.selectedStoreId])

    const value = {
        state,
        setState
    }

    return <StoreLocatorContext.Provider value={value}>{children}</StoreLocatorContext.Provider>
}

StoreLocatorProvider.propTypes = {
    config: PropTypes.shape({
        defaultCountryCode: PropTypes.string.isRequired,
        defaultPostalCode: PropTypes.string.isRequired
    }).isRequired,
    children: PropTypes.node
}
