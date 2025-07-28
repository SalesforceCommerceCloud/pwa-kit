/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback} from 'react'
import useAccessToken from '../useAccessToken'

/**
 * Custom ShopperConsents API client parameters
 */
export interface ShopperConsentsApiParams {
    organizationId: string
    siteId: string
    locale: string
}

/**
 * Subscription consent item
 */
export interface ConsentItem {
    subscriptionId: string
    contactPointValue: string
    channel: string
    status: string
    title?: string
    subtitle?: string
    tags?: string[]
}

/**
 * Custom ShopperConsents API client that uses the proxy endpoint
 * TODO: Replace this with the official commerce-sdk-isomorphic client once available
 */
export const useShopperConsentsApiClient = (params: ShopperConsentsApiParams) => {
    const {getTokenWhenReady} = useAccessToken()
    const {organizationId, siteId, locale} = params

    const apiCall = useCallback(
        async (endpoint: string, method = 'GET', body: any = null) => {
            const token = await getTokenWhenReady()
            const baseUrl = `/mobify/proxy/api/shopper/shopper-consents/v1/organizations/${organizationId}`

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                ...(body && {body: JSON.stringify(body)})
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            return await response.json()
        },
        [getTokenWhenReady, organizationId]
    )

    return {
        /**
         * Get subscription consent items
         */
        getSubscriptions: useCallback(
            async (options: {tags?: string} = {}) => {
                const queryParams = new URLSearchParams({
                    siteId,
                    locale,
                    ...options
                })
                return apiCall(`/subscriptions?${queryParams.toString()}`)
            },
            [apiCall, siteId, locale]
        ),

        /**
         * Create or update a subscription consent
         */
        createSubscription: useCallback(
            async (consentItem: ConsentItem) => {
                return apiCall('/subscriptions', 'POST', consentItem)
            },
            [apiCall]
        )
    }
}
