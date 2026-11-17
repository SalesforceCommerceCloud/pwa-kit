/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useLayoutEffect, useMemo, useRef} from 'react'
import {useQueryClient} from '@tanstack/react-query'

// Local state in the existing app-scoped cache; never fetched or shared across SSR requests.
export const COMMERCE_CLIENT_PAGE_CONTEXT_KEY = ['commerce-client-page-context']
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export const getCommerceClientPageContext = (queryClient) =>
    queryClient.getQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY)?.context ?? null

/** Publish only resolved data for the current product request, including selected variants. */
export const useCommerceClientPdpContext = ({
    enabled = false,
    product,
    variant,
    isLoading,
    isPreviousData,
    isError
}) => {
    const queryClient = useQueryClient()
    // Symbols retain identity through React Query's structural sharing.
    const owner = useRef(Symbol('pdp'))
    // useProduct is keyed by the requested ID; previous data belongs to the old key.
    const valid = !isLoading && !isPreviousData && !isError && product?.id
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

    useClientLayoutEffect(() => {
        if (!enabled) return
        queryClient.setQueryDefaults(COMMERCE_CLIENT_PAGE_CONTEXT_KEY, {cacheTime: Infinity})
    }, [queryClient, enabled])

    // Commit before the widget's passive injection effect or another browser event.
    // Retain the latest desired value even if the messaging bundle has not loaded.
    useClientLayoutEffect(() => {
        if (!enabled) return
        queryClient.setQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY, {owner: owner.current, context})
    }, [queryClient, context, enabled])

    useClientLayoutEffect(() => {
        if (!enabled) return
        const currentOwner = owner.current
        return () => {
            // An old PDP's cleanup must not clear a newer PDP's committed context.
            if (
                queryClient.getQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY)?.owner === currentOwner
            ) {
                queryClient.setQueryData(COMMERCE_CLIENT_PAGE_CONTEXT_KEY, {context: null})
            }
        }
    }, [queryClient, enabled])
}
