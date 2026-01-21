/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * MIAW (Messaging for In-App and Web) Proxy - Customer Data Endpoint
 *
 * This endpoint provides customer data to the MIAW integration without
 * exposing the SLAS token to client-side JavaScript.
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {extractAccessToken, extractSiteId, createAuthHeaders} from '@salesforce/retail-react-app/app/api/utils/auth.js'
import {asyncHandler, handleUpstreamResponse, ErrorTypes, logProxyRequest} from '@salesforce/retail-react-app/app/api/utils/error-handler.js'

/**
 * Gets customer data for MIAW integration.
 *
 * @route POST /api/miaw/customer-data
 */
export const getCustomerData = asyncHandler(async (req, res) => {
    const siteId = extractSiteId(req)

    if (!siteId) {
        throw ErrorTypes.BAD_REQUEST('Site ID is required')
    }

    const token = extractAccessToken(req, siteId)
    if (!token) {
        return res.json({
            isGuest: true,
            customerId: null
        })
    }

    logProxyRequest('/api/miaw/customer-data', 'POST', {siteId})

    const {
        app: {commerceAPI: config}
    } = getConfig()
    const {organizationId, shortCode} = config.parameters

    const apiUrl = `https://${shortCode}.api.commercecloud.salesforce.com/customer/shopper-customers/v1/organizations/${organizationId}/customers/-?siteId=${siteId}`

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: createAuthHeaders(token)
        })

        await handleUpstreamResponse(response, 'Get customer data')

        const customerData = await response.json()

        res.json({
            isGuest: customerData.authType === 'guest',
            customerId: customerData.customerId,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: customerData.email
        })
    } catch (error) {
        console.warn('Failed to get customer data for MIAW:', error.message)
        res.json({
            isGuest: true,
            customerId: null
        })
    }
})

/**
 * Registers the MIAW routes on the Express app.
 *
 * @param {Object} app - Express app instance
 */
export const registerMiawRoutes = (app) => {
    app.post('/api/miaw/customer-data', getCustomerData)
}
