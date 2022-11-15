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
            const _url = new URL(url)
            if (params) {
                _url.search = new URLSearchParams(params).toString()
            }
            const res = await fetch(_url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await res.json()
            return data
        },
        ...config,
        enabled: !!url && !!token && config?.enabled,
        retry: false
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
    return `${getAppOrigin()}/mobify/proxy/scom/services/data/v57.0/commerce/webstores/${webstoreId}${path}`
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
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(item)
            })
            const t = await res.json()
        },
        {
            onSuccess: () => {
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

export const useCheckoutAction = (checkoutId) => {
    const {
        app: {webstoreId}
    } = getConfig()
    const {token} = useAuth()
    const queryClient = useQueryClient()

    let _url
    if (checkoutId) {
        _url = getApiUrl(`/checkouts/${checkoutId}`)
    } else {
        _url = getApiUrl(`/checkouts`)
    }
    const context = useMutation(
        async (variables) => {
            const {payload, fetchOptions} = variables
            const res = await fetch(_url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                ...fetchOptions,
                body: JSON.stringify(payload)
            })
            const t = await res.json()
        },
        {
            onSuccess: () => {
                console.log('onSuccess on addresses mutation')
                queryClient.invalidateQueries([`/${webstoreId}/checkout/active`, null])
            }
        }
    )
    return context
}

export const useCheckout = (activeOrCheckoutId = 'active', accountId) => {
    const url = getApiUrl(`/checkouts/${activeOrCheckoutId}`)
    const data = useFetch(url)
    return data
}

export const useUserAddresses = (accountId, params) => {
    // if (!accountId) return
    const url = getApiUrl(`/accounts/${accountId}/addresses`)
    const data = useFetch(url, null, {enabled: !!accountId})
    return data
}

export const useAddressAction = (accountId, action) => {
    const {token} = useAuth()
    const queryClient = useQueryClient()
    const {
        app: {webstoreId}
    } = getConfig()

    const context = useMutation(
        async (variables) => {
            const {payload, fetchOptions = {}} = variables
            let _url
            if (action === 'DELETE') {
                _url = getApiUrl(`/accounts/${accountId}/addresses/${payload.addressId}`)
            } else {
                _url = getApiUrl(`/accounts/${accountId}/addresses`)
            }
            const bodyObj = {
                body: JSON.stringify(payload)
            }
            const res = await fetch(_url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                ...fetchOptions,
                ...bodyObj
            })
            const t = method !== 'DELETE' && (await res.json())
        },
        {
            onSuccess: () => {
                console.log('onSuccess on addresses mutation')
                queryClient.invalidateQueries([
                    `/${webstoreId}/accounts/${accountId}/addresses`,
                    null
                ])
            }
        }
    )
    return context
}

export const useProductCategoryPath = (categoryId, params) => {
    const queryParams = new URLSearchParams(params)
    if (categoryId) {
        queryParams.set('parentProductCategoryId', categoryId)
    }
    const queryString = `?${queryParams.toString()}`
    const data = useFetch(
        `${getApiUrl(`/product-category-path/product-categories/${queryString}`)}`
    )
    return data
}

export default useFetch
