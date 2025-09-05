/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {sendExpressMessage} from './express-payment-utils'
import {EXPRESS_MESSAGES} from './constants'

/**
 * Centralized token refresh utility for express payments
 * Uses parent application communication for token refresh
 */

/**
 * Requests token refresh from parent application and waits for response
 * @returns {Promise<{authToken: string, refreshToken: string}>} New tokens from parent
 */
const requestTokenRefreshFromParent = () => {
    return new Promise((resolve, reject) => {
        // Set up a timeout to avoid waiting forever
        const timeout = setTimeout(() => {
            window.removeEventListener('message', messageHandler)
            reject(new Error('Token refresh request timed out'))
        }, 5000) // 5 second timeout

        // Set up message handler for the response
        const messageHandler = (event) => {
            if (event.data && event.data.type === 'authDataAvailable') {
                clearTimeout(timeout)
                window.removeEventListener('message', messageHandler)
                
                const authData = event.data.data.authData
                if (authData.authToken) {
                    resolve({
                        authToken: authData.authToken,
                        refreshToken: authData.refreshToken
                    })
                } else {
                    reject(new Error('No auth token received from parent'))
                }
            }
        }

        // Add temporary message listener
        window.addEventListener('message', messageHandler)
        
        // Request token refresh from parent
        sendExpressMessage(EXPRESS_MESSAGES.TOKEN_REFRESH_NEEDED, {})
    })
}

/**
 * Higher-order function that wraps any fetch request with automatic token refresh on 401 errors
 * @param {function} requestFunction - Function that takes a token and returns a fetch promise
 * @param {string} authToken - Current auth token
 * @param {function} onTokenUpdate - Callback to update tokens in parent component
 * @returns {Promise<Response>} The response from the request (possibly after token refresh)
 */
export const makeAuthenticatedRequest = async (requestFunction, authToken, onTokenUpdate) => {
    // First attempt with current token
    let response = await requestFunction(authToken)
    
    // If we get a 401, request token refresh from parent
    if (response.status === 401) {
        try {
            console.log('🔄 Request failed with 401, requesting token refresh from parent...')
            const {authToken: newAuthToken, refreshToken: newRefreshToken} = await requestTokenRefreshFromParent()
            
            // Update tokens in the parent component if callback provided
            if (onTokenUpdate) {
                onTokenUpdate(newAuthToken, newRefreshToken)
            }
            
            // Retry the request with the new token
            console.log('✅ Token refreshed successfully, retrying request...')
            response = await requestFunction(newAuthToken)
            
            if (response.ok) {
                console.log('✅ Retry after token refresh succeeded')
            } else {
                console.log('❌ Retry after token refresh still failed:', response.status)
            }
        } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
            // Return the original 401 response since refresh failed
        }
    }
    
    return response
}

/**
 * Convenience wrapper for fetch calls with automatic token refresh via parent communication
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options (headers, method, body, etc.)
 * @param {string} authToken - Current auth token
 * @param {function} onTokenUpdate - Callback to update tokens in parent component
 * @returns {Promise<Response>} The response from the fetch (possibly after token refresh)
 */
export const fetchWithTokenRefresh = async (url, options, authToken, onTokenUpdate) => {
    const requestFunction = (token) => {
        const requestOptions = {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`
            }
        }
        return fetch(url, requestOptions)
    }
    
    return makeAuthenticatedRequest(requestFunction, authToken, onTokenUpdate)
}