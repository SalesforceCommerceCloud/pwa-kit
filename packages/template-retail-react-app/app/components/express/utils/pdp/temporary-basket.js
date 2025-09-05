/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {fetchWithTokenRefresh} from '@salesforce/retail-react-app/app/components/express/utils/token-refresh'

/**
 * Creates a temporary basket for Apple Pay "Buy Now" functionality using the official Salesforce Commerce API
 * @param {string} sku - The product SKU to add to the temporary basket
 * @param {string} authToken - Authentication token
 * @param {string} refreshToken - Refresh token for token renewal
 * @param {object} site - Site configuration object
 * @param {number} quantity - Quantity of the product (default: 1)
 * @returns {Promise<object>} - The temporary basket object
 */
export const createTemporaryBasket = async (sku, authToken, refreshToken, site, quantity = 1, updateTokens = null) => {
    if (!sku) {
        throw new Error('SKU is required to create temporary basket')
    }

    if (!authToken) {
        throw new Error('Authentication token is required')
    }

    if (!site?.id) {
        throw new Error('Site ID is required')
    }

    // Get the organizationId from the commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId} = config.parameters

    if (!organizationId) {
        throw new Error('Organization ID is required and not found in configuration')
    }

    const requestBody = {
        productItems: [
            {
                productId: sku,
                quantity: quantity
            }
        ]
    }

    const requestUrl = `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets?siteId=${site.id}&temporary=true`

    const response = await fetchWithTokenRefresh(
        requestUrl,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        },
        authToken,
        updateTokens
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const tempBasket = await response.json()

    if (!tempBasket || !tempBasket.basketId) {
        throw new Error('Invalid temporary basket response')
    }

    return tempBasket
}

/**
 * Deletes a temporary basket when Apple Pay is cancelled or fails
 * @param {string} basketId - The basket ID to delete
 * @param {string} authToken - Authentication token
 * @param {string} refreshToken - Refresh token for token renewal
 * @param {object} site - Site configuration object
 * @returns {Promise<boolean>} - True if deletion was successful, false otherwise
 */
export const deleteTemporaryBasket = async (basketId, authToken, refreshToken, site, updateTokens = null) => {
    if (!basketId) {
        return false
    }

    if (!authToken) {
        return false
    }

    if (!site?.id) {
        return false
    }

    try {
        // Get the organizationId from the commerce API configuration
        const {
            app: {commerceAPI: config}
        } = getConfig()
        const {organizationId} = config.parameters

        if (!organizationId) {
            return false
        }

        const requestUrl = `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}?siteId=${site.id}`

        const response = await fetchWithTokenRefresh(
            requestUrl,
            {
                method: 'DELETE',
                headers: {}
            },
            authToken,
            updateTokens
        )

        // Return true if deletion was successful (200-299 status codes)
        return response.ok
    } catch (error) {
        // Log error but don't throw - basket cleanup shouldn't break the user experience
        console.warn('Failed to delete temporary basket:', error)
        return false
    }
}

/**
 * Utility function to clean up temporary baskets during Apple Pay failures or cancellations
 * This reduces code duplication across the Apple Pay component
 * @param {boolean} isPdpMode - Whether we're in PDP mode
 * @param {object} sharedBasketRef - Reference to the shared basket
 * @param {string} authToken - Authentication token
 * @param {string} refreshToken - Refresh token for token renewal
 * @param {object} site - Site configuration
 * @param {function} setTempBasket - Function to clear temporary basket state
 * @returns {Promise<void>}
 */
export const cleanupTemporaryBasket = async (
    isPdpMode,
    sharedBasketRef,
    authToken,
    refreshToken,
    site,
    setTempBasket,
    updateTokens = null
) => {
    if (isPdpMode && sharedBasketRef?.basketId) {
        try {
            await deleteTemporaryBasket(sharedBasketRef.basketId, authToken, refreshToken, site, updateTokens)
            if (setTempBasket) {
                setTempBasket(null)
            }
            // Clear the shared reference
            sharedBasketRef = null
        } catch (cleanupError) {
            console.warn('Failed to cleanup temporary basket:', cleanupError)
        }
    }
}

/**
 * Wrapper function that returns a cleanup function bound to the current context
 * This makes it easier to use in error handlers and onError callbacks
 * @param {boolean} isPdpMode - Whether we're in PDP mode
 * @param {object} sharedBasketRef - Reference to the shared basket
 * @param {string} authToken - Authentication token
 * @param {string} refreshToken - Refresh token for token renewal
 * @param {object} site - Site configuration
 * @param {function} setTempBasket - Function to clear temporary basket state
 * @returns {function} Cleanup function
 */
export const createCleanupFunction = (
    isPdpMode,
    sharedBasketRef,
    authToken,
    refreshToken,
    site,
    setTempBasket,
    updateTokens = null
) => {
    return () => cleanupTemporaryBasket(isPdpMode, sharedBasketRef, authToken, refreshToken, site, setTempBasket, updateTokens)
}
