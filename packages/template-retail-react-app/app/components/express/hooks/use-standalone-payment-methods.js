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
            console.log(`💾 Cache miss: No data found for key "${cacheKey}"`)
            return null
        }
        
        const parsed = JSON.parse(cached)
        const now = Date.now()
        const age = now - parsed.timestamp
        
        if (age > CACHE_TTL) {
            // Cache expired, remove it
            console.log(`💾 Cache expired: Data for key "${cacheKey}" is ${age}ms old (TTL: ${CACHE_TTL}ms)`)
            localStorage.removeItem(storageKey)
            return null
        }
        
        console.log(`💾 Cache hit: Data for key "${cacheKey}" is ${age}ms old (TTL: ${CACHE_TTL}ms)`)
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
        
        // Log cache operation
        console.log(`💾 Payment Methods: Cached data for key "${cacheKey}"`)
        console.log(`💾 Cache entries in localStorage: ${Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX)).length}`)
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
        
        Object.keys(localStorage).forEach(key => {
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
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            console.log(`🧹 Removed expired cache entry: ${key}`)
        })
        
        if (keysToRemove.length > 0) {
            console.log(`🧹 Cleaned up ${keysToRemove.length} expired cache entries`)
        }
    } catch (error) {
        console.warn('💾 Cache cleanup error:', error)
    }
}

/**
 * Hook for fetching payment methods without basket dependency (for "Buy Now" flows)
 * @param {string} authToken - Authentication token
 * @param {string} refreshToken - Refresh token for token renewal
 * @param {object} site - Site configuration
 * @param {object} locale - Locale configuration
 * @param {boolean} enabled - Whether the hook should make API calls (default: true)
 * @returns {object} Payment methods data, loading state, and error
 */
export const useStandalonePaymentMethods = (authToken, refreshToken, site, locale, enabled = true) => {
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
            console.log(`🔑 Generated cache key: "${cacheKey}"`)
            
            // Show current localStorage cache status
            const cacheEntries = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX))
            console.log(`💾 Current localStorage cache entries: ${cacheEntries.length}`)
            if (cacheEntries.length > 0) {
                console.log('💾 Cache keys:', cacheEntries.map(key => key.replace(CACHE_PREFIX + ':', '')))
            }
            
            // Try to get data from cache first
            const cacheStartTime = performance.now()
            const cachedData = getCachedPaymentMethods(cacheKey)
            const cacheEndTime = performance.now()
            const cacheDuration = cacheEndTime - cacheStartTime
            
            if (cachedData) {
                console.log(`💾 Payment Methods: Using cached data (retrieved in ${cacheDuration.toFixed(2)}ms)`)
                setPaymentMethods(cachedData)
                return
            }
            
            console.log(`💾 Payment Methods: Cache miss, fetching from API (cache lookup took ${cacheDuration.toFixed(2)}ms)`)
            
            // Mark the start of payment methods API call
            const startTime = performance.now()
            performance.mark('payment-methods-api-start')

            try {
                setLoading(true)
                setError(null)

                const service = new AdyenPaymentMethodsService(authToken, refreshToken, site)
                const data = await service.getPaymentMethods()

                // Mark the successful completion of the API call
                const endTime = performance.now()
                const duration = endTime - startTime
                
                performance.mark('payment-methods-api-success')
                performance.measure(
                    'payment-methods-api-duration',
                    'payment-methods-api-start',
                    'payment-methods-api-success'
                )

                // Cache the successful response
                setCachedPaymentMethods(cacheKey, data)

                // Log performance metrics
                console.log(`🚀 Payment Methods API: ${duration.toFixed(2)}ms`)
                console.group('📊 Payment Methods API Performance')
                console.log(`✅ Success: ${duration.toFixed(2)}ms`)
                console.log(`📡 Network + Processing: ${duration.toFixed(2)}ms`)
                console.log(`🔗 Endpoint: ${site?.adyen?.environment || 'unknown'}`)
                console.log(`💾 Cached: false`)
                console.log(`⚡ Cache lookup: ${cacheDuration.toFixed(2)}ms`)
                console.log(`🚀 Total time: ${(cacheDuration + duration).toFixed(2)}ms`)
                console.groupEnd()

                setPaymentMethods(data)
                
                // Log successful completion summary
                console.log('✅ Payment Methods API: Successfully loaded payment methods')
                console.log(`📊 Total methods available: ${Object.keys(data?.paymentMethods || {}).length}`)
                
            } catch (err) {
                // Mark the error completion of the API call
                const endTime = performance.now()
                const duration = endTime - startTime
                
                performance.mark('payment-methods-api-error')
                performance.measure(
                    'payment-methods-api-duration-error',
                    'payment-methods-api-start',
                    'payment-methods-api-error'
                )

                setError(err)
            } finally {
                setLoading(false)
            }
        }

        fetchPaymentMethods()
    }, [authToken, refreshToken, site, locale, enabled])

    return {
        paymentMethods,
        loading,
        error
    }
}
