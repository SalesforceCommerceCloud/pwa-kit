/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import {expressPaymentManager} from './express-payment-manager'

/**
 * React hook to integrate ExpressPaymentManager with components
 * @param {string[]} paymentMethodIds - Array of payment method identifiers to track
 * @returns {object} - Manager instance and helper functions
 */
export function useExpressPaymentManager(paymentMethodIds) {
    console.log('[useExpressPaymentManager] Hook called with payment method IDs:', paymentMethodIds)
    
    try {
        console.log('[useExpressPaymentManager] About to call useEffect...')
        
        useEffect(() => {
            console.log('[useExpressPaymentManager] useEffect triggered')
            console.log('[useExpressPaymentManager] Initializing manager with payment methods:', paymentMethodIds)
            
            if (Array.isArray(paymentMethodIds) && paymentMethodIds.length > 0) {
                console.log('[useExpressPaymentManager] About to call expressPaymentManager.initialize...')
                expressPaymentManager.initialize(paymentMethodIds)
                console.log('[useExpressPaymentManager] expressPaymentManager.initialize called successfully')
            } else {
                console.warn('[useExpressPaymentManager] No payment method IDs provided or invalid array')
            }
        }, [paymentMethodIds])
        
        console.log('[useExpressPaymentManager] useEffect set up successfully')
        
        // Helper functions for components
        const setAvailable = (paymentMethod) => {
            console.log('[useExpressPaymentManager] Setting payment method as available:', paymentMethod)
            expressPaymentManager.setPaymentMethodAvailable(paymentMethod)
        }
        
        const setUnavailable = (paymentMethod) => {
            console.log('[useExpressPaymentManager] Setting payment method as unavailable:', paymentMethod)
            expressPaymentManager.setPaymentMethodUnavailable(paymentMethod)
        }
        
        const getState = () => {
            const state = expressPaymentManager.getState()
            console.log('[useExpressPaymentManager] Current manager state:', state)
            return state
        }
        
        console.log('[useExpressPaymentManager] About to return manager instance and helpers')
        
        return {
            manager: expressPaymentManager,
            setAvailable,
            setUnavailable,
            getState
        }
    } catch (error) {
        console.error('[useExpressPaymentManager] Error in hook:', error)
        console.error('[useExpressPaymentManager] Error stack:', error.stack)
        throw error
    }
} 