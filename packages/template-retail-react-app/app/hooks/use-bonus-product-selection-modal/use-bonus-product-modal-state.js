/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useReducer, useCallback} from 'react'
import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'
import {
    bonusProductModalReducer,
    initialModalState,
    MODAL_ACTIONS
} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/bonus-product-modal-reducer'

export const useBonusProductModalState = () => {
    const [state, dispatch] = useReducer(bonusProductModalReducer, initialModalState)

    const baseModalState = useModalState({
        closeOnRouteChange: false,
        resetDataOnClose: true
    })

    const openSelectionModal = useCallback(
        (data) => {
            baseModalState.onOpen(data)
            dispatch({
                type: MODAL_ACTIONS.OPEN_SELECTION_MODAL,
                payload: data
            })
        },
        [baseModalState]
    )

    const closeSelectionModal = useCallback(() => {
        baseModalState.onClose()
        dispatch({type: MODAL_ACTIONS.CLOSE_SELECTION_MODAL})
    }, [baseModalState])

    const openProductView = useCallback((product, bonusDiscountLineItemId, promotionId) => {
        dispatch({
            type: MODAL_ACTIONS.OPEN_PRODUCT_VIEW,
            payload: {
                product,
                bonusDiscountLineItemId,
                promotionId
            }
        })
    }, [])

    const closeProductView = useCallback(() => {
        dispatch({type: MODAL_ACTIONS.CLOSE_PRODUCT_VIEW})
    }, [])

    const returnToSelection = useCallback(() => {
        dispatch({type: MODAL_ACTIONS.RETURN_TO_SELECTION})
    }, [])

    const setProductLoading = useCallback((isLoading) => {
        dispatch({
            type: MODAL_ACTIONS.SET_PRODUCT_LOADING,
            payload: isLoading
        })
    }, [])

    const setWishlistLoading = useCallback((isLoading) => {
        dispatch({
            type: MODAL_ACTIONS.SET_WISHLIST_LOADING,
            payload: isLoading
        })
    }, [])

    const setError = useCallback((error) => {
        dispatch({
            type: MODAL_ACTIONS.SET_ERROR,
            payload: error
        })
    }, [])

    const setWishlistError = useCallback((error) => {
        dispatch({
            type: MODAL_ACTIONS.SET_WISHLIST_ERROR,
            payload: error
        })
    }, [])

    const resetState = useCallback(() => {
        dispatch({type: MODAL_ACTIONS.RESET_STATE})
    }, [])

    const handleClose = useCallback(() => {
        resetState()
        closeSelectionModal()
    }, [resetState, closeSelectionModal])

    return {
        isOpen: baseModalState.isOpen,
        data: baseModalState.data,
        isSelectionOpen: state.isSelectionOpen,
        isViewOpen: state.isViewOpen,
        selectedProduct: state.selectedProduct,
        selectedBonusMeta: state.selectedBonusMeta,
        isProductLoading: state.isProductLoading,
        isWishlistLoading: state.isWishlistLoading,
        error: state.error,
        wishlistError: state.wishlistError,
        openSelectionModal,
        closeSelectionModal,
        openProductView,
        closeProductView,
        returnToSelection,
        setProductLoading,
        setWishlistLoading,
        setError,
        setWishlistError,
        resetState,
        handleClose
    }
}
