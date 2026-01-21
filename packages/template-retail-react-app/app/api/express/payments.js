/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Express Payments Proxy - Payments Endpoint
 *
 * This endpoint proxies payment submissions to the Adyen/Commerce Cloud API,
 * extracting the SLAS token from HTTP-only cookies instead of requiring
 * the client to send it in headers.
 *
 * Note: This proxies to the existing /api/adyen/payments endpoint,
 * adding the token from cookies before forwarding.
 *
 * Security: Token is never exposed to client-side JavaScript.
 */

import {extractAccessToken, extractSiteId, createAuthHeaders} from '../utils/auth.js'
import {asyncHandler, handleUpstreamResponse, ErrorTypes, logProxyRequest} from '../utils/error-handler.js'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'

/**
 * Submits a payment through the Adyen integration.
 *
 * @route POST /api/express/payments
 */
export const submitPayment = asyncHandler(async (req, res) => {
    const siteId = extractSiteId(req)

    if (!siteId) {
        throw ErrorTypes.BAD_REQUEST('Site ID is required')
    }

    const token = extractAccessToken(req, siteId)
    if (!token) {
        throw ErrorTypes.UNAUTHORIZED('Access token not found in cookies')
    }

    const {data, basketId, customerId} = req.body
    if (!data) {
        throw ErrorTypes.BAD_REQUEST('Payment data is required')
    }

    if (!basketId) {
        throw ErrorTypes.BAD_REQUEST('Basket ID is required')
    }

    logProxyRequest('/api/express/payments', 'POST', {siteId, basketId})

    // Get the app origin for the internal API call
    const appOrigin = getAppOrigin()

    // Forward the request to the existing Adyen payments endpoint
    // This endpoint is registered by @adyen/adyen-salesforce-pwa
    const adyenUrl = `${appOrigin}/api/adyen/payments?siteId=${siteId}`

    // Make the upstream API call to the internal Adyen endpoint
    const response = await fetch(adyenUrl, {
        method: 'POST',
        headers: {
            ...createAuthHeaders(token),
            basketid: basketId,
            ...(customerId && {customerid: customerId})
        },
        body: JSON.stringify({data})
    })

    await handleUpstreamResponse(response, 'Submit payment')

    const result = await response.json()

    res.json(result)
})

/**
 * Registers the payments routes on the Express app.
 *
 * @param {Object} app - Express app instance
 */
export const registerPaymentsRoutes = (app) => {
    app.post('/api/express/payments', submitPayment)
}
