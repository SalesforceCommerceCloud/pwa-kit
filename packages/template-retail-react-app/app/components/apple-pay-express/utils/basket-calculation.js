/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Validates common parameters and gets organization config
 * @param {string} basketId - The basket ID
 * @param {string} authToken - Authentication token
 * @param {object} site - Site configuration object
 * @returns {string} organizationId
 */
const validateParamsAndGetConfig = (basketId, authToken, site) => {
    if (!basketId) {
        throw new Error('Basket ID is required')
    }
    
    if (!authToken) {
        throw new Error('Authentication token is required')
    }
    
    if (!site?.id) {
        throw new Error('Site ID is required')
    }
    
    const {app: {commerceAPI: config}} = getConfig()
    const {organizationId} = config.parameters
    
    if (!organizationId) {
        throw new Error('Organization ID is required and not found in configuration')
    }
    
    return organizationId
}

/**
 * Calculates basket totals using the Salesforce Commerce API
 * This ensures orderTotal, shippingTotal, and taxTotal are properly calculated
 * @param {string} basketId - The basket ID to calculate totals for
 * @param {string} authToken - Authentication token
 * @param {object} site - Site configuration object
 * @returns {Promise<object>} - The updated basket with calculated totals
 */
export const calculateBasketTotals = async (basketId, authToken, site) => {
    try {
        const organizationId = validateParamsAndGetConfig(basketId, authToken, site)
        
        // Use PATCH method to update/calculate the basket
        // This triggers the Commerce Cloud to recalculate all totals
        const requestUrl = `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}?siteId=${site.id}`
        
        const response = await fetch(requestUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                // Empty body - this triggers recalculation without changing anything
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        const calculatedBasket = await response.json()
        
        return calculatedBasket
    } catch (error) {
        throw error
    }
}

/**
 * Alternative method using direct basket retrieval to get calculated totals
 * @param {string} basketId - The basket ID to retrieve with calculated totals
 * @param {string} authToken - Authentication token  
 * @param {object} site - Site configuration object
 * @returns {Promise<object>} - The basket with current totals
 */
export const getBasketWithTotals = async (basketId, authToken, site) => {
    try {
        const organizationId = validateParamsAndGetConfig(basketId, authToken, site)
        
        // GET the basket to retrieve current calculated totals
        const requestUrl = `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}?siteId=${site.id}`
        
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        const basket = await response.json()
        
        return basket
    } catch (error) {
        throw error
    }
}

/**
 * Forces final order calculation by applying a default shipping method if none exists
 * This ensures orderTotal is calculated before payment processing
 * @param {string} basketId - The basket ID to finalize
 * @param {string} authToken - Authentication token
 * @param {object} site - Site configuration object
 * @returns {Promise<object>} - The finalized basket with orderTotal
 */
export const forceOrderCalculation = async (basketId, authToken, site) => {
    try {
        // First, get the current basket state
        const currentBasket = await getBasketWithTotals(basketId, authToken, site)
        
        // If orderTotal is already calculated, return as-is
        if (currentBasket.orderTotal !== null && currentBasket.orderTotal !== undefined) {
            return currentBasket
        }
        
        // Check if we have a shipping method applied
        const hasShippingMethod = currentBasket.shipments?.[0]?.shippingMethod != null
        
        if (!hasShippingMethod) {
            // Apply a default shipping method to trigger order total calculation
            const organizationId = validateParamsAndGetConfig(basketId, authToken, site)
            const shippingUrl = `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}/shipments/me/shipping-method?siteId=${site.id}`
            
            // Try common shipping method IDs in order of preference
            const shippingMethodIds = ['001', 'Ground', 'standard']
            
            for (const methodId of shippingMethodIds) {
                const shippingResponse = await fetch(shippingUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        id: methodId
                    })
                })
                
                if (shippingResponse.ok) {
                    break // Successfully applied shipping method
                }
            }
        }
        
        // Force a final calculation regardless of shipping method success
        const finalBasket = await calculateBasketTotals(basketId, authToken, site)
        
        // If still no orderTotal, use productTotal + tax as fallback
        if (finalBasket.orderTotal === null || finalBasket.orderTotal === undefined) {
            const fallbackTotal = (finalBasket.productTotal || 0) + (finalBasket.merchandizeTotalTax || 0)
            
            // Set the calculated total
            finalBasket.orderTotal = fallbackTotal
            finalBasket.calculatedByFallback = true
        }
        
        return finalBasket
    } catch (error) {
        throw error
    }
} 