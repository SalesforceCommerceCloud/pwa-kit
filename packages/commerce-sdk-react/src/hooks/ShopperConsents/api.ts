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
    tags: string
}

/**
 * Subscription consent item
 */
export interface ConsentItem {
    subscriptionId: string
    contactPointValue: string
    channel: string
    status: string
}

/**
 * Custom ShopperConsents API client that uses the proxy endpoint
 * TODO: Replace this with the official commerce-sdk-isomorphic client once available
 */
export const useShopperConsentsApiClient = (params: ShopperConsentsApiParams) => {
    const {getTokenWhenReady} = useAccessToken()
    const {organizationId, siteId, locale, tags} = params

    const apiCallout = useCallback(
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

            const responseJson: string = await response.json()
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, body: ${responseJson}`)
            }

            return responseJson
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
                    tags,
                    ...options
                })
                return apiCallout(`/subscriptions?${queryParams.toString()}`)
            },
            [apiCallout, siteId, locale, tags]
        ),

        /**
         * Create or update a subscription consent
         */
        upsertSubscription: useCallback(
            async (consentItem: ConsentItem) => {
                const queryParams = new URLSearchParams({
                    siteId,
                    locale
                })
                return apiCallout(`/subscriptions?${queryParams.toString()}`, 'POST', consentItem)
            },
            [apiCallout, siteId, locale]
        )
    }
}
