/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const MODAL_ACTIONS = {
    OPEN_SELECTION_MODAL: 'OPEN_SELECTION_MODAL',
    CLOSE_SELECTION_MODAL: 'CLOSE_SELECTION_MODAL',
    OPEN_PRODUCT_VIEW: 'OPEN_PRODUCT_VIEW',
    CLOSE_PRODUCT_VIEW: 'CLOSE_PRODUCT_VIEW',
    RETURN_TO_SELECTION: 'RETURN_TO_SELECTION',
    SET_PRODUCT_LOADING: 'SET_PRODUCT_LOADING',
    SET_WISHLIST_LOADING: 'SET_WISHLIST_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_WISHLIST_ERROR: 'SET_WISHLIST_ERROR',
    RESET_STATE: 'RESET_STATE'
}

export const initialModalState = {
    isSelectionOpen: false,
    selectionData: null,
    isViewOpen: false,
    selectedProduct: null,
    selectedBonusMeta: {
        bonusDiscountLineItemId: null,
        promotionId: null
    },
    isProductLoading: false,
    isWishlistLoading: false,
    error: null,
    wishlistError: null
}

export const bonusProductModalReducer = (state, action) => {
    switch (action.type) {
        case MODAL_ACTIONS.OPEN_SELECTION_MODAL:
            return {
                ...state,
                isSelectionOpen: true,
                selectionData: action.payload,
                isViewOpen: false,
                selectedProduct: null,
                selectedBonusMeta: {
                    bonusDiscountLineItemId: null,
                    promotionId: null
                },
                error: null
            }

        case MODAL_ACTIONS.CLOSE_SELECTION_MODAL:
            return {
                ...initialModalState
            }

        case MODAL_ACTIONS.OPEN_PRODUCT_VIEW:
            return {
                ...state,
                isViewOpen: true,
                selectedProduct: action.payload.product,
                selectedBonusMeta: {
                    bonusDiscountLineItemId: action.payload.bonusDiscountLineItemId,
                    promotionId: action.payload.promotionId
                },
                error: null
            }

        case MODAL_ACTIONS.CLOSE_PRODUCT_VIEW:
            return {
                ...state,
                isViewOpen: false,
                selectedProduct: null,
                selectedBonusMeta: {
                    bonusDiscountLineItemId: null,
                    promotionId: null
                }
            }

        case MODAL_ACTIONS.RETURN_TO_SELECTION:
            return {
                ...state,
                isViewOpen: false,
                selectedProduct: null,
                selectedBonusMeta: {
                    bonusDiscountLineItemId: null,
                    promotionId: null
                }
            }

        case MODAL_ACTIONS.SET_PRODUCT_LOADING:
            return {
                ...state,
                isProductLoading: action.payload
            }

        case MODAL_ACTIONS.SET_WISHLIST_LOADING:
            return {
                ...state,
                isWishlistLoading: action.payload
            }

        case MODAL_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload
            }

        case MODAL_ACTIONS.SET_WISHLIST_ERROR:
            return {
                ...state,
                wishlistError: action.payload
            }

        case MODAL_ACTIONS.RESET_STATE:
            return {
                ...initialModalState
            }

        default:
            return state
    }
}
