/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useState} from 'react'
import {ConsentItem, ShopperConsentsApiParams, useShopperConsentsApiClient} from './api'

/**
 * Custom hook for fetching subscription consent items
 * TODO: Replace with useQuery pattern when ShopperConsents client is available
 */
export const useShopperConsent = (params: ShopperConsentsApiParams) => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<any>(null)

    const apiClient = useShopperConsentsApiClient(params)

    const fetchConsentItems = useCallback(
        async (tags?: string) => {
            setIsLoading(true)
            setError(null)

            try {
                const result = await apiClient.getSubscriptions({...(tags && {tags})})
                setData(result)
                return result
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to fetch consent items'
                setError(errorMessage)
                throw err
            } finally {
                setIsLoading(false)
            }
        },
        [apiClient]
    )

    return {
        data,
        isLoading,
        error,
        fetchConsentItems
    }
}

/**
 * Custom hook for submitting shopper marketing consents
 * TODO: Replace with useMutation pattern when ShopperConsents client is available
 */
export const useShopperConsentMutation = (params: ShopperConsentsApiParams) => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const apiClient = useShopperConsentsApiClient(params)

    const submitConsent = useCallback(
        async (consentItem: ConsentItem) => {
            setIsLoading(true)
            setError(null)

            try {
                return await apiClient.upsertSubscription(consentItem)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to submit consent'
                setError(errorMessage)
                throw err
            } finally {
                setIsLoading(false)
            }
        },
        [apiClient]
    )

    return {
        isLoading,
        error,
        submitConsent
    }
}
