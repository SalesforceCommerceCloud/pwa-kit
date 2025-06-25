/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useContext} from 'react'
import {useLocation, useHistory} from 'react-router-dom'
import PropTypes from 'prop-types'
import useSeStoreSelection from '@salesforce/retail-react-app/app/hooks/use-se-store-selection'
import {useStoreLocatorParams} from '@salesforce/retail-react-app/app/contexts/store-locator-params'
import useExternalSearch from '@salesforce/retail-react-app/app/hooks/use-external-search'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'

const SeInputHandler = ({onOpenStoreLocator}) => {
    useExternalSearch()
    const location = useLocation()
    const history = useHistory()
    const {shouldOpenModal, setShouldOpenModal, storeLocatorParams, processSeParameters} =
        useSeStoreSelection()

    const {setParams} = useStoreLocatorParams()
    const {setState: setStoreLocatorState} = useContext(StoreLocatorContext) || {}

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        processSeParameters(urlParams)
    }, [location.search, processSeParameters])

    // Handle store locator params updates
    useEffect(() => {
        if (!storeLocatorParams) return
        setParams(storeLocatorParams)
        const storeName = new URLSearchParams(location.search).get('store')
        if (setStoreLocatorState && !storeName) {
            if (storeLocatorParams.postalCode && storeLocatorParams.countryCode) {
                setStoreLocatorState((prev) => ({
                    ...prev,
                    mode: 'input',
                    formValues: {
                        postalCode: storeLocatorParams.postalCode,
                        countryCode: storeLocatorParams.countryCode
                    }
                }))
            } else if (storeLocatorParams.latitude && storeLocatorParams.longitude) {
                setStoreLocatorState((prev) => ({
                    ...prev,
                    mode: 'device',
                    deviceCoordinates: {
                        latitude: storeLocatorParams.latitude,
                        longitude: storeLocatorParams.longitude
                    }
                }))
            }
        }
    }, [storeLocatorParams, setParams, setStoreLocatorState])

    useEffect(() => {
        if (!shouldOpenModal || !storeLocatorParams) return

        const urlParams = new URLSearchParams(location.search)
        const hasSeParamKeys = ['lat', 'lng', 'zip', 'city', 'store', 'country']

        onOpenStoreLocator()
        setShouldOpenModal(false)

        const hasSeParams = hasSeParamKeys.some((key) => urlParams.has(key))
        if (hasSeParams) {
            cleanURLParams(location, history, hasSeParamKeys)
        }
    }, [
        shouldOpenModal,
        storeLocatorParams,
        onOpenStoreLocator,
        setShouldOpenModal,
        location.search,
        location.pathname,
        history
    ])

    return null
}

export const cleanURLParams = (location, history, hasSeParamKeys) => {
    const cleanParams = new URLSearchParams(location.search)
    hasSeParamKeys.forEach((key) => cleanParams.delete(key))

    const cleanSearch = cleanParams.toString()
    const newUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '')

    history.replace(newUrl)
}

SeInputHandler.propTypes = {
    onOpenStoreLocator: PropTypes.func.isRequired
}

export default SeInputHandler
