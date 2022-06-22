/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const basketsReducer = (state, action) => {
    console.log('state', state)
    switch (action.type) {
        case 'loading': {
            return {
                ...state,
                isLoading: true
            }
        }
        case 'add_to_cart': {
            return {
                ...state,
                isLoading: false,
                error: false,
                // update the basket with res from server
                data: state.data.map((basket) => {
                    return basket.id === action.id ? action.payload : basket
                })
            }
        }
        case 'set_basket': {
            return {
                ...state,
                isLoading: false,
                error: false,
                data: [...state.data, action.payload]
            }
        }
        case 'set_baskets': {
            return {
                ...state,
                isLoading: false,
                error: false,
                data: action.payload.baskets,
                total: action.payload.total
            }
        }
        case 'basket_error': {
            return {...state, isLoading: false, error: true}
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`)
        }
    }
}

export default basketsReducer
