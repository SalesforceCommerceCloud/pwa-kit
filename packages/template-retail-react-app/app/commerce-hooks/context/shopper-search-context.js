/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {makeStore} from '../utils/utils'

// import {useServerEffect} from '../../scapi-hooks'
import {useServerEffect} from 'pwa-kit-react-sdk/ssr/universal/server-effects'

import {parse as parseSearchParams} from '../../hooks/use-search-params'
import {MAX_CACHE_AGE} from '../../constants'
import {HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'
import {useLocation} from 'react-router-dom'
import {useCommerceAPI} from '../../commerce-api/contexts'

const reducer = (state, action) => {
    console.log('state', state)
    switch (action.type) {
        // update a single product in products
        case 'update_a_product': {
            console.log('action.payload', action.payload)
            const productId = action.payload.productId?.toString()
            const product = state.products[productId]
            return {
                ...state,
                products: {
                    ...state.products,
                    [action.payload.productId]: {...product, ...action.payload}
                }
            }
        }
        case 'update_product_search': {
            return {
                ...state,
                ...action.payload
            }
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`)
        }
    }
}

const initialProductSearchState = {
    // isLoading: false,
    // error: false,
    products: {}
}
export const {
    useStore: useProductsStore,
    StoreProvider: ProductsProvider,
    useDispatch: useProductsDispatch
} = makeStore(reducer, initialProductSearchState)
const REFINEMENT_DISALLOW_LIST = ['c_isNew']

// export const {
//     useStore: useProductsStore,
//     StoreProvider: ProductsProvider,
//     useDispatch: useProductsDispatch
// } = makeStore()

export const useProductSearch = (source) => {
    const dispatch = useProductsDispatch()
    const productSearchStore = useProductsStore()

    const api = useCommerceAPI()
    const {data, isLoading, error} = useServerEffect(async ({res, params, location, ...rest}) => {
        const {categoryId} = params
        console.log('categoryId ====================', categoryId)
        console.log('location', location)
        const urlParams = new URLSearchParams(location.search)
        let searchQuery = urlParams.get('q')
        let isSearch = false

        if (searchQuery) {
            isSearch = true
        }
        // In case somebody navigates to /search without a param
        if (!categoryId && !isSearch) {
            // We will simulate search for empty string
            return {searchQuery: ' ', productSearchResult: {}}
        }

        const searchParams = parseSearchParams(location.search, false)

        if (!searchParams.refine.includes(`cgid=${categoryId}`) && categoryId) {
            searchParams.refine.push(`cgid=${categoryId}`)
        }

        // only search master products
        searchParams.refine.push('htype=master')

        // Set the `cache-control` header values to align with the Commerce API settings.
        if (res) {
            res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
        }

        console.log('firing off ++++++++++++++++++++++++++++++++++++++++')
        const [category, productSearchResult] = await Promise.all([
            isSearch
                ? Promise.resolve()
                : api.shopperProducts.getCategory({
                      parameters: {id: categoryId, levels: 0}
                  }),
            api.shopperSearch.productSearch({
                parameters: searchParams
            })
        ])

        console.log('productSearchResult', productSearchResult)

        // Apply disallow list to refinements.
        productSearchResult.refinements = productSearchResult?.refinements?.filter(
            ({attributeId}) => !REFINEMENT_DISALLOW_LIST.includes(attributeId)
        )

        // The `isomorphic-sdk` returns error objects when they occur, so we
        // need to check the category type and throw if required.
        if (category?.type?.endsWith('category-not-found')) {
            throw new HTTPNotFound(category.detail)
        }

        // reduce and set state
        dispatch({
            type: 'update_product_search',
            payload: {
                // this can be expensive with a large amount of data
                products: reduceProducts(productSearchResult.hits),
                productSearchResult,
                searchQuery
            }
        })

        return {productSearchResult, searchQuery}
    }, source)

    console.log('data', data)

    return {...productSearchStore, isLoading, error}
}

const reduceProducts = (products) => {
    if (!products) {
        return {}
    }

    return products.reduce((acc, curr) => {
        return {...acc, [curr.productId]: curr}
    }, {})
}

// this hooks is used to
export const useProduct = (productId) => {
    console.log('productId', productId)
    const {products} = useProductsStore()

    const dispatch = useProductsDispatch()
    const api = useCommerceAPI()
    console.log('products[productId.toString()]', products[productId.toString()])
    let product
    if (products[productId.toString()]) {
        // this may or may not be full detail
        product = products[productId.toString()]
    }

    console.log('%c product', 'background: orange', product)

    // how to know when to fetch or not to fetch
    const {data, isLoading, error} = useServerEffect(
        async ({location}) => {
            let product
            const urlParams = new URLSearchParams(location.search)

            product = await api.shopperProducts.getProduct({
                parameters: {
                    id: urlParams.get('pid') || productId,
                    allImages: true
                }
            })

            // The `commerce-isomorphic-sdk` package does not throw errors, so
            // we have to check the returned object type to inconsistencies.
            if (typeof product?.type === 'string') {
                throw new HTTPNotFound(product.detail)
            }

            dispatch({
                type: 'update_a_product',
                payload: product
            })

            return {product}
        },
        [productId]
    )
    console.log('data.product', data.product)

    return {product: {...product, ...data.product}, isLoading, error}
}
