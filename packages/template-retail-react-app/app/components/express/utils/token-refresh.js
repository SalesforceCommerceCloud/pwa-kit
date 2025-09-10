/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Centralized token refresh utility for express payments
 * Uses direct SLAS API calls for reliable token refresh
 */

/**
 * Directly refresh tokens using SLAS API
 * @param {string} refreshToken - The refresh token to use for getting new tokens
 * @param {object} site - Site configuration object with id and other properties
 * @returns {Promise<{authToken: string, refreshToken: string}>} New tokens from SLAS
 */
const refreshTokensDirectly = async (refreshToken, site) => {
    console.log('🔄 Starting direct SLAS token refresh...')
    console.log('🔍 Refresh token info:', {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length || 0,
        refreshTokenStart: refreshToken?.substring(0, 10) + '...',
        siteId: site?.id
    })

    if (!refreshToken) {
        throw new Error('No refresh token available for token refresh')
    }

    if (!site?.id) {
        throw new Error('No site configuration available for token refresh')
    }

    try {
        const config = getConfig()
        const shortCode = config.app.commerceAPI.parameters.shortCode
        const organizationId = config.app.commerceAPI.parameters.organizationId
        const slasUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${organizationId}/oauth2/token`

        const requestBody = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: config.app.commerceAPI.parameters.clientId
        })

        console.log('📤 Making SLAS token refresh request to:', slasUrl)

        const response = await fetch(slasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            },
            body: requestBody
        })

        console.log('📊 SLAS response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ SLAS token refresh failed:', {
                status: response.status,
                statusText: response.statusText,
                errorText
            })
            throw new Error(`SLAS token refresh failed: ${response.status} ${response.statusText}`)
        }

        const tokenData = await response.json()
        console.log('✅ SLAS token refresh successful:', {
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            accessTokenLength: tokenData.access_token?.length || 0,
            refreshTokenLength: tokenData.refresh_token?.length || 0,
            expiresIn: tokenData.expires_in
        })

        return {
            authToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token
        }
    } catch (error) {
        console.error('❌ Direct token refresh failed:', error)
        throw error
    }
}

/**
 * Higher-order function that wraps any fetch request with automatic token refresh on 401 errors
 * @param {function} requestFunction - Function that takes a token and returns a fetch promise
 * @param {string} authToken - Current auth token
 * @param {function} onTokenUpdate - Callback to update tokens in parent component
 * @param {string} refreshToken - Current refresh token for direct SLAS calls
 * @param {object} site - Site configuration for direct SLAS calls
 * @returns {Promise<Response>} The response from the request (possibly after token refresh)
 */
export const makeAuthenticatedRequest = async (
    requestFunction,
    authToken,
    onTokenUpdate,
    refreshToken = null,
    site = null
) => {
    console.log('🚀 Making authenticated request with token:', {
        hasToken: !!authToken,
        tokenLength: authToken?.length || 0,
        tokenStart: authToken?.substring(0, 10) + '...',
        hasUpdateCallback: !!onTokenUpdate
    })

    // First attempt with current token
    let response = await requestFunction(authToken)

    console.log('📊 Initial request response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
    })

    // If we get a 401, try token refresh
    if (response.status === 401) {
        try {
            console.log('🔄 Request failed with 401, attempting direct SLAS token refresh...')
            console.log('🔍 Token refresh context:', {
                hasRefreshToken: !!refreshToken,
                hasSite: !!site,
                refreshTokenLength: refreshToken?.length || 0,
                siteId: site?.id || 'N/A'
            })

            // Ensure we have the necessary data for SLAS refresh
            if (!refreshToken || !site) {
                throw new Error('Missing refresh token or site configuration for token refresh')
            }

            // Perform direct SLAS token refresh
            console.log('🎯 Performing direct SLAS token refresh...')
            const {authToken: newAuthToken, refreshToken: newRefreshToken} =
                await refreshTokensDirectly(refreshToken, site)
            console.log('✅ Direct SLAS token refresh succeeded')

            console.log('✅ New tokens received:', {
                hasNewAuthToken: !!newAuthToken,
                hasNewRefreshToken: !!newRefreshToken,
                newTokenLength: newAuthToken?.length || 0,
                newTokenStart: newAuthToken?.substring(0, 10) + '...'
            })

            // Update tokens in the parent component if callback provided
            if (onTokenUpdate) {
                console.log('🔄 Updating tokens in parent component...')
                onTokenUpdate(newAuthToken, newRefreshToken)
                console.log('✅ Tokens updated in parent component')
            } else {
                console.warn('⚠️ No token update callback provided')
            }

            // Retry the request with the new token
            console.log('🔄 Retrying request with new token...')
            response = await requestFunction(newAuthToken)

            console.log('📊 Retry request response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url
            })

            if (response.ok) {
                console.log('✅ Retry after token refresh succeeded')
            } else {
                console.error('❌ Retry after token refresh still failed:', response.status)
            }
        } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
            console.log('🔍 Refresh error details:', {
                errorName: refreshError.name,
                errorMessage: refreshError.message,
                errorStack: refreshError.stack
            })
            // Return the original 401 response since refresh failed
        }
    }

    return response
}

/**
 * Convenience wrapper for fetch calls with automatic token refresh (direct SLAS or parent communication)
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options (headers, method, body, etc.)
 * @param {string} authToken - Current auth token
 * @param {function} onTokenUpdate - Callback to update tokens in parent component
 * @param {string} refreshToken - Current refresh token for direct SLAS calls
 * @param {object} site - Site configuration for direct SLAS calls
 * @returns {Promise<Response>} The response from the fetch (possibly after token refresh)
 */
export const fetchWithTokenRefresh = async (
    url,
    options,
    authToken,
    onTokenUpdate,
    refreshToken = null,
    site = null
) => {
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

    return makeAuthenticatedRequest(requestFunction, authToken, onTokenUpdate, refreshToken, site)
}
