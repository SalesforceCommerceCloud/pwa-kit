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
import {useStoreLocatorParams} from '@salesforce/retail-react-app/app/contexts/store-locator-params'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

const SeInputHandler = ({onOpenStoreLocator}) => {
    const location = useLocation()
    const history = useHistory()
    const {shouldOpenModal, setShouldOpenModal, storeLocatorParams, processSeParameters} =
        useSeStoreSelection()

    const {setParams} = useStoreLocatorParams()

    const {site} = useMultiSite()
    const storeInfoKey = `store_${site.id}`

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        processSeParameters(urlParams)
    }, [location.search, processSeParameters])

    useEffect(() => {
        if (storeLocatorParams) {
            setParams(storeLocatorParams)
        }
    }, [storeLocatorParams, setParams])

    useEffect(() => {
        if (!shouldOpenModal || !storeLocatorParams) return

        const hasSelectedStore =
            typeof window !== 'undefined' && window.localStorage.getItem(storeInfoKey)

        if (hasSelectedStore) {
            onOpenStoreLocator()
            setShouldOpenModal(false)

            const urlParams = new URLSearchParams(location.search)
            const seParamKeys = ['lat', 'lng', 'zip', 'city', 'store', 'country']
            const hasSeParams = seParamKeys.some((key) => urlParams.has(key))

            if (hasSeParams) {
                const cleanParams = new URLSearchParams(location.search)
                seParamKeys.forEach((key) => cleanParams.delete(key))

                const cleanSearch = cleanParams.toString()
                const newUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '')

                history.replace(newUrl)
            }
        }
    }, [
        shouldOpenModal,
        storeLocatorParams,
        storeInfoKey,
        onOpenStoreLocator,
        setShouldOpenModal,
        location.search,
        location.pathname,
        history
    ])

    return null
}

SeInputHandler.propTypes = {
    onOpenStoreLocator: PropTypes.func.isRequired
}

export default SeInputHandler
