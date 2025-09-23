/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'

export {
    BonusProductSelectionModalProvider,
    BonusProductSelectionModalContext,
    useBonusProductSelectionModalContext
} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/components/bonus-product-modal-provider'

export {BonusProductSelectionModal} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/components/bonus-product-selection-modal'

export {useBonusProductModalState} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-modal-state'

export {useBonusProductWishlist} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-wishlist'

export {useBonusProductData} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-data'

export {
    bonusProductModalReducer,
    initialModalState,
    MODAL_ACTIONS
} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/bonus-product-modal-reducer'

export const useBonusProductSelectionModal = () => {
    const {isOpen, data, onOpen, onClose} = useModalState({
        closeOnRouteChange: false,
        resetDataOnClose: true
    })
    return {isOpen, data, onOpen, onClose}
}
