/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext} from 'react'
import PropTypes from 'prop-types'
import {useBonusProductModalState} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-modal-state'
import {BonusProductSelectionModal} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/components/bonus-product-selection-modal'
import {AddToCartModal} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

export const BonusProductSelectionModalContext = React.createContext()

export const useBonusProductSelectionModalContext = () =>
    useContext(BonusProductSelectionModalContext)

export const BonusProductSelectionModalProvider = ({children}) => {
    const modalState = useBonusProductModalState()

    // Create backward compatible API
    const bonusProductSelectionModal = {
        ...modalState,
        onOpen: modalState.openSelectionModal,
        onClose: modalState.handleClose
    }

    return (
        <BonusProductSelectionModalContext.Provider value={bonusProductSelectionModal}>
            {children}
            <BonusProductSelectionModal />
            <AddToCartModal />
        </BonusProductSelectionModalContext.Provider>
    )
}

BonusProductSelectionModalProvider.propTypes = {
    children: PropTypes.node.isRequired
}
