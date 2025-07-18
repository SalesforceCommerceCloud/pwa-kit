/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Custom payment methods controller that doesn't require a basket
 * This is specifically for "Buy Now" flows where we need to show Apple Pay
 * before creating a basket
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({error: 'Method not allowed'})
    }

    try {
        const {siteId, locale} = req.query
        
        if (!siteId) {
            return res.status(400).json({error: 'siteId is required'})
        }

        // Get Adyen configuration from environment variables
        // Environment variables are prefixed with the site ID
        const apiKey = process.env[`${siteId}_ADYEN_API_KEY`]
        const merchantAccount = process.env[`${siteId}_ADYEN_MERCHANT_ACCOUNT`]
        const environment = process.env[`${siteId}_ADYEN_ENVIRONMENT`] || 'test'
        const clientKey = process.env[`${siteId}_ADYEN_CLIENT_KEY`]

        if (!apiKey || !merchantAccount || !clientKey) {
            return res.status(500).json({
                error: 'Missing Adyen configuration',
                details: `Required environment variables: ${siteId}_ADYEN_API_KEY, ${siteId}_ADYEN_MERCHANT_ACCOUNT, ${siteId}_ADYEN_CLIENT_KEY`
            })
        }

        // Construct Adyen API URL
        const adyenBaseUrl = environment === 'live' 
            ? 'https://checkout-live.adyen.com/v70'
            : 'https://checkout-test.adyen.com/v70'

        // Call Adyen payment methods API without basket dependency
        const adyenResponse = await fetch(`${adyenBaseUrl}/paymentMethods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                merchantAccount,
                countryCode: locale?.split('-')[1] || 'US',
                channel: 'Web'
            })
        })

        if (!adyenResponse.ok) {
            const errorBody = await adyenResponse.text()
            console.error('Adyen API error:', errorBody)
            return res.status(adyenResponse.status).json({
                error: 'Failed to fetch payment methods from Adyen'
            })
        }

        const paymentMethods = await adyenResponse.json()

        // Return the payment methods with environment configuration and application info
        res.status(200).json({
            ...paymentMethods,
            environment: {
                ADYEN_ENVIRONMENT: environment,
                ADYEN_CLIENT_KEY: clientKey
            },
            applicationInfo: {
                adyenLibrary: {
                    name: 'adyen-salesforce-pwa',
                    version: '3.0.0'
                }
            }
        })

    } catch (error) {
        console.error('Payment methods API error:', error)
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        })
    }
} 