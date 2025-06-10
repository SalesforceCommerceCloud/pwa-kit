/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {createContext, useReducer, useContext} from 'react'
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {isServer} from '../utils/utils'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

/**
 * Provider and associated hook for accessing the Commerce API in React components.
 */
export const CommerceAPIContext = createContext()
/* eslint-disable react/prop-types */
export const CommerceAPIProvider = ({value, children}) => {
    const {api, site, locale} = value
    const apiClients = api._sdkInstances

    const {shortCode, clientId, organizationId} = api.getConfig().parameters
    const {proxy} = api.getConfig()

    // Recommended settings for PWA-Kit usages.
    // NOTE: they will be applied on both server and client side.
    // retry is always disabled on server side regardless of the value from the options
    const queryClientOptions = {
        queryClientConfig: {
            defaultOptions: {
                queries: {
                    retry: false,
                    refetchOnWindowFocus: false,
                    staleTime: 10 * 1000,
                    ...(isServer ? {retryOnMount: false} : {})
                },
                mutations: {
                    retry: false
                }
            }
        },
        beforeHydrate: (data) => {
            const now = Date.now()

            // Helper to reset the data timestamp to time of app load.
            const updateQueryTimeStamp = ({state}) => {
                state.dataUpdatedAt = now
            }

            // Update serialized mutations and queries to ensure that the cached data is
            // considered fresh on first load.
            data?.mutations?.forEach(updateQueryTimeStamp)
            data?.queries?.forEach(updateQueryTimeStamp)

            return data
        }
    }

    const queryClient = React.useMemo(() => new QueryClient(queryClientOptions), [])

    return (
        <CommerceAPIContext.Provider value={api}>
            <QueryClientProvider client={queryClient}>
                <CommerceApiProvider
                    shortCode={shortCode}
                    clientId={clientId}
                    organizationId={organizationId}
                    siteId={site?.id}
                    locale={locale?.id}
                    currency={locale?.preferredCurrency}
                    redirectURI={`${getAppOrigin()}/callback`}
                    proxy={proxy}
                    apiClients={apiClients}
                >
                    {children}
                </CommerceApiProvider>
            </QueryClientProvider>
        </CommerceAPIContext.Provider>
    )
}

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
    // this is an object of product lists
    // keyed by list id, initial state
    // being undefined indicates the
    // product lists is not initialized
    productLists: undefined
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
                const {id} = payload
                // Tips: if you are unfamiliar with the concept of
                // reducers, keep in mind that reducers must be pure.
                // For an action like this, you must update every
                // level of nested data to avoid unexpected side effects
                return {
                    ...state,
                    productLists: {
                        ...state.productLists,
                        [id]: payload
                    }
                }
            }
            case CPLActionTypes.CREATE_LIST_ITEM: {
                const {listId, item} = payload
                const {productId} = item
                const items = state.productLists[listId]?.customerProductListItems || []

                // if the item is already added to the list
                // we update the existing item
                const existingItemIndex = items.findIndex((i) => i.productId === productId)
                if (existingItemIndex >= 0) {
                    items[existingItemIndex] = item
                } else {
                    items.push(item)
                }
                return {
                    ...state,
                    productLists: {
                        ...state.productLists,
                        [listId]: {
                            ...state.productLists[listId],
                            customerProductListItems: items
                        }
                    }
                }
            }
            case CPLActionTypes.UPDATE_LIST_ITEM: {
                const {listId, item} = payload
                const items = state.productLists[listId].customerProductListItems?.map(
                    (listItem) => {
                        if (listItem.id === item.id) {
                            return {
                                ...listItem,
                                ...item
                            }
                        }
                        return listItem
                    }
                )
                return {
                    ...state,
                    productLists: {
                        ...state.productLists,
                        [listId]: {
                            ...state.productLists[listId],
                            customerProductListItems: items
                        }
                    }
                }
            }
            case CPLActionTypes.REMOVE_LIST_ITEM: {
                const {listId, itemId} = payload
                const productLists = {
                    ...state.productLists
                }
                productLists[listId].customerProductListItems = productLists[
                    listId
                ].customerProductListItems?.filter((listItem) => {
                    return listItem.id !== itemId
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
