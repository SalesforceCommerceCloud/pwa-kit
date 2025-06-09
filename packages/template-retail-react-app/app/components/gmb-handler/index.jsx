/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import PropTypes from 'prop-types'
import useGMBStoreSelection from '@salesforce/retail-react-app/app/hooks/use-gmb-store-selection'


const GMBHandler = ({onOpenStoreLocator, onGMBParametersReady}) => {
    const location = useLocation()
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
        }
    }, [shouldOpenModal, onOpenStoreLocator, setShouldOpenModal])


    return null
}

GMBHandler.propTypes = {
    onOpenStoreLocator: PropTypes.func.isRequired,
    onGMBParametersReady: PropTypes.func
}

export default GMBHandler 