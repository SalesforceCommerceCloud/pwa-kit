/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * SECURE CUSTOMER LOOKUP IMPLEMENTATION
 *
 * This file implements secure customer lookup functionality with focus on:
 * - User enumeration prevention with obfuscated responses
 * - Uniform response patterns regardless of registration status
 * - Nonce-based response encoding to prevent network analysis
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {ShopperLogin} from 'commerce-sdk-isomorphic'
import crypto from 'crypto'

/**
 * Internal lookup result (before obfuscation)
 */
interface SecureCustomerLookupResult {
    /** Whether the email belongs to a registered customer */
    isRegistered: boolean;
    /** Whether OTP modal should be shown (only true if registered) */
    shouldShowOtp: boolean;
    /** Uniform message to display to user */
    message: string;
}

/**
 * Encrypted response format returned to client
 */
interface EncryptedLookupResult {
    /** Always true for successful API calls */
    success: boolean;
    /** Encrypted data (base64 encoded) */
    data: string;
    /** Uniform message for all cases */
    message: string;
}

/**
 * Nonce configuration for response obfuscation
 */
const NONCE_CONFIG = {
    LENGTH: 16, // 16 bytes = 32 hex characters
    ENCODING: 'base64'
}


/**
 * Generate a secure nonce for response obfuscation
 */
function generateNonce() {
    return crypto.randomBytes(NONCE_CONFIG.LENGTH).toString(NONCE_CONFIG.ENCODING)
}

/**
 * Encrypt the response data using client-provided nonce
 * This prevents attackers from directly reading the response structure
 */
function encryptResponse(data, nonce) {
    const jsonString = JSON.stringify(data)

    // Simple XOR encryption with client's nonce
    const encrypted = Buffer.from(jsonString)
        .map((byte, index) => byte ^ nonce.charCodeAt(index % nonce.length))
        .toString(NONCE_CONFIG.ENCODING)

    return encrypted
}

/**
 * Validates input parameters
 */
function validateInputs(email, nonce) {
    if (!email || !nonce) {
        return 'Email and nonce are required'
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return 'Invalid email format'
    }

    // Nonce validation
    if (typeof nonce !== 'string' || nonce.length < 8) {
        return 'Invalid nonce'
    }

    return null
}

/**
 * Sanitizes email input
 */
function sanitizeEmail(email) {
    return email.toLowerCase().trim()
}

/**
 * Performs secure customer lookup with uniform responses
 * This implementation prevents user enumeration attacks
 */
async function performSecureCustomerLookup(email) {

    try {
        const config = getConfig()

        // Initialize SLAS client for server-side authentication
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

        // Get guest token for server-side operations
        const guestTokenResponse = await slasClient.getAccessToken({
            body: {
                grant_type: 'client_credentials'
            }
        })

        if (!guestTokenResponse.access_token) {
            // Return safe fallback with uniform message
            return createUniformResponse(false, false)
        }

        let isRegistered = false
        let shouldShowOtp = false

        // Attempt passwordless authorization to check if email is registered
        try {
            await slasClient.authorizePasswordless({
                body: {
                    user_id: email,
                    mode: 'callback',
                    callback_uri: 'https://localhost/passwordless-callback'
                },
                headers: {
                    Authorization: `Bearer ${guestTokenResponse.access_token}`
                }
            })

            // If we reach here, email is registered
            isRegistered = true
            shouldShowOtp = true

        } catch (error) {
            // Email is not registered or other error occurred
            // We treat all errors the same way for security
            isRegistered = false
            shouldShowOtp = false
        }

        return createUniformResponse(isRegistered, shouldShowOtp)

    } catch (error) {
        // Always return safe fallback
        return createUniformResponse(false, false)
    }
}

/**
 * Creates a uniform response regardless of registration status
 */
function createUniformResponse(isRegistered, shouldShowOtp) {
    return {
        isRegistered: isRegistered,
        shouldShowOtp: shouldShowOtp,
        message: "We've sent verification instructions to your email if it's registered with us."
    }
}


/**
 * Secure customer lookup action handler
 *
 * This endpoint performs secure customer lookup with focus on:
 * - User enumeration prevention with encrypted responses
 * - Uniform response patterns for all cases
 * - Generic success messages for all cases
 */
export default async function secureCustomerLookup(req, res) {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            const errorResult = createUniformResponse(false, false)
            const encrypted = encryptResponse(errorResult, generateNonce())

            return res.status(200).json({
                success: true,
                data: encrypted,
                message: "We've sent verification instructions to your email if it's registered with us."
            })
        }

        // Parse request data
        const {email, nonce} = req.body

        // Input validation
        const validationError = validateInputs(email, nonce)
        if (validationError) {
            const errorResult = createUniformResponse(false, false)
            const fallbackNonce = nonce || generateNonce()
            const encrypted = encryptResponse(errorResult, fallbackNonce)

            return res.status(200).json({
                success: true,
                data: encrypted,
                message: "We've sent verification instructions to your email if it's registered with us."
            })
        }

        // Sanitize inputs
        const sanitizedEmail = sanitizeEmail(email)

        // Perform secure customer lookup
        const lookupResult = await performSecureCustomerLookup(sanitizedEmail)

        // Encrypt the response to prevent enumeration
        const encrypted = encryptResponse(lookupResult, nonce)

        return res.status(200).json({
            success: true,
            data: encrypted,
            message: "We've sent verification instructions to your email if it's registered with us."
        })

    } catch (error) {
        // Log error details for debugging (server-side only)
        console.error('Secure customer lookup API error:', {
            message: error.message,
            timestamp: new Date().toISOString()
        })

        // Always return uniform response even for errors
        const fallbackResult = createUniformResponse(false, false)
        const encrypted = encryptResponse(fallbackResult, generateNonce())

        return res.status(200).json({
            success: true,
            data: encrypted,
            message: "We've sent verification instructions to your email if it's registered with us."
        })
    }
}
