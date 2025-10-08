/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {ShopperLogin} from 'commerce-sdk-isomorphic'

/**
 * Uniform OTP Send Endpoint
 * 
 * This endpoint provides TRUE zero enumeration by always returning HTTP 200
 * regardless of whether the email is registered or not. It acts as a proxy
 * to SLAS authorizePasswordless but normalizes all responses.
 * 
 * Security Features:
 * - Always returns HTTP 200 (never 404)
 * - Identical response message for all cases
 * - No distinguishing information in response
 * - Server-side SLAS integration prevents client-side enumeration
 * 
 * Usage:
 * POST /api/uniform-otp-send
 * Body: { email: string, callbackURI: string }
 * Response: Always 200 with uniform message
 */

/**
 * Sanitize email input
 */
function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
        return ''
    }
    return email.toLowerCase().trim()
}

/**
 * Validate request inputs
 */
function validateInputs(email, callbackURI) {
    if (!email) {
        return 'Email is required'
    }
    
    if (!callbackURI) {
        return 'Callback URI is required'
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return 'Invalid email format'
    }
    
    return null
}

/**
 * Create uniform response for all cases
 */
function createUniformResponse() {
    return {
        success: true,
        message: "If your email is registered with us, you'll receive a verification code shortly."
    }
}

/**
 * Attempt to send OTP via SLAS
 * Returns success/failure but this information is not exposed to client
 */
async function attemptOtpSend(email, callbackURI) {
    try {
        const config = getConfig()
        
        // Initialize SLAS client for server-side operations
        const slasClient = new ShopperLogin({
            proxy: config.app.commerceAPI.proxyPath,
            parameters: {
                clientId: config.app.commerceAPI.parameters.clientId,
                organizationId: config.app.commerceAPI.parameters.organizationId,
                shortCode: config.app.commerceAPI.parameters.shortCode,
                siteId: config.app.commerceAPI.parameters.siteId
            },
            throwOnBadResponse: false
        })

        // Get server-side guest token for SLAS operations
        const guestTokenResponse = await slasClient.getAccessToken({
            body: {
                grant_type: 'client_credentials'
            }
        })

        if (!guestTokenResponse.access_token) {
            // Token acquisition failed - return internal failure
            return { success: false, reason: 'Token acquisition failed' }
        }

        // Attempt passwordless authorization
        const otpResponse = await slasClient.authorizePasswordless({
            body: {
                user_id: email,
                mode: 'callback',
                callback_uri: callbackURI
            },
            headers: {
                Authorization: `Bearer ${guestTokenResponse.access_token}`
            }
        })

        if (otpResponse.status === 200) {
            // Email is registered, OTP sent successfully
            return { success: true, reason: 'OTP sent to registered user' }
        } else {
            // Email is not registered (404) or other error
            return { success: false, reason: `SLAS returned ${otpResponse.status}` }
        }

    } catch (error) {
        // Any error (network, SLAS down, etc.)
        return { success: false, reason: error.message }
    }
}

/**
 * Uniform OTP Send Handler
 * 
 * Always returns HTTP 200 with identical response regardless of:
 * - Whether email is registered or not
 * - Whether OTP was actually sent or not  
 * - Whether SLAS is available or not
 * 
 * This completely prevents user enumeration attacks.
 */
export default async function uniformOtpSend(req, res) {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            // Even for wrong method, return uniform success response
            return res.status(200).json(createUniformResponse())
        }

        const {email, callbackURI} = req.body

        // Input validation
        const validationError = validateInputs(email, callbackURI)
        if (validationError) {
            // Even for validation errors, return uniform success response
            return res.status(200).json(createUniformResponse())
        }

        // Sanitize inputs
        const sanitizedEmail = sanitizeEmail(email)

        // Attempt OTP send (result is not exposed to client)
        const otpResult = await attemptOtpSend(sanitizedEmail, callbackURI)
        
        // Log result server-side for debugging (never expose to client)
        console.log('OTP send attempt:', {
            email: sanitizedEmail,
            success: otpResult.success,
            reason: otpResult.reason,
            timestamp: new Date().toISOString()
        })

        // ALWAYS return uniform success response
        // Client cannot distinguish between registered/unregistered users
        return res.status(200).json(createUniformResponse())

    } catch (error) {
        // Log error server-side for debugging
        console.error('Uniform OTP send error:', {
            message: error.message,
            timestamp: new Date().toISOString()
        })

        // Even on server error, return uniform success response
        // This prevents error-based enumeration
        return res.status(200).json(createUniformResponse())
    }
}
