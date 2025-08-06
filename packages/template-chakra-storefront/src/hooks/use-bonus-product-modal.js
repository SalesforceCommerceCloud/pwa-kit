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
import {addToCartModalTheme} from '../theme/components/project/add-to-cart-modal'

/**
 * Context for managing the BonusProductModal.
 * Used in top level App component.
 */
export const BonusProductModalContext = React.createContext()
export const useBonusProductModalContext = () => useContext(BonusProductModalContext)

export const BonusProductModalProvider = ({children}) => {
    const bonusProductModal = useBonusProductModal()
    return (
        <BonusProductModalContext.Provider value={bonusProductModal}>
            {children}
            <BonusProductModal />
        </BonusProductModalContext.Provider>
    )
}

BonusProductModalProvider.propTypes = {
    children: PropTypes.node.isRequired
}

/**
 * Modal for selecting from available bonus products.
 */
export const BonusProductModal = () => {
    const {isOpen, onClose, data} = useBonusProductModalContext()
    const size = useBreakpointValue(addToCartModalTheme.modal.size)

    if (!isOpen) {
        return null
    }

    // todo: this component will be replaced in the next work item. The component will display bonus products available for selection.
    return (
        <Dialog.Root
            size={size}
            open={isOpen}
            onOpenChange={onClose}
            scrollBehavior={addToCartModalTheme.modal.scrollBehavior}
            placement={addToCartModalTheme.modal.placement}
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content
                    margin={addToCartModalTheme.layout.content.margin}
                    borderRadius={addToCartModalTheme.layout.content.borderRadius}
                    bgColor={addToCartModalTheme.colors.background}
                >
                    <Dialog.Body 
                        bgColor={addToCartModalTheme.colors.contentBackground} 
                        padding={addToCartModalTheme.layout.body.padding}
                        marginBottom={addToCartModalTheme.layout.body.marginBottom}
                    >
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
                        <Button onClick={onClose} variant="solid" width="100%" mt="4">
                            Close
                        </Button>
                    </Dialog.Body>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}

export const useBonusProductModal = () => {
    const [state, setState] = useState({
        isOpen: false,
        data: null
    })

    const {pathname} = useLocation()
    useEffect(() => {
        if (state.isOpen) {
            setState({
                ...state,
                isOpen: false
            })
        }
    }, [pathname])

    return {
        isOpen: state.isOpen,
        data: state.data,
        onOpen: (data) => {
            setState({
                isOpen: true,
                data
            })
        },
        onClose: () => {
            setState({
                isOpen: false,
                data: null
            })
        }
    }
}
