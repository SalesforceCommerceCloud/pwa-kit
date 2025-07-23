/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, createContext} from 'react'
import {useLocation} from 'react-router-dom'
import PropTypes from 'prop-types'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

const onClient = typeof window !== 'undefined'

const readValue = (key) => {
    if (onClient) {
        return window.localStorage.getItem(key)
    }
    return null
}

export const StoreLocatorContext = createContext(null)

export const StoreLocatorProvider = ({config, children}) => {
    // remember the shopper's preferred store for the current site
    // TODO: Change this to `useLocalStorage` hook when localStorage detection is more robust
    const {site} = useMultiSite()
    const selectedStoreBySiteId = `selectedStore_${site?.id}`
    const selectedStoreId = readValue(selectedStoreBySiteId)
    const {pathname} = useLocation()

    const [state, setState] = useState({
        mode: 'input',
        formValues: {
            countryCode: '',
            postalCode: ''
        },
        deviceCoordinates: {
            latitude: null,
            longitude: null
        },
        selectedStoreId,
        config,
        // Modal state
        isModalOpen: false
    })

    useEffect(() => {
        if (onClient && state.selectedStoreId) {
            window.localStorage.setItem(selectedStoreBySiteId, state.selectedStoreId)
        }
    }, [state.selectedStoreId])

    // Auto-close modal when navigating to different pages
    useEffect(() => {
        if (state.isModalOpen) {
            setState((prev) => ({...prev, isModalOpen: false}))
        }
    }, [pathname])

    // Modal actions
    const openModal = () => {
        setState((prev) => ({...prev, isModalOpen: true}))
    }

    const closeModal = () => {
        setState((prev) => ({...prev, isModalOpen: false}))
    }

    const value = {
        state,
        setState,
        // Modal actions
        openModal,
        closeModal
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
