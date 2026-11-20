/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useLayoutEffect, useMemo, useRef} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'

// Local state in the existing app-scoped cache; never fetched or shared across SSR requests.
export const COMMERCE_CLIENT_PAGE_CONTEXT_KEY = ['commerce-client-page-context']
const MAX_SRP_PRODUCTS = 50
const MAX_PRODUCT_TEXT_LENGTH = 128
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export const getCommerceClientPageContext = (queryClient) =>
    queryClient.getQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY)?.context ?? null

/** Publish only resolved data for the current product request, including selected variants. */
export const useCommerceClientPdpContext = ({
    product,
    requestedProductId,
    variant,
    isLoading,
    isPreviousData,
    isError
}) => {
    const valid = !isLoading && !isPreviousData && !isError && product?.id === requestedProductId
    const id = valid ? variant?.productId || product?.id : null
    const name = valid ? product?.name : undefined
    const imageUrl = valid ? product?.imageGroups?.[0]?.images?.[0]?.link : undefined
    const context = useMemo(
        () =>
            typeof id === 'string' && id.trim()
                ? {
                      type: 'pdp',
                      id: id.trim(),
                      ...(name ? {name} : {}),
                      ...(imageUrl ? {imageUrl} : {})
                  }
                : null,
        [id, name, imageUrl]
    )

    useCommerceClientPageContext(context)
}

// Share the same ownership and synchronization for PDP and SRP.
const useCommerceClientPageContext = (context) => {
    const queryClient = useQueryClient()
    // Symbols retain identity through React Query's structural sharing.
    const owner = useRef(Symbol('page-context'))

    // Commit before the widget's passive injection effect or another browser event.
    // Retain the latest desired value even if the messaging bundle has not loaded.
    useClientLayoutEffect(() => {
        queryClient.setQueryDefaults(COMMERCE_CLIENT_PAGE_CONTEXT_KEY, {cacheTime: Infinity})
        queryClient.setQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY, {owner: owner.current, context})
    }, [queryClient, context])

    useClientLayoutEffect(() => {
        const currentOwner = owner.current
        return () => {
            // An old page's cleanup must not clear a newer page's committed context.
            if (
                queryClient.getQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY)?.owner === currentOwner
            ) {
                queryClient.setQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY, {context: null})
            }
        }
    }, [queryClient])
}

const getListingProduct = (hit, currency) => {
    const id = typeof hit?.productId === 'string' ? hit.productId.trim() : ''
    if (!id || id.length > MAX_PRODUCT_TEXT_LENGTH) return null

    const product = {id}
    const name = hit.name ?? hit.productName
    if (typeof name === 'string' && name.trim() && name.trim().length <= MAX_PRODUCT_TEXT_LENGTH) {
        product.name = name.trim()
    }

    // Variant swatches can change the tile price, and sets display a starting price.
    // The SRP contract needs a verified amount or both displayed range bounds.
    if (
        currency &&
        Number.isFinite(hit.price) &&
        !hit.variants?.length &&
        !['master', 'set'].includes(hit.hitType) &&
        !hit.type?.master &&
        !hit.type?.set
    ) {
        const {currentPrice} = getPriceData(hit)
        if (Number.isFinite(currentPrice) && currentPrice >= 0) product.price = currentPrice
    }
    return product
}

/** Normalize resolved SCAPI selections and the hits rendered by ProductList. */
export const buildCommerceClientSrpContext = (query, result, {category, currency} = {}) => {
    const phrase = typeof query === 'string' ? query.trim() : ''
    const categoryId = typeof category?.id === 'string' ? category.id.trim() : ''
    const categoryName = typeof category?.name === 'string' ? category.name.trim() : ''
    if ((!phrase && !(categoryId && categoryName)) || !result) return null
    const context = {type: 'srp'}
    if (phrase) context.query = phrase
    if (categoryId && categoryName) context.category = {id: categoryId, name: categoryName}
    if (typeof result.selectedSortingOption === 'string' && result.selectedSortingOption.trim()) {
        context.sortRuleId = result.selectedSortingOption.trim()
    }

    const currencyCode = /^[A-Z]{3}$/.test(currency) ? currency : undefined
    if (Array.isArray(result.hits)) {
        context.products = result.hits
            .slice(0, MAX_SRP_PRODUCTS)
            .map((hit) => getListingProduct(hit, currencyCode))
            .filter(Boolean)
        if (context.products.length < result.hits.length) context.productsPartial = true
        if (context.products.some(({price}) => price !== undefined)) {
            context.currencyCode = currencyCode
        }
    } else if (result.total === 0) {
        context.products = []
    }
    const refinements = []
    for (const [name, selection] of Object.entries(result.selectedRefinements || {})) {
        if (['cgid', 'htype', 'ilids'].includes(name)) continue
        if (name === 'price') {
            if (typeof selection !== 'string') return null
            const match = /^\((\d+(?:\.\d+)?)?\.\.(\d+(?:\.\d+)?)?\)$/.exec(selection)
            if (!match || (!match[1] && !match[2])) return null
            if (match[1] !== undefined) context.minPrice = Number(match[1])
            if (match[2] !== undefined) context.maxPrice = Number(match[2])
            if (
                (context.minPrice !== undefined && !Number.isFinite(context.minPrice)) ||
                (context.maxPrice !== undefined && !Number.isFinite(context.maxPrice)) ||
                (context.minPrice !== undefined &&
                    context.maxPrice !== undefined &&
                    context.minPrice > context.maxPrice)
            )
                return null
            continue
        }
        const values = Array.isArray(selection)
            ? selection
            : typeof selection === 'string'
            ? selection.split('|')
            : [selection]
        if (
            !name.trim() ||
            values.length === 0 ||
            values.some((value) => typeof value !== 'string' || !value.trim())
        )
            return null
        refinements.push({name, values})
    }
    if (refinements.length) context.refinements = refinements
    return context
}

export const useCommerceClientSrpContext = ({
    query,
    result,
    isSuccess,
    isPreviousData,
    isError,
    requestedCategoryId,
    category,
    currency
}) => {
    // React Query's observer associates success/data with the effective request key
    // (including refinements, inventory, sorting and pagination). Same-key refetches
    // retain valid context; a different key's placeholder data must clear it.
    const serialized = JSON.stringify(
        isSuccess &&
            !isPreviousData &&
            !isError &&
            (!requestedCategoryId || category?.id === requestedCategoryId)
            ? buildCommerceClientSrpContext(query, result, {category, currency})
            : null
    )
    const context = useMemo(() => JSON.parse(serialized), [serialized])
    useCommerceClientPageContext(context)
}
