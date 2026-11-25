/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useMemo, useRef} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {
    useAccessToken,
    useCommerceApi,
    useConfig,
    useCustomerBaskets,
    useCustomerId,
    useCustomerType,
    useUsid
} from '@salesforce/commerce-sdk-react'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {
    CART_ACTION_EVENT,
    CART_PRODUCTS,
    CART_UPDATE_EVENT,
    CART_CHANGED_EVENT,
    basketVersion,
    createCommerceClientCart,
    mapBasketToWidgetCart
} from '@salesforce/retail-react-app/app/utils/commerce-client-cart'

const pushCartToWidget = (cart) => window.CimulateMessaging?.eventHandlers?.cart?.update?.(cart)

// Raw SDK writes bypass React Query's automatic cache updates: an old shopper's
// response must never enter the current shopper's cache. There is no write retry.
const useCommerceClientCart = ({enabled, ready}) => {
    const api = useCommerceApi()
    const {getTokenWhenReady} = useAccessToken()
    const {enableHttpOnlySessionCookies} = useConfig()
    const customerId = useCustomerId()
    const {customerType} = useCustomerType()
    const {usid} = useUsid()
    const {site, locale, buildUrl} = useMultiSite()
    const {currency} = useCurrency()
    const identity = JSON.stringify([
        site?.id,
        locale?.id,
        currency,
        customerId,
        customerType,
        usid
    ])
    const queryClient = useQueryClient()
    const {data} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: enabled && Boolean(customerId)}
    )
    const basket = data?.baskets?.find((entry) => !entry.temporaryBasket)
    const publishedRef = useRef()
    const current = useRef()
    current.current = {
        api,
        getHeaders: async () => {
            const token = await getTokenWhenReady()
            return enableHttpOnlySessionCookies && typeof window !== 'undefined'
                ? {}
                : {Authorization: `Bearer ${token}`}
        },
        customerId,
        identity,
        siteId: site?.id,
        currency,
        buildUrl
    }

    const adapter = useMemo(
        () =>
            createCommerceClientCart({
                getIdentity: () => current.current.identity,
                readBasket: async (expectedIdentity) => {
                    const session = current.current
                    if (!session.customerId || expectedIdentity !== session.identity)
                        throw new Error('Your shopper session is changing. Open View Cart again.')
                    const headers = await session.getHeaders()
                    if (current.current.identity !== expectedIdentity)
                        throw new Error('Your shopper session changed.')
                    const result = await session.api.shopperCustomers.getCustomerBaskets({
                        parameters: {customerId: session.customerId},
                        headers
                    })
                    const active = result.baskets?.find((entry) => !entry.temporaryBasket)
                    if (!active) return null
                    const basket = await session.api.shopperBasketsV2.getBasket({
                        parameters: {basketId: active.basketId},
                        headers
                    })
                    const ids = [
                        ...new Set((basket.productItems || []).map((item) => item.productId))
                    ]
                    if (!ids.length || !session.api.shopperProducts?.getProducts) return basket
                    try {
                        const products = await queryClient.fetchQuery({
                            queryKey: ['commerce-client', 'products', expectedIdentity, ids],
                            staleTime: 5 * 60 * 1000,
                            retry: false,
                            queryFn: async () => {
                                const chunks = []
                                for (let index = 0; index < ids.length; index += 24)
                                    chunks.push(ids.slice(index, index + 24))
                                const results = await Promise.all(
                                    chunks.map((ids) =>
                                        session.api.shopperProducts.getProducts({
                                            parameters: {ids, expand: ['images', 'variations']},
                                            headers
                                        })
                                    )
                                )
                                return Object.fromEntries(
                                    results
                                        .flatMap((result) => result.data || [])
                                        .map((product) => [product.id, product])
                                )
                            }
                        })
                        return {...basket, [CART_PRODUCTS]: products}
                    } catch (error) {
                        // Catalog decoration must not turn a successful basket read into an uncertain write.
                        return basket
                    }
                },
                writeBasket: async (request, activeBasket, expectedIdentity, beforeMutation) => {
                    const session = current.current
                    const headers = await session.getHeaders()
                    if (current.current.identity !== expectedIdentity)
                        throw new Error('Your shopper session changed.')
                    const client = session.api.shopperBasketsV2
                    let basketId = activeBasket?.basketId
                    if (!basketId) {
                        if (request.action !== 'add') throw new Error('Your basket is empty.')
                        beforeMutation()
                        const created = await client.createBasket({
                            body: {currency: session.currency},
                            headers
                        })
                        basketId = created.basketId
                    }
                    const options = {parameters: {basketId}, headers}
                    beforeMutation()
                    switch (request.action) {
                        case 'add':
                            return client.addItemToBasket({
                                ...options,
                                body: [{productId: request.productId, quantity: request.quantity}]
                            })
                        case 'quantity':
                            return client.updateItemInBasket({
                                ...options,
                                parameters: {basketId, itemId: request.itemId},
                                body: {quantity: request.quantity}
                            })
                        case 'remove':
                            return client.removeItemFromBasket({
                                ...options,
                                parameters: {basketId, itemId: request.itemId}
                            })
                        case 'coupon':
                            return client.addCouponToBasket({
                                ...options,
                                body: {code: request.code.trim()}
                            })
                        default:
                            throw new Error('Unsupported cart action.')
                    }
                },
                publish: (activeBasket) => {
                    const session = current.current
                    const cart = mapBasketToWidgetCart(activeBasket, {
                        checkoutUrl: session.buildUrl('/checkout')
                    })
                    publishedRef.current = basketVersion(activeBasket)
                    // Match the supported SDK customer-basket query by customer, site and
                    // resource. Preserve temporary baskets used by PDP Buy Now.
                    queryClient.setQueriesData(
                        {
                            predicate: ({queryKey}) =>
                                queryKey.includes('/customers/') &&
                                queryKey.includes(session.customerId) &&
                                queryKey.includes('/baskets') &&
                                queryKey[queryKey.length - 1]?.siteId === session.siteId
                        },
                        (old) => {
                            if (!old) return old
                            const baskets = [
                                ...(old.baskets || []).filter((entry) => entry.temporaryBasket),
                                ...(activeBasket ? [activeBasket] : [])
                            ]
                            return {...old, baskets, total: baskets.length}
                        }
                    )
                    return cart
                },
                pushCart: pushCartToWidget,
                clear: () => {
                    publishedRef.current = undefined
                    pushCartToWidget(mapBasketToWidgetCart(null))
                }
            }),
        [queryClient]
    )

    useEffect(() => {
        if (!enabled) return undefined
        adapter.reset()
        if (ready) adapter.refresh().catch(() => {})
        return () => adapter.reset()
    }, [adapter, enabled, ready, identity])

    useEffect(() => {
        if (!enabled || !ready || basketVersion(basket) === publishedRef.current) return
        adapter.refresh().catch(() => {})
    }, [adapter, basket, enabled, ready])

    useEffect(() => {
        if (!enabled || !ready) return undefined
        const handleAction = (event) => {
            const request = event.detail
            if (typeof request?.respond !== 'function') return
            adapter.action(request).then(request.respond)
        }
        const refresh = () => adapter.refresh().catch(() => {})
        window.addEventListener(CART_ACTION_EVENT, handleAction)
        window.addEventListener(CART_UPDATE_EVENT, refresh)
        window.addEventListener(CART_CHANGED_EVENT, refresh)
        return () => {
            window.removeEventListener(CART_ACTION_EVENT, handleAction)
            window.removeEventListener(CART_UPDATE_EVENT, refresh)
            window.removeEventListener(CART_CHANGED_EVENT, refresh)
        }
    }, [adapter, enabled, ready])
}

export default useCommerceClientCart
