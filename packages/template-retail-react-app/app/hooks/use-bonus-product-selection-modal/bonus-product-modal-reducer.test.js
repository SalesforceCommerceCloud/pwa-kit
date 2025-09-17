/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    bonusProductModalReducer,
    initialModalState,
    MODAL_ACTIONS
} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/bonus-product-modal-reducer'

describe('bonusProductModalReducer', () => {
    describe('OPEN_SELECTION_MODAL', () => {
        test('opens selection modal with data and resets view state', () => {
            const mockData = {bonusDiscountLineItems: [{id: 'bonus-1'}]}
            const action = {
                type: MODAL_ACTIONS.OPEN_SELECTION_MODAL,
                payload: mockData
            }

            const newState = bonusProductModalReducer(initialModalState, action)

            expect(newState.isSelectionOpen).toBe(true)
            expect(newState.selectionData).toBe(mockData)
            expect(newState.isViewOpen).toBe(false)
            expect(newState.selectedProduct).toBeNull()
            expect(newState.selectedBonusMeta.bonusDiscountLineItemId).toBeNull()
            expect(newState.selectedBonusMeta.promotionId).toBeNull()
            expect(newState.error).toBeNull()
        })
    })

    describe('CLOSE_SELECTION_MODAL', () => {
        test('resets all state to initial state', () => {
            const currentState = {
                isSelectionOpen: true,
                selectionData: {test: 'data'},
                isViewOpen: true,
                selectedProduct: {id: 'product'},
                selectedBonusMeta: {
                    bonusDiscountLineItemId: 'bonus-1',
                    promotionId: 'promo-1'
                },
                error: 'some error'
            }
            const action = {type: MODAL_ACTIONS.CLOSE_SELECTION_MODAL}

            const newState = bonusProductModalReducer(currentState, action)

            expect(newState).toEqual(initialModalState)
        })
    })

    describe('OPEN_PRODUCT_VIEW', () => {
        test('opens product view with product and bonus metadata', () => {
            const mockProduct = {id: 'product-1'}
            const mockBonusDiscountLineItemId = 'bonus-1'
            const mockPromotionId = 'promo-1'
            const action = {
                type: MODAL_ACTIONS.OPEN_PRODUCT_VIEW,
                payload: {
                    product: mockProduct,
                    bonusDiscountLineItemId: mockBonusDiscountLineItemId,
                    promotionId: mockPromotionId
                }
            }

            const newState = bonusProductModalReducer(initialModalState, action)

            expect(newState.isViewOpen).toBe(true)
            expect(newState.selectedProduct).toBe(mockProduct)
            expect(newState.selectedBonusMeta.bonusDiscountLineItemId).toBe(
                mockBonusDiscountLineItemId
            )
            expect(newState.selectedBonusMeta.promotionId).toBe(mockPromotionId)
            expect(newState.error).toBeNull()
        })
    })

    describe('CLOSE_PRODUCT_VIEW', () => {
        test('closes product view and resets product state', () => {
            const currentState = {
                ...initialModalState,
                isViewOpen: true,
                selectedProduct: {id: 'product'},
                selectedBonusMeta: {
                    bonusDiscountLineItemId: 'bonus-1',
                    promotionId: 'promo-1'
                }
            }
            const action = {type: MODAL_ACTIONS.CLOSE_PRODUCT_VIEW}

            const newState = bonusProductModalReducer(currentState, action)

            expect(newState.isViewOpen).toBe(false)
            expect(newState.selectedProduct).toBeNull()
            expect(newState.selectedBonusMeta.bonusDiscountLineItemId).toBeNull()
            expect(newState.selectedBonusMeta.promotionId).toBeNull()
        })
    })

    describe('RETURN_TO_SELECTION', () => {
        test('returns to selection view from product view', () => {
            const currentState = {
                ...initialModalState,
                isSelectionOpen: true,
                isViewOpen: true,
                selectedProduct: {id: 'product'},
                selectedBonusMeta: {
                    bonusDiscountLineItemId: 'bonus-1',
                    promotionId: 'promo-1'
                }
            }
            const action = {type: MODAL_ACTIONS.RETURN_TO_SELECTION}

            const newState = bonusProductModalReducer(currentState, action)

            expect(newState.isSelectionOpen).toBe(true)
            expect(newState.isViewOpen).toBe(false)
            expect(newState.selectedProduct).toBeNull()
            expect(newState.selectedBonusMeta.bonusDiscountLineItemId).toBeNull()
            expect(newState.selectedBonusMeta.promotionId).toBeNull()
        })
    })

    describe('SET_PRODUCT_LOADING', () => {
        test('sets product loading state', () => {
            const action = {
                type: MODAL_ACTIONS.SET_PRODUCT_LOADING,
                payload: true
            }

            const newState = bonusProductModalReducer(initialModalState, action)

            expect(newState.isProductLoading).toBe(true)
        })
    })

    describe('SET_WISHLIST_LOADING', () => {
        test('sets wishlist loading state', () => {
            const action = {
                type: MODAL_ACTIONS.SET_WISHLIST_LOADING,
                payload: true
            }

            const newState = bonusProductModalReducer(initialModalState, action)

            expect(newState.isWishlistLoading).toBe(true)
        })
    })

    describe('SET_ERROR', () => {
        test('sets error state', () => {
            const error = 'Test error'
            const action = {
                type: MODAL_ACTIONS.SET_ERROR,
                payload: error
            }

            const newState = bonusProductModalReducer(initialModalState, action)

            expect(newState.error).toBe(error)
        })
    })

    describe('SET_WISHLIST_ERROR', () => {
        test('sets wishlist error state', () => {
            const error = 'Wishlist error'
            const action = {
                type: MODAL_ACTIONS.SET_WISHLIST_ERROR,
                payload: error
            }

            const newState = bonusProductModalReducer(initialModalState, action)

            expect(newState.wishlistError).toBe(error)
        })
    })

    describe('RESET_STATE', () => {
        test('resets to initial state', () => {
            const currentState = {
                isSelectionOpen: true,
                selectionData: {test: 'data'},
                isViewOpen: true,
                selectedProduct: {id: 'product'},
                isProductLoading: true,
                error: 'error'
            }
            const action = {type: MODAL_ACTIONS.RESET_STATE}

            const newState = bonusProductModalReducer(currentState, action)

            expect(newState).toEqual(initialModalState)
        })
    })

    describe('default case', () => {
        test('returns current state for unknown action', () => {
            const currentState = {...initialModalState, isSelectionOpen: true}
            const action = {type: 'UNKNOWN_ACTION'}

            const newState = bonusProductModalReducer(currentState, action)

            expect(newState).toBe(currentState)
        })
    })

    describe('initialModalState', () => {
        test('has correct initial values', () => {
            expect(initialModalState).toEqual({
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
            })
        })
    })
})
