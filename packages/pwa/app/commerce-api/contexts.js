/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {createContext, useContext, useReducer} from 'react'

/**
 * Provider and associated hook for accessing the Commerce API in React components.
 */
export const CommerceAPIContext = createContext()
export const CommerceAPIProvider = CommerceAPIContext.Provider
export const useCommerceAPI = () => useContext(CommerceAPIContext)

/**
 * There are a few sources of global state in the react retail storefront.
 * Using React Context we implement a simple shared global state allowing
 * you can update and use either state from anywhere in the application.
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
    isLoading: false,
    productLists: {
        // this is a map of product lists
        // keyed by list id
    }
}
const CPLActionTypes = {
    RECEIVE_LISTS: 'RECEIVE_LISTS',
    CREATE_LIST_ITEM: 'CREATE_LIST_ITEM',
    UPDATE_LIST_ITEM: 'UPDATE_LIST_ITEM',
    REMOVE_LIST_ITEM: 'REMOVE_LIST_ITEM',
    SET_LOADING: 'SET_LOADING',
    RESET: 'RESET'
}
export const CustomerProductListsContext = createContext(CPLInitialValue)
const _CustomerProductListsProvider = CustomerProductListsContext.Provider
export const CustomerProductListsProvider = ({children}) => {
    const [state, dispatch] = useReducer((state, {type, payload}) => {
        let productLists

        switch (type) {
            case CPLActionTypes.RECEIVE_LISTS:
                productLists = payload.reduce((prev, curr) => {
                    return {
                        ...prev,
                        [curr.id]: curr
                    }
                }, {})
                return {...state, productLists}
            case CPLActionTypes.CREATE_LIST_ITEM:
                productLists = {
                    ...state.productLists
                }

                productLists[payload.listId].customerProductListItems = [
                    ...productLists[payload.listId].customerProductListItems,
                    payload.item
                ]

                return {...state, productLists}
            case CPLActionTypes.UPDATE_LIST_ITEM:
                productLists = {
                    ...state.productLists
                }
                productLists[payload.listId].customerProductListItems = productLists[
                    payload.listId
                ].customerProductListItems.map((listItem) => {
                    if (listItem.id === payload.item.id) {
                        return {
                            ...listItem,
                            ...payload.item
                        }
                    }
                    return listItem
                })
                return {...state, productLists}
            case CPLActionTypes.REMOVE_LIST_ITEM:
                productLists = {
                    ...state.productLists
                }
                productLists[payload.listId].customerProductListItems = productLists[
                    payload.listId
                ].customerProductListItems.filter((listItem) => {
                    return listItem.id !== payload.itemId
                })
                return {...state, productLists}
            case CPLActionTypes.SET_LOADING:
                return {...state, isLoading: payload}
            case CPLActionTypes.RESET:
                return {...CPLInitialValue}
            default:
                throw new Error('Unknown action.')
        }
    }, CPLInitialValue)

    const actions = {
        receiveLists: (lists) => dispatch({type: CPLActionTypes.RECEIVE_LISTS, payload: lists}),
        createListItem: (listId, item) =>
            dispatch({type: CPLActionTypes.CREATE_LIST_ITEM, payload: {listId, item}}),
        updateListItem: (listId, item) =>
            dispatch({type: CPLActionTypes.UPDATE_LIST_ITEM, payload: {listId, item}}),
        removeListItem: (listId, itemId) =>
            dispatch({type: CPLActionTypes.REMOVE_LIST_ITEM, payload: {listId, itemId}}),
        setLoading: (isLoading) => dispatch({type: CPLActionTypes.SET_LOADING, payload: isLoading}),
        reset: () => dispatch({type: CPLActionTypes.RESET})
    }

    return (
        <_CustomerProductListsProvider value={{state, actions}}>
            {children}
        </_CustomerProductListsProvider>
    )
}
