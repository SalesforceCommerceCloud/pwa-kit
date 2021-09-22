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
    productLists: {
        // this is a map of product lists
        // keyed by list id
    }
}
const CPLActionTypes = {
    RECEIVE_LISTS: 'RECEIVE_LISTS',
    RECEIVE_LIST: 'RECEIVE_LIST',
    CREATE_LIST_ITEM: 'CREATE_LIST_ITEM',
    UPDATE_LIST_ITEM: 'UPDATE_LIST_ITEM',
    REMOVE_LIST_ITEM: 'REMOVE_LIST_ITEM',
    RESET: 'RESET'
}
export const CustomerProductListsContext = createContext(CPLInitialValue)
// eslint-disable-next-line react/prop-types
export const CustomerProductListsProvider = ({children}) => {
    const [state, dispatch] = useReducer((state, {type, payload}) => {
        switch (type) {
            case CPLActionTypes.RECEIVE_LISTS: {
                const productLists = payload.reduce((acc, curr) => {
                    return {
                        ...acc,
                        [curr.id]: curr
                    }
                }, {})
                return {...state, productLists}
            }
            case CPLActionTypes.RECEIVE_LIST: {
                // Tips: if you are unfamiliar with the concept of
                // reducers, keep in mind that reducers must be pure.
                // For an action like this, you must update every
                // level of nested data to avoid unexpected side effects
                return {
                    ...state,
                    productLists: {
                        ...state.productLists,
                        [payload.id]: payload
                    }
                }
            }
            case CPLActionTypes.CREATE_LIST_ITEM: {
                const items = state.productLists[payload.listId]?.customerProductListItems || []

                // if the item is already added to the list
                // we update the existing item
                const existingItemIndex = items.findIndex((item) => item.id === payload.item.id)
                if (existingItemIndex >= 0) {
                    items[existingItemIndex] = payload.item
                } else {
                    items.push(payload.item)
                }
                return {
                    ...state,
                    productLists: {
                        ...state.productLists,
                        [payload.listId]: {
                            ...state.productLists[payload.listId],
                            customerProductListItems: items
                        }
                    }
                }
            }
            case CPLActionTypes.UPDATE_LIST_ITEM: {
                const productLists = {
                    ...state.productLists
                }
                productLists[payload.listId].customerProductListItems = productLists[
                    payload.listId
                ].customerProductListItems?.map((listItem) => {
                    if (listItem.id === payload.item.id) {
                        return {
                            ...listItem,
                            ...payload.item
                        }
                    }
                    return listItem
                })
                return {...state, productLists}
            }
            case CPLActionTypes.REMOVE_LIST_ITEM: {
                const productLists = {
                    ...state.productLists
                }
                productLists[payload.listId].customerProductListItems = productLists[
                    payload.listId
                ].customerProductListItems?.filter((listItem) => {
                    return listItem.id !== payload.itemId
                })
                return {...state, productLists}
            }
            case CPLActionTypes.RESET: {
                return {...CPLInitialValue}
            }
            default:
                throw new Error('Unknown action.')
        }
    }, CPLInitialValue)

    const actions = {
        receiveLists: (lists) => dispatch({type: CPLActionTypes.RECEIVE_LISTS, payload: lists}),
        receiveList: (list) => dispatch({type: CPLActionTypes.RECEIVE_LIST, payload: list}),
        createListItem: (listId, item) =>
            dispatch({type: CPLActionTypes.CREATE_LIST_ITEM, payload: {listId, item}}),
        updateListItem: (listId, item) =>
            dispatch({type: CPLActionTypes.UPDATE_LIST_ITEM, payload: {listId, item}}),
        removeListItem: (listId, itemId) =>
            dispatch({type: CPLActionTypes.REMOVE_LIST_ITEM, payload: {listId, itemId}}),
        reset: () => dispatch({type: CPLActionTypes.RESET})
    }

    return (
        <CustomerProductListsContext.Provider value={{state, actions}}>
            {children}
        </CustomerProductListsContext.Provider>
    )
}
