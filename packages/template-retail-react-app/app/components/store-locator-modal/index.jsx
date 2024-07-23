/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, createContext} from 'react'
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

// Others
import {
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD
} from '@salesforce/retail-react-app/app/constants'

export const StoreLocatorContext = createContext()
export const useStoreLocator = () => {
    const [userHasSetManualGeolocation, setUserHasSetManualGeolocation] = useState(false)
    const [automaticGeolocationHasFailed, setAutomaticGeolocationHasFailed] = useState(false)
    const [userWantsToShareLocation, setUserWantsToShareLocation] = useState(false)

    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
    })

    return {
        userHasSetManualGeolocation,
        setUserHasSetManualGeolocation,
        automaticGeolocationHasFailed,
        setAutomaticGeolocationHasFailed,
        userWantsToShareLocation,
        setUserWantsToShareLocation,
        searchStoresParams,
        setSearchStoresParams
    }
}

const StoreLocatorModal = ({isOpen, onClose}) => {
    const storeLocator = useStoreLocator()
    const isDesktopView = useBreakpointValue({base: false, lg: true})

    return (
        <StoreLocatorContext.Provider value={storeLocator}>
            {isDesktopView ? (
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
                    <ModalContent
                        position="absolute"
                        top="0"
                        right="0"
                        height="100vh"
                        marginTop="0px"
                    >
                        <ModalCloseButton onClick={onClose} />
                        <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                            <StoreLocatorContent />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </StoreLocatorContext.Provider>
    )
}

StoreLocatorModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
}

export default StoreLocatorModal
