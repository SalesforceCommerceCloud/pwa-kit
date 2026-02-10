/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Express Payments Proxy - Shipping Methods Endpoint
 *
 * This endpoint proxies shipping method operations to the Commerce Cloud API,
 * extracting the SLAS token from HTTP-only cookies instead of requiring
 * the client to send it in headers.
 *
 * Security: Token is never exposed to client-side JavaScript.
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {extractAccessToken, extractSiteId, createAuthHeaders} from '../utils/auth.js'
import {asyncHandler, handleUpstreamResponse, ErrorTypes, logProxyRequest} from '../utils/error-handler.js'
import {shippingLimiter} from '../utils/rate-limit.js'

/**
 * Gets available shipping methods for a basket.
 *
 * @route GET /api/express/baskets/:basketId/shipping-methods
 */
export const getShippingMethods = asyncHandler(async (req, res) => {
    const {basketId} = req.params
    const siteId = extractSiteId(req)

    if (!basketId) {
        throw ErrorTypes.BAD_REQUEST('Basket ID is required')
    }

    if (!siteId) {
        throw ErrorTypes.BAD_REQUEST('Site ID is required')
    }

    const token = extractAccessToken(req, siteId)
    if (!token) {
        throw ErrorTypes.UNAUTHORIZED('Access token not found in cookies')
    }

    logProxyRequest('/api/express/baskets/:basketId/shipping-methods', 'GET', {basketId, siteId})

    // Get Commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    // Build the Commerce Cloud API URL
    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}/shipments/me/shipping-methods?siteId=${siteId}`

    // Make the upstream API call
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: createAuthHeaders(token)
    })

    await handleUpstreamResponse(response, 'Get shipping methods')

    const result = await response.json()

    res.json(result)
})

/**
 * Updates the shipping method for a basket.
 *
 * @route PUT /api/express/baskets/:basketId/shipping-methods
 */
export const updateShippingMethod = asyncHandler(async (req, res) => {
    const {basketId} = req.params
    const siteId = extractSiteId(req)

    if (!basketId) {
        throw ErrorTypes.BAD_REQUEST('Basket ID is required')
    }

    if (!siteId) {
        throw ErrorTypes.BAD_REQUEST('Site ID is required')
    }

    const token = extractAccessToken(req, siteId)
    if (!token) {
        throw ErrorTypes.UNAUTHORIZED('Access token not found in cookies')
    }

    const {shippingMethodId} = req.body
    if (!shippingMethodId) {
        throw ErrorTypes.BAD_REQUEST('Shipping method ID is required')
    }

    logProxyRequest('/api/express/baskets/:basketId/shipping-methods', 'PUT', {basketId, siteId, shippingMethodId})

    // Get Commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    // Build the Commerce Cloud API URL for updating the shipment
    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}/shipments/me?siteId=${siteId}`

    // Make the upstream API call
    const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: createAuthHeaders(token),
        body: JSON.stringify({
            shippingMethod: {
                id: shippingMethodId
            }
        })
    })

    await handleUpstreamResponse(response, 'Update shipping method')

    // Get the updated basket to return full basket data with totals
    const basketUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}?siteId=${siteId}`

    const basketResponse = await fetch(basketUrl, {
        method: 'GET',
        headers: createAuthHeaders(token)
    })

    await handleUpstreamResponse(basketResponse, 'Get updated basket')

    const result = await basketResponse.json()

    res.json(result)
})

/**
 * Registers the shipping methods routes on the Express app.
 *
 * @param {Object} app - Express app instance
 */
export const registerShippingMethodsRoutes = (app) => {
    app.get('/api/express/baskets/:basketId/shipping-methods', shippingLimiter, getShippingMethods)
    app.put('/api/express/baskets/:basketId/shipping-methods', shippingLimiter, updateShippingMethod)
}
