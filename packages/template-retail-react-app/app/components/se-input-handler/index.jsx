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

    const storeLocatorContext = useContext(StoreLocatorContext)
    const selectedStoreId = storeLocatorContext?.state?.selectedStoreId

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

        const hasSelectedStore = !!selectedStoreId

        if (hasSelectedStore) {
            const urlParams = new URLSearchParams(location.search)
            const hasSeParamKeys = ['lat', 'lng', 'zip', 'city', 'store', 'country']
            const hasExternalQuery =
                urlParams.has('q') || urlParams.has('search') || urlParams.has('query')

            const openModal = () => {
                onOpenStoreLocator()
            }

            if (hasExternalQuery) {
                setTimeout(openModal, 1500)
            } else {
                openModal()
            }

            setShouldOpenModal(false)

            const hasSeParams = hasSeParamKeys.some((key) => urlParams.has(key))

            if (hasSeParams) {
                const cleanParams = new URLSearchParams(location.search)
                hasSeParamKeys.forEach((key) => cleanParams.delete(key))

                const cleanSearch = cleanParams.toString()
                const newUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '')

                history.replace(newUrl)
            }
        }
    }, [
        shouldOpenModal,
        storeLocatorParams,
        selectedStoreId,
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
