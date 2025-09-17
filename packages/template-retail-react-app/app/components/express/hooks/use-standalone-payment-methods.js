/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from 'react'
import {AdyenPaymentMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/payment-methods'

// Cache for payment methods data with 10-minute TTL
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes in milliseconds
const CACHE_PREFIX = 'payment-methods' // Prefix for localStorage keys

/**
 * Get cached payment methods data if available and not expired
 * @param {string} cacheKey - The cache key for this request
 * @returns {Object|null} Cached data or null if expired/missing
 */
const getCachedPaymentMethods = (cacheKey) => {
    try {
        const storageKey = `${CACHE_PREFIX}:${cacheKey}`
        const cached = localStorage.getItem(storageKey)

        if (!cached) {
            return null
        }

        const parsed = JSON.parse(cached)
        const now = Date.now()
        const age = now - parsed.timestamp

        if (age > CACHE_TTL) {
            localStorage.removeItem(storageKey)
            return null
        }

        return parsed.data
    } catch (error) {
        console.warn('💾 Cache read error:', error)
        return null
    }
}

/**
 * Set payment methods data in cache
 * @param {string} cacheKey - The cache key for this request
 * @param {Object} data - The payment methods data to cache
 */
const setCachedPaymentMethods = (cacheKey, data) => {
    try {
        const storageKey = `${CACHE_PREFIX}:${cacheKey}`
        const cacheEntry = {
            data,
            timestamp: Date.now()
        }

        localStorage.setItem(storageKey, JSON.stringify(cacheEntry))
    } catch (error) {
        console.warn('💾 Cache write error:', error)
    }
}

/**
 * Generate cache key based on site and locale
 * @param {Object} site - Site configuration
 * @param {Object} locale - Locale configuration
 * @returns {string} Cache key
 */
const generateCacheKey = (site, locale) => {
    return `${site?.id || 'unknown'}:${locale?.id || 'unknown'}`
}

/**
 * Clean up expired cache entries from localStorage
 */
const cleanupExpiredCache = () => {
    try {
        const now = Date.now()
        const keysToRemove = []

        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key))
                    if (now - cached.timestamp > CACHE_TTL) {
                        keysToRemove.push(key)
                    }
                } catch (e) {
                    // Invalid JSON, remove it
                    keysToRemove.push(key)
                }
            }
        })

        keysToRemove.forEach((key) => {
            localStorage.removeItem(key)
        })
    } catch (error) {
        console.warn('💾 Cache cleanup error:', error)
    }
}

/**
 * Hook for fetching payment methods without basket dependency (for "Buy Now" flows)
 * @param {string} authToken - Authentication token
 * @param {object} site - Site configuration
 * @param {object} locale - Locale configuration
 * @param {boolean} enabled - Whether the hook should make API calls (default: true)
 * @returns {object} Payment methods data, loading state, and error
 */
export const useStandalonePaymentMethods = (authToken, site, locale, enabled = true) => {
    const [paymentMethods, setPaymentMethods] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Clean up expired cache entries on hook initialization
        cleanupExpiredCache()

        // Only make API call if enabled and required parameters are available
        if (!enabled || !authToken || !site) {
            return
        }

        const fetchPaymentMethods = async () => {
            const cacheKey = generateCacheKey(site, locale)

            // Show current localStorage cache status
            const cacheEntries = Object.keys(localStorage).filter((key) =>
                key.startsWith(CACHE_PREFIX)
            )

            // Try to get data from cache first
            const cachedData = getCachedPaymentMethods(cacheKey)

            if (cachedData) {
                setPaymentMethods(cachedData)
                return
            }

            try {
                setLoading(true)
                setError(null)

                const service = new AdyenPaymentMethodsService(authToken, site)
                const data = await service.getPaymentMethods()

                // Cache the successful response
                setCachedPaymentMethods(cacheKey, data)

                console.groupEnd()

                setPaymentMethods(data)
            } catch (err) {
                setError(err)
            } finally {
                setLoading(false)
            }
        }

        fetchPaymentMethods()
    }, [authToken, site, locale, enabled])

    return {
        paymentMethods,
        loading,
        error
    }
}
