/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useQuery} from '@tanstack/react-query'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

/**
 * Hook to detect payment country code
 *
 * @returns {Object} {countryCode: string, isLoading: boolean}
 *
 * @example
 * const {countryCode, isLoading} = useSFPaymentsCountry()
 */
export const useSFPaymentsCountry = () => {
    const {locale} = useMultiSite()
    const appOrigin = useAppOrigin()

    const {data: serverCountry, isLoading: serverLoading} = useQuery({
        queryKey: ['server-country'],
        queryFn: async () => {
            try {
                const response = await fetch(`${appOrigin}/api/detect-country`)
                if (!response.ok) {
                    return null
                }
                const data = await response.json()
                return data.countryCode || null
            } catch (error) {
                console.warn(
                    'Server country detection failed (expected in development):',
                    error.message
                )
                return null
            }
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
        retry: false,
        meta: {
            errorPolicy: 'silent'
        }
    })

    // Derive country from locale as fallback (e.g., "de-DE" -> "DE")
    const localeCountry = locale?.id?.split('-')?.[1] || null

    return {
        countryCode: serverCountry || localeCountry,
        isLoading: serverLoading
    }
}
