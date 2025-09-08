/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

/**
 * Hook to get server-detected country from MRT/CloudFront headers
 * 
 * ⚠️ WARNING: This only works in MRT (Managed Runtime) environments.
 * In local development, this will return null.
 */
const useServerCountryDetection = (appOrigin) => {
    return useQuery({
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
                console.warn('Server country detection failed (expected in development):', error.message)
                return null
            }
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
        retry: false,
        meta: {
            errorPolicy: 'silent'
        }
    })
}

/**
 * Detects country code using multiple fallback strategies
 * Possible values for source:
    'server-mrt' - Country detected from MRT/CloudFront headers (production)
    'browser' - Country extracted from browser locale (e.g., navigator.language = 'en-US' → 'US')
    'site-locale' - Country from current site locale (e.g., current locale 'en-CA' → 'CA')
    'site-default' - Country from site's default locale (e.g., site default 'en-GB' → 'GB')
    'hardcoded-fallback' - Final fallback when nothing else worked (returns 'US')
 */
const detectCountryCode = (options = {}) => {
    const {site, locale, serverCountry} = options
    
    // Priority 1: Server-detected country (MRT/CloudFront)
    if (serverCountry) {
        return { country: serverCountry, source: 'server-mrt' }
    }
    
    // Priority 2: Browser locale
    if (typeof window !== 'undefined') {
        const browserLocale = navigator.language || navigator.languages?.[0]
        if (browserLocale) {
            const countryFromLocale = browserLocale.split('-')[1]
            if (countryFromLocale && countryFromLocale.length === 2) {
                return { country: countryFromLocale.toUpperCase(), source: 'browser' }
            }
        }
    }
    
    // Priority 3: Site's current locale (e.g., 'en-US' -> 'US')
    if (locale?.id) {
        const localeCountry = locale.id.split('-')[1]
        if (localeCountry && localeCountry.length === 2) {
            return { country: localeCountry.toUpperCase(), source: 'site-locale' }
        }
    }
    
    // Priority 4: Site's default locale (e.g., 'en-GB' -> 'GB')
    if (site?.l10n?.defaultLocale) {
        const defaultCountry = site.l10n.defaultLocale.split('-')[1]
        if (defaultCountry && defaultCountry.length === 2) {
            return { country: defaultCountry.toUpperCase(), source: 'site-default' }
        }
    }
    
    // Priority 5: Final fallback
    return { country: 'US', source: 'hardcoded-fallback' }
}

/**
 * Hook to detect country code using all available strategies
 * Handles MRT server detection, browser locale, and site configuration automatically
 * 
 * @returns {Object} {country: string, source: string, isLoading: boolean}
 * 
 * @example
 * // Basic usage (works everywhere)
 * const {country, source, isLoading} = useCountryDetection()
 */
export const useCountryDetection = () => {
    const appOrigin = useAppOrigin()
    const {site, locale} = useMultiSite()
    
    // Get server country (null in development, actual country in MRT)
    const {data: serverCountry, isLoading: serverLoading} = useServerCountryDetection(appOrigin)
    
    // Detect country using all strategies
    const countryResult = useMemo(() => {
        return detectCountryCode({
            site,
            locale,
            serverCountry
        })
    }, [site, locale, serverCountry])
    
    return {
        country: countryResult.country,
        source: countryResult.source,
        isLoading: serverLoading
    }
}