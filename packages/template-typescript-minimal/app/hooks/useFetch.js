/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {useAuth} from './useAuth'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

const useFetch = (url, params, config) => {
    const {token} = useAuth()
    const key = url.split('webstores')[1]
    const context = useQuery({
        queryKey: [key.toString(), params],
        queryFn: async ({queryKey}) => {
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await res.json()
            return data
        },
        enabled: !!url && !!token,
        retry: false,
        ...config
    })

    return context
}

const useMutationFetch = (url, params, config) => {
    const {token} = useAuth()
    const context = useQuery(
        (item) => {
            fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                method: 'POST',
                body: JSON.stringify(item)
            })
        },
        {
            onSuccess: () => {}
        }
    )
}

const getApiUrl = (path) => {
    const {
        app: {webstoreId}
    } = getConfig()
    return `${getAppOrigin()}/mobify/proxy/scom/services/data/v55.0/commerce/webstores/${webstoreId}${path}`
}

export const useCategories = (categoryId, params) => {
    const queryParams = new URLSearchParams(params)
    if (categoryId) {
        queryParams.set('parentProductCategoryId', categoryId)
    }
    const queryString = `${queryParams.toString() && '?'}${queryParams.toString()}`
    const data = useFetch(`${getApiUrl(`/product-categories/children${queryString}`)}`)
    return data
}
export const useProduct = (id) => {
    const url = getApiUrl(`/products/${id}`)
    const data = useFetch(url)
    return data
}

export const addItemToCart = (cartStateOrId = 'current') => {
    const {
        app: {webstoreId}
    } = getConfig()
    const {token} = useAuth()
    const queryClient = useQueryClient()
    const url = getApiUrl(`/carts/${cartStateOrId}/cart-items`)
    const context = useMutation(
        async (item) => {
            console.log('item', item)
            console.log('body', JSON.stringify(item))
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(item)
            })
            const t = await res.json()
            console.log('res', t)
        },
        {
            onSuccess: () => {
                console.log('onSuccess')
                queryClient.invalidateQueries([`/${webstoreId}/carts/current`])
            }
        }
    )
    return context
}

export const useProductPrice = (id) => {
    const url = getApiUrl(`/pricing/products/${id}`)
    const data = useFetch(url)
    return data
}
export const useCart = (cartStateOrId = 'current') => {
    const url = getApiUrl(`/carts/${cartStateOrId}`)
    const data = useFetch(url)
    return data
}

export const useCartItems = (cartStateOrId = 'current') => {
    const url = getApiUrl(`/carts/${cartStateOrId}/cart-items`)
    const data = useFetch(url)
    return data
}

export const useCheckout = (activeOrCheckoutId) => {
    const url = getApiUrl(`/checkouts/${activeOrCheckoutId}`)
    const data = useFetch(url)
    return data
}

export const useProductCategoryPath = (categoryId, params) => {
    const queryParams = new URLSearchParams(params)
    if (categoryId) {
        queryParams.set('parentProductCategoryId', categoryId)
    }
    const queryString = `?${queryParams.toString()}`
    const data = useFetch(`${getApiUrl(`/product-category-path/product-categories/${categoryId}`)}`)
    return data
}

export default useFetch
