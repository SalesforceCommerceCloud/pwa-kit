/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash/isEqual'
import {useCommerceAPI} from '../commerce-api/contexts'

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
 * const {root, findAndModifyFirst, itemsKey, fetchCategoryNode} = useCategories()
 *
 */
export const CategoriesContext = React.createContext()
export const CategoriesProvider = ({treeRoot = {}, children, locale}) => {
    const itemsKey = 'categories'
    const DEFAULT_ROOT_CATEGORY = 'root'
    const LOCAL_STORAGE_PREFIX = `pwa-kit-cat-`

    const api = useCommerceAPI()
    const [root, setRoot] = useState({
        // map over the server-provided cat
        ...treeRoot[DEFAULT_ROOT_CATEGORY],
        [itemsKey]: treeRoot[DEFAULT_ROOT_CATEGORY]?.[itemsKey]?.map((item) => ({
            ...item,
            loaded: item?.loaded ?? false
        }))
    })

    // iterates through each deep nested object and if finds object that has prop and value specified in objToFindBy
    // argument, it replaces the current object with replacementObj, stops recursive walk and returns the whole tree.
    // If none is found, it returns false.
    const findAndModifyFirst = (tree, childrenKey, objToFindBy, replacementObj) => {
        const findKeys = Object.keys(objToFindBy)

        const rootIsMatch = findKeys.every((key) => isEqual(tree[key], objToFindBy[key]))
        if (rootIsMatch) {
            for (let prop in tree) {
                delete tree[prop]
            }
            Object.assign(tree, replacementObj)
            return tree
        }

        const findInChildren = (obj) => {
            if (!Object.prototype.hasOwnProperty.call(obj, childrenKey)) return false
            const children = obj[childrenKey]

            const someChildIsMatch = children.some((child, idx, arr) => {
                const childIsMatch = findKeys.every((key) => {
                    return isEqual(child[key], objToFindBy[key])
                })
                if (childIsMatch) {
                    arr[idx] = replacementObj
                }
                return childIsMatch
            })
            if (someChildIsMatch) return true

            // We can't use `.some` for the search because it short-circuits
            // and we still want to check every child.
            const childrenModified = children.map((child) => {
                return findInChildren(child)
            })
            // If any child was modified, then so was this `obj`
            return childrenModified.some(Boolean)
        }

        const treeModified = findInChildren(tree)
        return treeModified && tree
    }

    const fetchCategoryNode = async (id, levels = 1) => {
        const STALE_TIME = 10000 // 10 seconds
        // return early if there's one that is less than stale time
        // than the stale time
        const storageItem = window?.localStorage?.getItem(LOCAL_STORAGE_PREFIX + id + locale)
        if (Date.now() < storageItem?.fetchTime + STALE_TIME) {
            return storageItem
        }
        let res
        try {
            res = await api.shopperProducts.getCategory({
                parameters: {
                    id,
                    levels
                }
            })
        } catch (e) {
            return e
        }
        const newTree = findAndModifyFirst(
            root,
            itemsKey,
            {id},
            {
                ...res,
                loaded: true,
                [itemsKey]: res?.[itemsKey]?.map((item) => ({...item, loaded: true}))
            }
        )
        setRoot(newTree)
        return res
    }

    useEffect(() => {
        // Server side, we only fetch level 0 categories, for performance, here
        // we request the remaining two levels of category depth
        Promise.all(
            root?.[itemsKey]?.map(async (cat) => {
                // check localstorage first for this data to help remediate O(n) server
                // load burden where n = top level categories
                const storedCategoryData = JSON.parse(
                    window?.localStorage?.getItem(LOCAL_STORAGE_PREFIX + cat?.id + locale)
                )
                if (storedCategoryData) {
                    findAndModifyFirst(
                        root,
                        itemsKey,
                        {id: cat?.id},
                        {
                            ...storedCategoryData,
                            loaded: true,
                            [itemsKey]: storedCategoryData?.[itemsKey]?.map((item) => ({
                                ...item,
                                loaded: true
                            }))
                        }
                    )
                } else {
                    try {
                        const res = await fetchCategoryNode(cat?.id, 2)
                        // store fetched data in local storage for faster access / reduced server load
                        window?.localStorage?.setItem(
                            LOCAL_STORAGE_PREFIX + cat?.id + locale,
                            JSON.stringify({
                                ...res,
                                fetchTime: Date.now()
                            })
                        )
                    } catch (e) {
                        return e
                    }
                }
            })
        )
    }, [])

    return (
        <CategoriesContext.Provider
            value={{
                root,
                findAndModifyFirst,
                itemsKey,
                fetchCategoryNode
            }}
        >
            {children}
        </CategoriesContext.Provider>
    )
}

CategoriesProvider.propTypes = {
    children: PropTypes.node.isRequired,
    treeRoot: PropTypes.object,
    locale: PropTypes.string
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
    locale: PropTypes.object
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
