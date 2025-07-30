/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from 'react'
import {AdyenPaymentMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/payment-methods'

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
        // Only make API call if enabled and required parameters are available
        if (!enabled || !authToken || !site) {
            return
        }

        const fetchPaymentMethods = async () => {
            try {
                setLoading(true)
                setError(null)

                const service = new AdyenPaymentMethodsService(authToken, site)
                const data = await service.getPaymentMethods()

                setPaymentMethods(data)
            } catch (err) {
                console.error('Error fetching standalone payment methods:', err)
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