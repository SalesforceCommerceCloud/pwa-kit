/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Centralized token refresh utility for express payments
 * Handles authentication token refresh when API calls receive 401 errors
 */

/**
 * Refreshes an access token using a refresh token
 * @param {string} refreshToken - The refresh token to use
 * @param {string} siteId - The site ID for the refresh request
 * @returns {Promise<{authToken: string, refreshToken?: string}>} New tokens
 */
export const refreshAccessToken = async (refreshToken, siteId) => {
    if (!refreshToken) {
        throw new Error('No refresh token available')
    }

    try {
        const refreshUrl = `/api/auth/refresh`
        const refreshResponse = await fetch(refreshUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refreshToken: refreshToken,
                siteId: siteId
            })
        })

        if (!refreshResponse.ok) {
            const errorText = await refreshResponse.text()
            throw new Error(`Token refresh failed: ${refreshResponse.status} ${errorText}`)
        }

        const data = await refreshResponse.json()
        return {
            authToken: data.authToken,
            refreshToken: data.refreshToken || refreshToken // Use new refresh token if provided, otherwise keep current
        }
    } catch (error) {
        console.error('Failed to refresh access token:', error)
        throw error
    }
}

/**
 * Makes an authenticated API request with automatic token refresh on 401 errors
 * @param {Function} makeRequest - Function that makes the API request, should accept a token parameter
 * @param {string} authToken - Current auth token
 * @param {string} refreshToken - Refresh token for renewal
 * @param {string} siteId - Site ID for refresh requests
 * @param {string} operationName - Name of the operation for logging (optional)
 * @returns {Promise<Response>} The API response
 */
export const makeAuthenticatedRequest = async (
    makeRequest, 
    authToken, 
    refreshToken, 
    siteId, 
    operationName = 'API call'
) => {
    let response = await makeRequest(authToken)
    
    // Handle 401 unauthorized errors by attempting token refresh
    if (response.status === 401 && refreshToken) {
        try {
            console.log(`🔄 ${operationName} failed with 401, attempting token refresh...`)
            
            const refreshResult = await refreshAccessToken(refreshToken, siteId)
            const newAuthToken = refreshResult.authToken
            
            console.log(`🔄 Token refresh successful, retrying ${operationName}...`)
            response = await makeRequest(newAuthToken)
            
            console.log(`🔄 ${operationName} retry response: ${response.status}`)
        } catch (refreshError) {
            console.error(`🔄 Token refresh failed during ${operationName}:`, refreshError)
            // Return original response if refresh fails
        }
    }
    
    return response
}

/**
 * Higher-order function that wraps a fetch-based API call with token refresh capability
 * @param {string} url - The API endpoint URL
 * @param {Object} requestConfig - The fetch request configuration (without Authorization header)
 * @param {string} authToken - Current auth token
 * @param {string} refreshToken - Refresh token for renewal
 * @param {string} siteId - Site ID for refresh requests
 * @param {string} operationName - Name of the operation for logging (optional)
 * @returns {Promise<Response>} The API response
 */
export const fetchWithTokenRefresh = async (
    url,
    requestConfig,
    authToken,
    refreshToken,
    siteId,
    operationName = 'API call'
) => {
    const makeRequest = async (token) => {
        return await fetch(url, {
            ...requestConfig,
            headers: {
                ...requestConfig.headers,
                Authorization: `Bearer ${token}`
            }
        })
    }

    return await makeAuthenticatedRequest(
        makeRequest,
        authToken,
        refreshToken,
        siteId,
        operationName
    )
}
