/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    useBreakpointValue
} from '@chakra-ui/react'
import {StoreLocatorContent} from './content'

interface StoreLocatorModalProps {
    isOpen: boolean
    onClose: () => void
}

export const StoreLocatorModal: React.FC<StoreLocatorModalProps> = ({isOpen, onClose}) => {
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
