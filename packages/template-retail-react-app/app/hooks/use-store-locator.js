/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {STORE_LOCATOR_NUM_STORES_PER_REQUEST_API_MAX} from '@salesforce/retail-react-app/app/constants'

const useStores = (state) => {
    const apiParameters =
        state.mode === 'input'
            ? {
                  countryCode: state.formValues.countryCode,
                  postalCode: state.formValues.postalCode,
                  maxDistance: state.config.radius,
                  limit: STORE_LOCATOR_NUM_STORES_PER_REQUEST_API_MAX,
                  distanceUnit: state.config.radiusUnit
              }
            : {
                  latitude: state.deviceCoordinates.latitude,
                  longitude: state.deviceCoordinates.longitude,
                  maxDistance: state.config.radius,
                  limit: STORE_LOCATOR_NUM_STORES_PER_REQUEST_API_MAX,
                  distanceUnit: state.config.radiusUnit
              }
    const shouldFetchStores =
        Boolean(
            state.mode === 'input' && state.formValues.countryCode && state.formValues.postalCode
        ) ||
        Boolean(
            state.mode === 'device' &&
                state.deviceCoordinates.latitude &&
                state.deviceCoordinates.longitude
        )
    return useSearchStores(
        {
            parameters: apiParameters
        },
        {
            enabled: shouldFetchStores
        }
    )
}

export const useStoreLocator = () => {
    const context = useContext(StoreLocatorContext)
    if (!context) {
        throw new Error('useStoreLocator must be used within a StoreLocatorProvider')
    }

    const {state, setState, isOpen, onOpen, onClose} = context
    const storesQuery = useStores(state)

    // There are two modes, input and device.
    // The input mode is when the user is searching for a store
    // by entering a postal code and country code.
    // The device mode is when the user is searching for a store by sharing their location.
    // The mode is implicitly set by user's action.
    const setFormValues = (formValues) => {
        setState((prev) => ({
            ...prev,
            formValues,
            mode: 'input'
        }))
    }

    const setDeviceCoordinates = (coordinates) => {
        setState((prev) => ({
            ...prev,
            deviceCoordinates: coordinates,
            mode: 'device',
            formValues: {countryCode: '', postalCode: ''}
        }))
    }

    const setSelectedStoreId = (selectedStoreId) => {
        setState((prev) => ({
            ...prev,
            selectedStoreId
        }))
    }

    return {
        ...state,
        // Especially data, isLoading, and error are useful
        ...storesQuery,
        // Actions
        setFormValues,
        setDeviceCoordinates,
        setSelectedStoreId,
        // Modal actions
        isOpen,
        onOpen,
        onClose
    }
}

/**
 * Hook specifically for components that only need modal functionality
 */
export const useStoreLocatorModal = () => {
    const context = useContext(StoreLocatorContext)
    if (!context) {
        throw new Error('useStoreLocatorModal must be used within a StoreLocatorProvider')
    }

    const {isOpen, onOpen, onClose} = context

    return {
        isOpen,
        onOpen,
        onClose
    }
}
