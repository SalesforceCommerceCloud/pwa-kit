/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Express Payments Proxy - Baskets Endpoint
 *
 * This endpoint proxies basket operations to the Commerce Cloud API,
 * extracting the SLAS token from HTTP-only cookies instead of requiring
 * the client to send it in headers.
 *
 * Supports:
 * - Creating temporary baskets (for Buy Now flows)
 * - Getting basket details
 * - Deleting baskets
 * - Forcing order calculation
 *
 * Security: Token is never exposed to client-side JavaScript.
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {extractAccessToken, extractSiteId, createAuthHeaders} from '../utils/auth.js'
import {asyncHandler, handleUpstreamResponse, ErrorTypes, logProxyRequest} from '../utils/error-handler.js'

/**
 * Creates a temporary basket for Express Payments (Buy Now) flows.
 *
 * @route POST /api/express/baskets/temporary
 */
export const createTemporaryBasket = asyncHandler(async (req, res) => {
    const siteId = extractSiteId(req)

    if (!siteId) {
        throw ErrorTypes.BAD_REQUEST('Site ID is required')
    }

    const token = extractAccessToken(req, siteId)
    if (!token) {
        throw ErrorTypes.UNAUTHORIZED('Access token not found in cookies')
    }

    const {productItems, currency} = req.body
    if (!productItems || !Array.isArray(productItems) || productItems.length === 0) {
        throw ErrorTypes.BAD_REQUEST('Product items are required')
    }

    logProxyRequest('/api/express/baskets/temporary', 'POST', {siteId, itemCount: productItems.length})

    // Get Commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    // Build the Commerce Cloud API URL for creating a temporary basket
    // Note: Using v2 of the API as v1 doesn't support temporary baskets properly
    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets?siteId=${siteId}&temporary=true`

    // Prepare the basket payload
    const basketPayload = {
        productItems: productItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity || 1
        }))
    }

    // Add currency if provided
    if (currency) {
        basketPayload.currency = currency
    }

    // Make the upstream API call
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(basketPayload)
    })

    await handleUpstreamResponse(response, 'Create temporary basket')

    const result = await response.json()

    res.json(result)
})

/**
 * Gets basket details.
 *
 * @route GET /api/express/baskets/:basketId
 */
export const getBasket = asyncHandler(async (req, res) => {
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

    logProxyRequest('/api/express/baskets/:basketId', 'GET', {basketId, siteId})

    // Get Commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    // Build the Commerce Cloud API URL
    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}?siteId=${siteId}`

    // Make the upstream API call
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: createAuthHeaders(token)
    })

    await handleUpstreamResponse(response, 'Get basket')

    const result = await response.json()

    res.json(result)
})

/**
 * Deletes a basket.
 *
 * @route DELETE /api/express/baskets/:basketId
 */
export const deleteBasket = asyncHandler(async (req, res) => {
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

    logProxyRequest('/api/express/baskets/:basketId', 'DELETE', {basketId, siteId})

    // Get Commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    // Build the Commerce Cloud API URL
    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}?siteId=${siteId}`

    // Make the upstream API call
    const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: createAuthHeaders(token)
    })

    // DELETE returns 204 No Content on success
    if (response.status === 204) {
        return res.status(204).send()
    }

    await handleUpstreamResponse(response, 'Delete basket')

    res.status(204).send()
})

/**
 * Forces order calculation on a basket (triggers recalculation of totals).
 *
 * @route POST /api/express/baskets/:basketId/calculate
 */
export const calculateBasket = asyncHandler(async (req, res) => {
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

    logProxyRequest('/api/express/baskets/:basketId/calculate', 'POST', {basketId, siteId})

    // Get Commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    // Build the Commerce Cloud API URL - PATCH with empty body triggers recalculation
    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}?siteId=${siteId}`

    // Make the upstream API call
    const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: createAuthHeaders(token),
        body: JSON.stringify({})
    })

    await handleUpstreamResponse(response, 'Calculate basket')

    const result = await response.json()

    res.json(result)
})

/**
 * Registers the baskets routes on the Express app.
 *
 * @param {Object} app - Express app instance
 */
export const registerBasketsRoutes = (app) => {
    app.post('/api/express/baskets/temporary', createTemporaryBasket)
    app.get('/api/express/baskets/:basketId', getBasket)
    app.delete('/api/express/baskets/:basketId', deleteBasket)
    app.post('/api/express/baskets/:basketId/calculate', calculateBasket)
}
