/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Creates a temporary basket for Apple Pay "Buy Now" functionality using the official Salesforce Commerce API
 * @param {string} sku - The product SKU to add to the temporary basket
 * @param {string} authToken - Authentication token
 * @param {object} site - Site configuration object
 * @param {number} quantity - Quantity of the product (default: 1)
 * @returns {Promise<object>} - The temporary basket object
 */
export const createTemporaryBasket = async (sku, authToken, site, quantity = 1) => {
    if (!sku) {
        throw new Error('SKU is required to create temporary basket')
    }
    
    if (!authToken) {
        throw new Error('Authentication token is required')
    }
    
    if (!site?.id) {
        throw new Error('Site ID is required')
    }
    
    try {
        // Get the organizationId from the commerce API configuration
        const {app: {commerceAPI: config}} = getConfig()
        const {organizationId} = config.parameters
        
        if (!organizationId) {
            throw new Error('Organization ID is required and not found in configuration')
        }
        
        const response = await fetch(`/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets?siteId=${site.id}&temporary=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                productItems: [
                    {
                        productId: sku,
                        quantity: quantity
                    }
                ]
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }

        const tempBasket = await response.json()
        
        if (!tempBasket || !tempBasket.basketId) {
            throw new Error('Invalid temporary basket response')
        }
        
        return tempBasket
    } catch (error) {
        console.error('Error creating temporary basket:', error)
        throw error
    }
} 