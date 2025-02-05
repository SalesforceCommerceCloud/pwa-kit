/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {createContext} from 'react'
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
import {useStoreLocator} from '@salesforce/retail-react-app/app/hooks/use-store-locator'

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
