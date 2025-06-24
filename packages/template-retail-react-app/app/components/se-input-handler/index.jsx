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
import useExternalSearch from '@salesforce/retail-react-app/app/hooks/use-external-search'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

const SeInputHandler = ({onOpenStoreLocator}) => {
    useExternalSearch()
    const location = useLocation()
    const history = useHistory()
    const {
        derivedData: {totalItems: totalItemCount}
    } = useCurrentBasket()
    const {shouldOpenModal, setShouldOpenModal, storeLocatorParams, processSeParameters} =
        useSeStoreSelection(totalItemCount)

    const {setParams} = useStoreLocatorParams()

    const {site} = useMultiSite()
    const storeInfoKey = `store_${site.id}`
    const hasSeParamKeys = ['lat', 'lng', 'zip', 'city', 'store', 'country']

    useEffect(() => {
        let urlParams

        try {
            // First, normalize the search string by replacing any ? after the first one with &
            let normalizedSearch = location.search
            if (normalizedSearch) {
                const [firstPart, ...rest] = normalizedSearch.split('?')
                if (rest.length > 0) {
                    normalizedSearch = firstPart + '?' + rest.join('&')
                }
            }

            urlParams = new URLSearchParams(normalizedSearch)

            // Check if we need to redirect to a clean URL
            if (location.search !== normalizedSearch) {
                history.replace({
                    pathname: location.pathname,
                    search: normalizedSearch
                })
                return
            }

            // Process the parameters
            processSeParameters(urlParams)

            // Clean up location parameters if they exist
            const hasSeParams = hasSeParamKeys.some((key) => urlParams.has(key))
            if (hasSeParams) {
                cleanURLParams(location, history, hasSeParamKeys)
            }
        } catch (error) {
            console.warn('Error parsing URL parameters:', error)
            urlParams = new URLSearchParams()
            processSeParameters(urlParams)
        }
    }, [location.search, processSeParameters, history, location.pathname, hasSeParamKeys])

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
            const urlParams = new URLSearchParams(location.search)
            const hasExternalQuery =
                urlParams.has('q') || urlParams.has('search') || urlParams.has('query')

            const openModal = () => {
                onOpenStoreLocator()
                setShouldOpenModal(false)
            }

            if (hasExternalQuery) {
                // Wait for PLP products to load before opening modal
                const handlePlpLoaded = (event) => {
                    if (event.detail?.isSearch) {
                        openModal()
                        window.removeEventListener('plpProductsLoaded', handlePlpLoaded)
                    }
                }

                window.addEventListener('plpProductsLoaded', handlePlpLoaded)
                if (
                    document.readyState === 'complete' &&
                    (window.location.pathname.startsWith('/search') ||
                        window.location.pathname.includes('/product-list'))
                ) {
                    const productGrid = document.querySelector('.product-grid')
                    if (productGrid && productGrid.children.length > 0) {
                        openModal()
                        window.removeEventListener('plpProductsLoaded', handlePlpLoaded)
                        return
                    }
                }

                return () => {
                    window.removeEventListener('plpProductsLoaded', handlePlpLoaded)
                }
            } else {
                openModal()
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
