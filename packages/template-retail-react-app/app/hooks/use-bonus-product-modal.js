/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useState, useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    useBreakpointValue,
    ModalHeader,
    ModalBody,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import PropTypes from 'prop-types'

export const BonusProductModalContext = React.createContext()

export const useBonusProductModalContext = () => useContext(BonusProductModalContext)

export const BonusProductModalProvider = ({children, basket}) => {
    const bonusProductState = useBonusState(basket)

    return (
        <BonusProductModalContext.Provider value={bonusProductState}>
            {children}
            <BonusProductModal />
        </BonusProductModalContext.Provider>
    )
}
BonusProductModalProvider.propTypes = {
    children: PropTypes.node.isRequired,
    basket: PropTypes.object
}

export const BonusProductModal = () => {
    const {isOpen, data, onClose, onOpen} = useBonusProductModalContext()
    const size = useBreakpointValue({base: 'full', lg: '2xl', xl: '4xl'})

    if (!isOpen) {
        return null
    }
    return (
        <Modal size={size} isOpen={isOpen} onClose={onClose} scrollBehavior="inside" isCentered>
            <ModalOverlay />
            <ModalContent
                margin="0"
                borderRadius={{base: 'none', md: 'base'}}
                bgColor="gray.50"
                containerProps={{'data-testid': 'bonus-product-modal'}}
            >
                <ModalHeader paddingY="8" bgColor="white">
                    <Heading as="h1" fontSize="2xl"></Heading>
                </ModalHeader>
                <ModalCloseButton />
                {/* Add your modal content here */}
                <ModalBody bgColor="white" padding="0" marginBottom={{base: 40, lg: 0}}></ModalBody>
            </ModalContent>
        </Modal>
    )
}

export const useBonusState = (basket) => {
    const [state, setState] = useState({
        isOpen: false,
        data: {},
        bonusProducts: basket?.bonusDiscountLineItems || []
    })
    const {pathname} = useLocation()
    const {onOpen: onAddToCartModalOpen} = useAddToCartModalContext()

    useEffect(() => {
        if (state.isOpen) {
            setState((prev) => ({
                ...prev,
                isOpen: false
            }))
        }
    }, [pathname])

    // Update bonusProducts when basket changes
    useEffect(() => {
        setState((prev) => ({
            ...prev,
            bonusProducts: basket?.bonusDiscountLineItems || []
        }))
    }, [basket])

    const addBonusProducts = (newBonusItems) => {
        setState((prev) => {
            const updatedBonusProducts = [...prev.bonusProducts, ...newBonusItems]
            return {
                ...prev,
                bonusProducts: updatedBonusProducts
            }
        })
    }

    const clearBonusProducts = () => {
        setState((prev) => ({
            ...prev,
            bonusProducts: []
        }))
    }

    return {
        isOpen: state.isOpen,
        data: state.data,
        bonusProducts: state.bonusProducts,
        addBonusProducts,
        clearBonusProducts,
        onClose: () => {
            setState((prev) => ({
                ...prev,
                isOpen: false,
                data: {}
            }))

            if (state.data.openAddToCartModalIfNeeded && state.data.product) {
                onAddToCartModalOpen({
                    product: state.data.product,
                    itemsAdded: state.data.itemsAdded,
                    selectedQuantity: state.data.selectedQuantity
                })
            }
        },
        onOpen: (data) => {
            setState((prev) => ({
                ...prev,
                isOpen: true,
                data
            }))
        }
    }
}
