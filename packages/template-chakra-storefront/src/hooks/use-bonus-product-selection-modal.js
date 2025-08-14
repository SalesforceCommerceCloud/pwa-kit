/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext, useState, useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import PropTypes from 'prop-types'
import {Dialog, Button, Text, Box, useBreakpointValue} from '@chakra-ui/react'
import {useModalState} from './use-modal-state'

/**
 * Context for managing the BonusProductSelectionModal.
 * Used in top level App component.
 */
export const BonusProductSelectionModalContext = React.createContext()
export const useBonusProductSelectionModalContext = () =>
    useContext(BonusProductSelectionModalContext)

export const BonusProductSelectionModalProvider = ({children}) => {
    const bonusProductSelectionModal = useBonusProductSelectionModal()
    return (
        <BonusProductSelectionModalContext.Provider value={bonusProductSelectionModal}>
            {children}
            <BonusProductSelectionModal />
        </BonusProductSelectionModalContext.Provider>
    )
}

BonusProductSelectionModalProvider.propTypes = {
    children: PropTypes.node.isRequired
}

/**
 * Modal for selecting from available bonus products.
 */
export const BonusProductSelectionModal = () => {
    const {isOpen, onClose, data} = useBonusProductSelectionModalContext()
    const size = useBreakpointValue({base: 'full', lg: 'lg', xl: 'xl'})

    if (!isOpen) {
        return null
    }

    // todo: this component will be replaced in the next work item. The component will display bonus products available for selection.
    return (
        <Dialog.Root
            size={size}
            open={isOpen}
            onOpenChange={onClose}
            scrollBehavior="inside"
            placement="center"
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Body bgColor="white" padding={8}>
                        <Text fontSize="md" mb="4">
                            Bonus Product Modal
                        </Text>
                        {data && (
                            <Box p="4" bg="gray.100" borderRadius="md" mb="4">
                                <Text fontSize="sm" fontWeight="bold" mb="2">
                                    Received Data:
                                </Text>
                                <Text fontSize="xs" fontFamily="mono">
                                    {JSON.stringify(data, null, 2)}
                                </Text>
                            </Box>
                        )}
                    </Dialog.Body>
                    <Dialog.Footer bgColor="white" padding={8}>
                        <Button onClick={onClose} variant="solid" width="100%">
                            Close
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}

export const useBonusProductSelectionModal = () => {
    const {isOpen, data, onOpen, onClose} = useModalState({
        closeOnRouteChange: true,
        resetDataOnClose: true
    })
    return {isOpen, data, onOpen, onClose}
}
