/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Express Payments Proxy - Shipping Address Endpoint
 *
 * This endpoint proxies shipping address updates to the Commerce Cloud API,
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
 * Updates the shipping address for a basket.
 *
 * @route PUT /api/express/baskets/:basketId/shipping-address
 */
export const updateShippingAddress = asyncHandler(async (req, res) => {
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

    const {data} = req.body
    if (!data) {
        throw ErrorTypes.BAD_REQUEST('Shipping address data is required')
    }

    logProxyRequest('/api/express/baskets/:basketId/shipping-address', 'PUT', {basketId, siteId})

    // Get Commerce API configuration
    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    // Build the Commerce Cloud API URL
    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}/shipments/me/shipping-address?siteId=${siteId}`

    // Extract address and profile from data
    const {deliveryAddress, profile} = data

    // Prepare the shipping address payload
    const shippingAddressPayload = {
        address1: deliveryAddress.street,
        address2: deliveryAddress.houseNumberOrName || '',
        city: deliveryAddress.city,
        countryCode: deliveryAddress.country,
        postalCode: deliveryAddress.postalCode,
        stateCode: deliveryAddress.stateOrProvince,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone
    }

    // Make the upstream API call
    const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify(shippingAddressPayload)
    })

    await handleUpstreamResponse(response, 'Update shipping address')

    const result = await response.json()

    // Also update customer info if email is provided
    if (profile.email) {
        const customerUrl = `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}/customer?siteId=${siteId}`

        const customerResponse = await fetch(customerUrl, {
            method: 'PUT',
            headers: createAuthHeaders(token),
            body: JSON.stringify({email: profile.email})
        })

        // Don't fail if customer update fails, just log it
        if (!customerResponse.ok) {
            console.warn('Failed to update customer email on basket')
        }
    }

    res.json(result)
})

/**
 * Registers the shipping address routes on the Express app.
 *
 * @param {Object} app - Express app instance
 */
export const registerShippingAddressRoutes = (app) => {
    app.put('/api/express/baskets/:basketId/shipping-address', shippingLimiter, updateShippingAddress)
}
