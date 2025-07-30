/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Dialog, CloseButton, useBreakpointValue} from '@chakra-ui/react'
import {StoreLocatorContent} from './content'
import SafePortal from '../../../components/safe-portal'

interface StoreLocatorModalProps {
    isOpen: boolean
    onClose: () => void
}

const StoreLocatorModal: React.FC<StoreLocatorModalProps> = ({isOpen, onClose}) => {
    const isDesktopView = useBreakpointValue({base: false, lg: true})

    return (
        <Dialog.Root
            lazyMount
            open={isOpen}
            onOpenChange={() => onClose()}
            size="4xl"
            closeOnInteractOutside={false}
        >
            <SafePortal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content
                        data-testid="store-locator-modal"
                        position="absolute"
                        top="0"
                        right="0"
                        width={isDesktopView ? '33.33%' : '100%'}
                        height="100vh"
                        marginTop="0px"
                        overflowY="auto"
                        borderLeft={isDesktopView ? '1px solid' : 'none'}
                        borderColor="gray.200"
                    >
                        <Dialog.CloseTrigger />
                        <Dialog.Body pb={8} bg="white" paddingBottom={6} paddingTop={6}>
                            <StoreLocatorContent />
                        </Dialog.Body>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </SafePortal>
        </Dialog.Root>
    )
}

export default StoreLocatorModal
