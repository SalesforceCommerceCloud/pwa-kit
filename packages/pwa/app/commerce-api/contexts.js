/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createContext, useContext} from 'react'

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
export const BasketContext = createContext()
export const BasketProvider = BasketContext.Provider

export const CustomerContext = createContext()
export const CustomerProvider = CustomerContext.Provider

export const CustomerProductListsContext = createContext()
export const CustomerProductListsProvider = CustomerProductListsContext.Provider
