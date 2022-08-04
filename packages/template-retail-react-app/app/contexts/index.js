/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'

/**
 * This is the global state for categories, we use this for navigation and for
 * the product list page.
 *
 * To use these context's simply import them into the component requiring context
 * like the below example:
 *
 * import React, {useContext} from 'react'
 * import {CategoriesContext} from './contexts'
 *
 * export const RootCategoryLabel = () => {
 *    const {categories} = useContext(CategoriesContext)
 *    return <div>{categories['root'].name}</div>
 * }
 *
 * Alternatively you can use the hook provided by us:
 *
 * import {useCategories} from './hooks'
 *
 * const {categories, setCategories} = useCategories()
 *
 */
export const CategoriesContext = React.createContext()
export const CategoriesProvider = ({categories: initialCategories = {}, children}) => {
    const [categories, setCategories] = useState(initialCategories)

    return (
        <CategoriesContext.Provider value={{categories, setCategories}}>
            {children}
        </CategoriesContext.Provider>
    )
}

CategoriesProvider.propTypes = {
    children: PropTypes.node.isRequired,
    categories: PropTypes.object
}

/**
 * This is the global state for the multiples sites and locales supported in the App.
 *
 * To use the context simply import them into the component requiring context
 * like the below example:
 *
 * import React, {useContext} from 'react'
 * import {MultiSiteContext} from './contexts'
 *
 * export const RootCurrencyLabel = () => {
 *    const {site,locale,urlTemplate} = useContext(MultiSiteContext)
 *    return <div>{site} {locale}</div>
 * }
 *
 * Alternatively you can use the hook provided by us:
 *
 * import {useMultiSite} from './hooks'
 *
 * const {site, locale, buildUrl} = useMultiSite()
 * @type {React.Context<unknown>}
 */
export const MultiSiteContext = React.createContext()
export const MultiSiteProvider = ({
    site: initialSite = {},
    locale: initialLocale = {},
    buildUrl,
    children
}) => {
    const [site, setSite] = useState(initialSite)
    const [locale, setLocale] = useState(initialLocale)

    return (
        <MultiSiteContext.Provider value={{site, setSite, locale, setLocale, buildUrl}}>
            {children}
        </MultiSiteContext.Provider>
    )
}

MultiSiteProvider.propTypes = {
    children: PropTypes.node.isRequired,
    buildUrl: PropTypes.func,
    site: PropTypes.object,
    locale: PropTypes.string
}

/**
 * This is the global state for currency, we use this throughout the site. For example, on
 * the product-list, product-detail and cart and basket pages..
 *
 * To use these context's simply import them into the component requiring context
 * like the below example:
 *
 * import React, {useContext} from 'react'
 * import {CurrencyContext} from './contexts'
 *
 * export const RootCurrencyLabel = () => {
 *    const {currency} = useContext(CurrencyContext)
 *    return <div>{currency}</div>
 * }
 *
 * Alternatively you can use the hook provided by us:
 *
 * import {useCurrency} from './hooks'
 *
 * const {currency, setCurrency} = useCurrency()
 *
 */
export const CurrencyContext = React.createContext()
export const CurrencyProvider = ({currency: initialCurrency, children}) => {
    const [currency, setCurrency] = useState(initialCurrency)

    return (
        <CurrencyContext.Provider value={{currency, setCurrency}}>
            {children}
        </CurrencyContext.Provider>
    )
}

CurrencyProvider.propTypes = {
    children: PropTypes.node.isRequired,
    currency: PropTypes.string
}
