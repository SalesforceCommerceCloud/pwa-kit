/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext, useEffect, useCallback} from 'react'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {useStoreLocatorParams} from '@salesforce/retail-react-app/app/contexts/store-locator-params'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

const useStores = (state) => {
    //This is an API limit and is therefore not configurable
    const NUM_STORES_PER_REQUEST_API_MAX = 200

    let apiParameters
    let shouldFetchStores

    if (state.mode === 'se' && state.seParams) {
        apiParameters = {
            ...state.seParams,
            limit: NUM_STORES_PER_REQUEST_API_MAX
        }
        shouldFetchStores = Boolean(state.seParams)
    } else {
        apiParameters =
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
        shouldFetchStores =
            Boolean(
                state.mode === 'input' &&
                    state.formValues.countryCode &&
                    state.formValues.postalCode
            ) ||
            Boolean(
                state.mode === 'device' &&
                    state.deviceCoordinates.latitude &&
                    state.deviceCoordinates.longitude
            )
    }

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

    const {state, setState} = context
    const {params: seParams} = useStoreLocatorParams()
    const {site} = useMultiSite()
    const getStoredSeParams = () => {
        if (typeof window !== 'undefined') {
            try {
                const storeInfoKey = `store_${site.id}`
                const storedInfo = localStorage.getItem(storeInfoKey)
                if (storedInfo) {
                    const parsed = JSON.parse(storedInfo)
                    if (parsed.isSeSelection && parsed.seSearchParams) {
                        return parsed.seSearchParams
                    }
                }
            } catch (e) {
                console.warn('Failed to parse stored SE params:', e)
            }
        }
        return null
    }
    const storedSeParams = getStoredSeParams()
    const effectiveState = seParams
        ? {
              ...state,
              mode: 'se',
              seParams
          }
        : storedSeParams
        ? {
              ...state,
              mode: 'se',
              seParams: storedSeParams
          }
        : state

    const {data, isLoading} = useStores(effectiveState)

    // There are three modes: input, device, and se.
    // The input mode is when the user is searching for a store
    // by entering a postal code and country code.
    // The device mode is when the user is searching for a store by sharing their location.
    // The se mode is when parameters come from search engine (SE) selection.
    // The mode is implicitly set by user's action or SE parameters.
    const setFormValues = (formValues) => {
        setState((prev) => ({...prev, formValues, mode: 'input'}))
    }

    const setDeviceCoordinates = (coordinates) => {
        setState((prev) => ({
            ...prev,
            deviceCoordinates: coordinates,
            mode: 'device',
            formValues: {countryCode: '', postalCode: ''}
        }))
    }

    const getFormValuesFromStoredData = useCallback((parsed, data) => {
        if (!parsed?.seSearchParams) return {formCountry: null, formPostalCode: null}

        const {seSearchParams} = parsed
        if (seSearchParams.postalCode && seSearchParams.countryCode) {
            return {
                formCountry: seSearchParams.countryCode,
                formPostalCode: seSearchParams.postalCode
            }
        }
        if (seSearchParams.latitude && seSearchParams.countryCode && data?.data?.length > 0) {
            const selectedStore = data.data.find((store) => store.id === parsed.id)
            return {
                formCountry: seSearchParams.countryCode,
                formPostalCode: selectedStore?.postalCode || null
            }
        }

        return {formCountry: null, formPostalCode: null}
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const storeInfoKey = `store_${site.id}`
                const storedInfo = localStorage.getItem(storeInfoKey)
                if (!storedInfo) return

                const parsed = JSON.parse(storedInfo)
                if (!parsed.isSeSelection) return

                const {formCountry, formPostalCode} = getFormValuesFromStoredData(parsed, data)

                const needsUpdate =
                    (formCountry && formCountry !== state.formValues.countryCode) ||
                    (formPostalCode && formPostalCode !== state.formValues.postalCode)

                if (needsUpdate) {
                    setState((prev) => ({
                        ...prev,
                        formValues: {
                            countryCode: formCountry || prev.formValues.countryCode,
                            postalCode: formPostalCode || prev.formValues.postalCode
                        },
                        mode: 'input'
                    }))
                }
            } catch (e) {
                console.warn('Failed to parse stored info for form population:', e)
            }
        }
    }, [
        site.id,
        data,
        getFormValuesFromStoredData,
        state.formValues.countryCode,
        state.formValues.postalCode
    ])

    return {
        ...state,
        data,
        isLoading,
        // Actions
        setFormValues,
        setDeviceCoordinates
    }
}
