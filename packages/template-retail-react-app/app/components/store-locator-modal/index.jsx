/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState, createContext} from 'react'
import PropTypes from 'prop-types'

// Components
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    useBreakpointValue
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-content'

// Hooks
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Others
import {
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD
} from '@salesforce/retail-react-app/app/constants'

export const StoreLocatorContext = createContext()
export const StoreLocatorProvider = ({children}) => {
    const storeLocator = useStoreLocator()

    return (
        <StoreLocatorContext.Provider value={storeLocator}>{children}</StoreLocatorContext.Provider>
    )
}

StoreLocatorProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export const useStoreLocator = () => {
    // Store Locator
    const [userHasSetManualGeolocation, setUserHasSetManualGeolocation] = useState(false)
    const [automaticGeolocationHasFailed, setAutomaticGeolocationHasFailed] = useState(false)
    const [userWantsToShareLocation, setUserWantsToShareLocation] = useState(false)

    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
    })

    // Store Selection
    const {site} = useMultiSite()
    const storeInfoKey = `store_${site.id}`
    const [selectedStore, setSelectedStore] = useState({})

    useEffect(() => {
        setSelectedStore(JSON.parse(window.localStorage.getItem(storeInfoKey)) || {})
    }, [storeInfoKey])

    const setStore = (store) => {
        const storeInfo = {
            id: store.id,
            name: store.name || null,
            inventoryId: store.inventoryId || null
        }
        window.localStorage.setItem(storeInfoKey, JSON.stringify(storeInfo))
        setSelectedStore(storeInfo)
    }

    return {
        userHasSetManualGeolocation,
        setUserHasSetManualGeolocation,
        automaticGeolocationHasFailed,
        setAutomaticGeolocationHasFailed,
        userWantsToShareLocation,
        setUserWantsToShareLocation,
        searchStoresParams,
        setSearchStoresParams,
        selectedStore,
        setStore,
        isStoreSelected: !!selectedStore.id
    }
}

const StoreLocatorModal = ({isOpen, onClose}) => {
    const isDesktopView = useBreakpointValue({base: false, lg: true})

    return isDesktopView ? (
        <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
            <ModalContent
                position="absolute"
                top="0"
                right="0"
                width="33.33%"
                height="100vh"
                marginTop="0px"
                overflowY="auto"
                borderLeft="1px solid"
                borderColor="gray.200"
            >
                <ModalCloseButton onClick={onClose} />
                <ModalBody pb={8} bg="white" paddingBottom={6} paddingTop={6}>
                    <StoreLocatorContent />
                </ModalBody>
            </ModalContent>
        </Modal>
    ) : (
        <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
            <ModalContent position="absolute" top="0" right="0" height="100vh" marginTop="0px">
                <ModalCloseButton onClick={onClose} />
                <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                    <StoreLocatorContent />
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

StoreLocatorModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
}

export default StoreLocatorModal
