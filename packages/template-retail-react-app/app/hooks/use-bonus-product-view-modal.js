/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'

/**
 * Hook for managing the bonus product view modal state
 */
export const useBonusProductViewModal = () => {
    const {isOpen, data, onOpen, onClose} = useModalState({
        closeOnRouteChange: true,
        resetDataOnClose: true
    })
    return {isOpen, data, onOpen, onClose}
}
