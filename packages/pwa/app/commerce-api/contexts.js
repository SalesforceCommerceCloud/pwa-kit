/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {createContext, useContext, useReducer} from 'react'
import {PWA_DEFAULT_WISHLIST_NAME} from '../constants'

/**
 * Provider and associated hook for accessing the Commerce API in React components.
 */
export const CommerceAPIContext = createContext()
export const CommerceAPIProvider = CommerceAPIContext.Provider
export const useCommerceAPI = () => useContext(CommerceAPIContext)

/**
 * There are two sources of global state in the react retail storefront. One is
 * the customer and the other is the customers basket. Using React Context we
 * implement a simple shared global state allowing you can update and use either state
 * from anywhere in the application.
 *
 * If your global state needs require a more robust solution, these contexts can be
 * replaced by a third party state management library of your choosing, such as MobX
 * or Redux.
 *
 * To use these context's simply import them into the component requiring context
 * like the below example:
 *
 * import React, {useContext} from 'react'
 * import {BasketContext} from 'components/_app-config'
 *
 * export const Avatar = () => {
 *    const {customer} = useContext(BasketContext)
 *    return <div>{customer.name}</div>
 * }
 *
 */

/************ Basket ************/
export const BasketContext = createContext()
export const BasketProvider = BasketContext.Provider

/************ Customer ************/
export const CustomerContext = createContext()
export const CustomerProvider = CustomerContext.Provider

/************ Customer Product Lists ************/
const CPLInitialValue = {
    isLoading: true,
    productLists: [],
    wishlist: {}
}
const CPLActionTypes = {
    RECEIVE: 'RECEIVE',
    SET_LOADING: 'SET_LOADING',
    RESET: 'RESET'
}
export const CustomerProductListsContext = createContext(CPLInitialValue)
const _CustomerProductListsProvider = CustomerProductListsContext.Provider
export const CustomerProductListsProvider = ({children}) => {
    const [state, dispatch] = useReducer((state, {type, payload}) => {
        let productLists
        let wishlist
        switch (type) {
            case CPLActionTypes.RECEIVE:
                productLists = [...payload]
                wishlist = productLists.find((list) => {
                    return list.name === PWA_DEFAULT_WISHLIST_NAME
                })
                return {...state, wishlist, productLists}
            case CPLActionTypes.SET_LOADING:
                return {...state, isLoading: payload}
            case CPLActionTypes.RESET:
                return {...CPLInitialValue}
            default:
                throw new Error('Unknown action.')
        }
    }, CPLInitialValue)

    const actions = {
        receive: (list) => dispatch({type: CPLActionTypes.RECEIVE, payload: list}),
        setLoading: (isLoading) => dispatch({type: CPLActionTypes.SET_LOADING, payload: isLoading}),
        reset: () => dispatch({type: CPLActionTypes.RESET})
    }

    return (
        <_CustomerProductListsProvider value={{state, actions}}>
            {children}
        </_CustomerProductListsProvider>
    )
}
