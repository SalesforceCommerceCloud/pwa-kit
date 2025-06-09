/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useLocation, useHistory} from 'react-router-dom'
import PropTypes from 'prop-types'
import useGMBStoreSelection from '@salesforce/retail-react-app/app/hooks/use-gmb-store-selection'


const GMBHandler = ({onOpenStoreLocator, onGMBParametersReady}) => {
    const location = useLocation()
    const history = useHistory()
    const {shouldOpenModal, setShouldOpenModal, storeLocatorParams, processGMBParameters} = useGMBStoreSelection()


    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        processGMBParameters(urlParams)
    }, [location.search, processGMBParameters])


    useEffect(() => {
        if (storeLocatorParams && onGMBParametersReady) {
            onGMBParametersReady(storeLocatorParams)
        }
    }, [storeLocatorParams, onGMBParametersReady])


    useEffect(() => {
        if (shouldOpenModal) {
            onOpenStoreLocator()
            setShouldOpenModal(false)
            
            // Clean up URL parameters after GMB processing is complete
            const urlParams = new URLSearchParams(location.search)
            const hasGMBParams = urlParams.has('lat') || urlParams.has('lng') || urlParams.has('zip') || 
                               urlParams.has('zipcode') || urlParams.has('postal') || urlParams.has('city') || 
                               urlParams.has('store') || urlParams.has('country') || urlParams.has('latitude') ||
                               urlParams.has('longitude') || urlParams.has('lon') || urlParams.has('storeName') ||
                               urlParams.has('name') || urlParams.has('location') || urlParams.has('countryCode') ||
                               urlParams.has('cc') || urlParams.has('coords') || urlParams.has('address')
            
            if (hasGMBParams) {
                // Remove GMB parameters from URL while keeping any other parameters
                const cleanParams = new URLSearchParams(location.search)
                const gmbParamKeys = ['lat', 'lng', 'zip', 'zipcode', 'postal', 'city', 'store', 'country', 
                                     'latitude', 'longitude', 'lon', 'storeName', 'name', 'location', 
                                     'countryCode', 'cc', 'coords', 'address']
                
                gmbParamKeys.forEach(key => cleanParams.delete(key))
                
                const cleanSearch = cleanParams.toString()
                const newUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '')
                
                // Update URL without adding to history
                history.replace(newUrl)
            }
        }
    }, [shouldOpenModal, onOpenStoreLocator, setShouldOpenModal, location.search, location.pathname, history])


    return null
}

GMBHandler.propTypes = {
    onOpenStoreLocator: PropTypes.func.isRequired,
    onGMBParametersReady: PropTypes.func
}

export default GMBHandler 