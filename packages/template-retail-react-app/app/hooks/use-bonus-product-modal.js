/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useState, useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import PropTypes from 'prop-types'
import {BonusProductModal} from '@salesforce/retail-react-app/app/components/bonus-product-modal'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

export const BonusProductModalContext = React.createContext()

export const useBonusProductModalContext = () => useContext(BonusProductModalContext)

export const BonusProductModalProvider = ({children}) => {
    const {data: basket} = useCurrentBasket()
    const bonusProductState = useBonusState(basket)

    return (
        <BonusProductModalContext.Provider value={bonusProductState}>
            {children}
            <BonusProductModal />
        </BonusProductModalContext.Provider>
    )
}

BonusProductModalProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export const useBonusState = (basket) => {
    const [state, setState] = useState({
        isOpen: false,
        data: {},
        bonusProducts: basket?.bonusDiscountLineItems || []
    })
    const {pathname} = useLocation()

    useEffect(() => {
        if (state.isOpen) {
            setState((prev) => ({
                ...prev,
                isOpen: false
            }))
        }
    }, [pathname])

    // Update bonusProducts when basket bonusDiscountLineItems changes
    useEffect(() => {
        const currentBonusItems = basket?.bonusDiscountLineItems || []
        setState((prev) => {
            // Only update if the bonus items have actually changed
            if (JSON.stringify(prev.bonusProducts) !== JSON.stringify(currentBonusItems)) {
                return {
                    ...prev,
                    bonusProducts: currentBonusItems
                }
            }
            return prev
        })
    }, [basket?.bonusDiscountLineItems])

    const addBonusProducts = (newBonusItems) => {
        setState((prev) => {
            const updatedBonusProducts = [...prev.bonusProducts, ...newBonusItems]
            return {
                ...prev,
                bonusProducts: updatedBonusProducts
            }
        })
    }

    return {
        isOpen: state.isOpen,
        data: state.data,
        bonusProducts: state.bonusProducts,
        addBonusProducts,
        onClickClose: () => {
            setState((prev) => ({
                ...prev,
                isOpen: false,
                data: {}
            }))
        },
        onClose: () => {
            
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
