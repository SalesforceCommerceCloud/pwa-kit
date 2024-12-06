/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {StoreLocatorContext} from './provider'
import type {StoreLocatorState, FormValues, DeviceCoordinates} from './provider'

interface StoreLocatorActions {
    setFormValues: (formValues: FormValues) => void
    setDeviceCoordinates: (coordinates: DeviceCoordinates) => void
}

type UseStoreLocatorReturn = StoreLocatorState &
    StoreLocatorActions & {
        data: NonNullable<ReturnType<typeof useSearchStores>['data']> | undefined
        isLoading: boolean
    }

const useStores = (state: StoreLocatorState) => {
    //This is an API limit and is therefore not configurable
    const NUM_STORES_PER_REQUEST_API_MAX = 200
    const apiParameters =
        state.mode === 'input'
            ? {
                  countryCode: state.formValues.countryCode,
                  postalCode: state.formValues.postalCode,
                  maxDistance: state.config.radius,
                  limit: NUM_STORES_PER_REQUEST_API_MAX,
                  distanceUnit: state.config.radiusUnit
              }
            : {
                  latitude: state.deviceCoordinates.latitude,
                  longitude: state.deviceCoordinates.longitude,
                  maxDistance: state.config.radius,
                  limit: NUM_STORES_PER_REQUEST_API_MAX,
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

export const useStoreLocator = (): UseStoreLocatorReturn => {
    const context = useContext(StoreLocatorContext)
    if (!context) {
        throw new Error('useStoreLocator must be used within a StoreLocatorProvider')
    }

    const {state, setState} = context
    const {data, isLoading} = useStores(state)

    // There are two modes, input and device.
    // The input mode is when the user is searching for a store
    // by entering a postal code and country code.
    // The device mode is when the user is searching for a store by sharing their location.
    // The mode is implicitly set by user's action.
    const setFormValues = (formValues: FormValues) => {
        setState((prev) => ({...prev, formValues, mode: 'input'}))
    }

    const setDeviceCoordinates = (coordinates: DeviceCoordinates) => {
        setState((prev) => ({
            ...prev,
            deviceCoordinates: coordinates,
            mode: 'device',
            formValues: {countryCode: '', postalCode: ''}
        }))
    }

    return {
        ...state,
        data,
        isLoading,
        // Actions
        setFormValues,
        setDeviceCoordinates
    }
}
