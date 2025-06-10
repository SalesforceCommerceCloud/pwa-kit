/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useLocation, useHistory} from 'react-router-dom'
import PropTypes from 'prop-types'
import useSeStoreSelection from '@salesforce/retail-react-app/app/hooks/use-se-store-selection'


const SeInputHandler = ({onOpenStoreLocator, onSeParametersReady}) => {
    const location = useLocation()  
    const history = useHistory()
    const {shouldOpenModal, setShouldOpenModal, storeLocatorParams, processSeParameters} = useSeStoreSelection()


    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        processSeParameters(urlParams)
    }, [location.search, processSeParameters])


    useEffect(() => {
        if (storeLocatorParams && onSeParametersReady) {
            onSeParametersReady(storeLocatorParams)
        }
    }, [storeLocatorParams, onSeParametersReady])


    useEffect(() => {
        if (shouldOpenModal) {
            onOpenStoreLocator()
            setShouldOpenModal(false)

            // Clean up URL parameters after SE processing is complete
            const urlParams = new URLSearchParams(location.search)
            const hasSEParams = urlParams.has('lat') || urlParams.has('lng') || urlParams.has('zip') || 
                               urlParams.has('zipcode') || urlParams.has('postal') || urlParams.has('city') || 
                               urlParams.has('store') || urlParams.has('country') || urlParams.has('latitude') ||
                               urlParams.has('longitude') || urlParams.has('lon') || urlParams.has('storeName') ||
                               urlParams.has('name') || urlParams.has('location') || urlParams.has('countryCode') ||
                               urlParams.has('cc') || urlParams.has('coords') || urlParams.has('address')

            if (hasSEParams) {
                // Remove SE parameters from URL while keeping any other parameters
                const cleanParams = new URLSearchParams(location.search)
                const seParamKeys = ['lat', 'lng', 'zip', 'zipcode', 'postal', 'city', 'store', 'country', 
                                     'latitude', 'longitude', 'lon', 'storeName', 'name', 'location', 
                                     'countryCode', 'cc', 'coords', 'address']

                seParamKeys.forEach(key => cleanParams.delete(key))

                const cleanSearch = cleanParams.toString()
                const newUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '')

                // Update URL without adding to history
                history.replace(newUrl)
            }
        }
    }, [shouldOpenModal, onOpenStoreLocator, setShouldOpenModal, location.search, location.pathname, history])


    return null
}

SeInputHandler.propTypes = {
    onOpenStoreLocator: PropTypes.func.isRequired,
    onSeParametersReady: PropTypes.func
}

export default SeInputHandler