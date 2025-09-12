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

// Track ongoing refresh operations to prevent multiple simultaneous refreshes
const ongoingRefreshes = new Map()

/**
 * Directly refresh tokens using SLAS API
 * @param {string} refreshToken - The refresh token to use for getting new tokens
 * @param {object} site - Site configuration object with id and other properties
 * @returns {Promise<{authToken: string, refreshToken: string}>} New tokens from SLAS
 */
const refreshTokensDirectly = async (refreshToken, site) => {
    const refreshKey = `${refreshToken?.substring(0, 10)}-${site?.id}`

    console.log('🔄 Starting direct SLAS token refresh...')

    // Enhanced token diagnostics
    const tokenAnalysis = {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length || 0,
        refreshTokenStart: refreshToken?.substring(0, 10) + '...',
        refreshTokenEnd: refreshToken?.substring(-10) + '...',
        refreshTokenType: typeof refreshToken,
        refreshTokenIsString: typeof refreshToken === 'string',
        refreshTokenTrimmed: refreshToken?.trim() === refreshToken,
        refreshTokenHasWhitespace: refreshToken ? /\s/.test(refreshToken) : false,
        refreshTokenHasSpecialChars: refreshToken
            ? /[^A-Za-z0-9_-]/.test(refreshToken.replace(/[.\-_]/g, ''))
            : false,
        refreshTokenBase64Like: refreshToken ? /^[A-Za-z0-9+/=_-]+$/.test(refreshToken) : false,
        siteId: site?.id,
        refreshKey,
        timestamp: new Date().toISOString(),
        timestampMs: Date.now()
    }

    console.log('🔍 Enhanced refresh token analysis:', tokenAnalysis)

    // Check for common token issues
    if (refreshToken) {
        const potentialIssues = []

        if (refreshToken.length < 10) potentialIssues.push('TOKEN_TOO_SHORT')
        if (refreshToken.length > 2000) potentialIssues.push('TOKEN_TOO_LONG')
        if (refreshToken !== refreshToken.trim()) potentialIssues.push('HAS_WHITESPACE')
        if (/\s/.test(refreshToken)) potentialIssues.push('CONTAINS_SPACES')
        if (refreshToken.includes('\n') || refreshToken.includes('\r'))
            potentialIssues.push('CONTAINS_NEWLINES')
        if (refreshToken.startsWith('"') || refreshToken.endsWith('"'))
            potentialIssues.push('QUOTED_TOKEN')
        if (refreshToken.includes('undefined') || refreshToken.includes('null'))
            potentialIssues.push('CONTAINS_UNDEFINED_NULL')

        if (potentialIssues.length > 0) {
            console.warn('⚠️ Potential refresh token issues detected:', {
                refreshKey,
                issues: potentialIssues,
                tokenSample: refreshToken?.substring(0, 20) + '...' + refreshToken?.substring(-10),
                tokenBytes: new TextEncoder().encode(refreshToken).length
            })
        }

        // Try to decode if it looks like JWT
        if (refreshToken.includes('.')) {
            try {
                const parts = refreshToken.split('.')
                console.log('🔍 JWT-like token analysis:', {
                    refreshKey,
                    parts: parts.length,
                    headerLength: parts[0]?.length || 0,
                    payloadLength: parts[1]?.length || 0,
                    signatureLength: parts[2]?.length || 0,
                    isJWTStructure: parts.length === 3
                })

                // Try to decode the payload (if it's a JWT)
                if (parts.length >= 2 && parts[1]) {
                    try {
                        const payload = JSON.parse(
                            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
                        )
                        const now = Math.floor(Date.now() / 1000)

                        console.log('🔍 Token payload analysis:', {
                            refreshKey,
                            hasExp: 'exp' in payload,
                            hasIat: 'iat' in payload,
                            exp: payload.exp,
                            iat: payload.iat,
                            currentTime: now,
                            isExpired: payload.exp ? payload.exp < now : 'UNKNOWN',
                            expiresIn: payload.exp ? payload.exp - now : 'UNKNOWN',
                            ageInSeconds: payload.iat ? now - payload.iat : 'UNKNOWN',
                            tokenAgeHours: payload.iat
                                ? ((now - payload.iat) / 3600).toFixed(2)
                                : 'UNKNOWN',
                            tokenAgeMinutes: payload.iat
                                ? ((now - payload.iat) / 60).toFixed(2)
                                : 'UNKNOWN'
                        })

                        if (payload.exp && payload.exp < now) {
                            console.error('❌ REFRESH TOKEN IS EXPIRED!', {
                                refreshKey,
                                expiredSince: now - payload.exp,
                                expiredSinceMinutes: ((now - payload.exp) / 60).toFixed(2),
                                expiredSinceHours: ((now - payload.exp) / 3600).toFixed(2)
                            })
                        }
                    } catch (decodeError) {
                        console.log('🔍 Could not decode token payload (not JWT or malformed):', {
                            refreshKey,
                            decodeError: decodeError.message
                        })
                    }
                }
            } catch (jwtError) {
                console.log('🔍 Token does not appear to be JWT format:', {
                    refreshKey,
                    jwtError: jwtError.message
                })
            }
        }
    }

    // Check if this refresh token is already being used
    if (ongoingRefreshes.has(refreshKey)) {
        const existingRefreshInfo = ongoingRefreshes.get(refreshKey)
        const timeSinceExisting = Date.now() - new Date(existingRefreshInfo).getTime()

        console.error('⚠️ DUPLICATE REFRESH DETECTED: This refresh token is already being used!', {
            refreshKey,
            ongoingRefreshCount: ongoingRefreshes.size,
            existingRefreshStartTime: existingRefreshInfo,
            timeSinceExisting: `${timeSinceExisting}ms`,
            allOngoingRefreshes: Array.from(ongoingRefreshes.entries()).map(([key, startTime]) => ({
                key,
                startTime,
                age: `${Date.now() - new Date(startTime).getTime()}ms`
            })),
            stackTrace: new Error().stack?.split('\n').slice(1, 6).join(' <- ')
        })

        // If the existing refresh has been going for more than 30 seconds, allow this one
        if (timeSinceExisting > 30000) {
            console.warn('🔄 Allowing duplicate refresh due to timeout of existing refresh')
            ongoingRefreshes.delete(refreshKey)
        } else {
            // Wait for the ongoing refresh instead of creating a duplicate
            throw new Error(`Refresh token already in use: ${refreshKey}`)
        }
    }

    // Mark this refresh as ongoing with additional context
    const refreshStartInfo = {
        startTime: new Date().toISOString(),
        stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' <- ')
    }
    ongoingRefreshes.set(refreshKey, refreshStartInfo.startTime)

    console.log('🔒 Marked refresh token as in-use:', {
        refreshKey,
        totalOngoingRefreshes: ongoingRefreshes.size,
        startTime: refreshStartInfo.startTime,
        initiatedFrom: refreshStartInfo.stackTrace
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

        // Enhanced request diagnostics
        console.log('📤 Making SLAS token refresh request with enhanced diagnostics:', {
            url: slasUrl,
            method: 'POST',
            grantType: 'refresh_token',
            clientId: config.app.commerceAPI.parameters.clientId,
            clientIdLength: config.app.commerceAPI.parameters.clientId?.length || 0,
            shortCode: shortCode,
            organizationId: organizationId,
            refreshTokenUsed: refreshToken?.substring(0, 10) + '...',
            refreshTokenLength: refreshToken?.length || 0,
            requestBodyString: requestBody.toString(),
            requestBodySize: new TextEncoder().encode(requestBody.toString()).length,
            refreshKey,
            timestamp: new Date().toISOString(),
            userAgent: navigator?.userAgent || 'N/A',
            origin: window?.location?.origin || 'N/A'
        })

        // Log the exact request body for debugging (be careful with sensitive data)
        console.log('🔍 Request body analysis:', {
            refreshKey,
            bodyKeys: Array.from(requestBody.keys()),
            grantTypeValue: requestBody.get('grant_type'),
            clientIdValue: requestBody.get('client_id')?.substring(0, 10) + '...',
            refreshTokenInBody: requestBody.get('refresh_token')?.substring(0, 10) + '...',
            refreshTokenMatches: requestBody.get('refresh_token') === refreshToken
        })
        const requestStartTime = performance.now()

        const response = await fetch(slasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            },
            body: requestBody
        })

        const requestDuration = performance.now() - requestStartTime

        console.log('📊 SLAS response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            duration: `${requestDuration.toFixed(2)}ms`,
            refreshKey
        })

        if (!response.ok) {
            const errorText = await response.text()

            // Enhanced error analysis
            let parsedError = null
            try {
                parsedError = JSON.parse(errorText)
            } catch (e) {
                // Error text is not JSON
            }

            console.error('❌ SLAS token refresh failed with enhanced diagnostics:', {
                status: response.status,
                statusText: response.statusText,
                errorText,
                parsedError,
                refreshKey,
                refreshTokenUsed: refreshToken?.substring(0, 10) + '...',
                refreshTokenEnd: refreshToken?.substring(-10) + '...',
                refreshTokenLength: refreshToken?.length || 0,
                duration: `${requestDuration.toFixed(2)}ms`,
                responseHeaders: Object.fromEntries(response.headers.entries()),
                requestUrl: response.url,
                requestTimestamp: new Date().toISOString(),
                clientIdUsed: config.app.commerceAPI.parameters.clientId?.substring(0, 10) + '...',
                organizationIdUsed: organizationId,
                shortCodeUsed: shortCode
            })

            // Specific analysis for 400 errors
            if (response.status === 400) {
                console.error('🔍 400 Bad Request Analysis:', {
                    refreshKey,
                    possibleCauses: [
                        'Refresh token has expired',
                        'Refresh token format is invalid',
                        'Client ID mismatch',
                        'Organization ID mismatch',
                        'Token was revoked',
                        'Token encoding issues'
                    ],
                    errorMessage: parsedError?.message || 'No specific error message',
                    errorCode: parsedError?.status_code || 'No error code',
                    isInvalidRefreshToken: errorText.includes('invalid refresh_token'),
                    errorContainsExpired: errorText.toLowerCase().includes('expired'),
                    errorContainsRevoked: errorText.toLowerCase().includes('revoked'),
                    errorContainsInvalid: errorText.toLowerCase().includes('invalid'),
                    fullErrorForDebugging: errorText
                })

                // Additional checks for token format issues
                if (refreshToken) {
                    console.error('🔍 Token format investigation:', {
                        refreshKey,
                        tokenHasNonPrintable: /[^\x20-\x7E]/.test(refreshToken),
                        tokenStartsWithBearer: refreshToken.toLowerCase().startsWith('bearer'),
                        tokenHasMultipleParts: refreshToken.includes(' '),
                        tokenIsBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(refreshToken),
                        tokenIsUrlSafe: /^[A-Za-z0-9_-]*$/.test(refreshToken),
                        tokenCharCodes: Array.from(refreshToken.substring(0, 20)).map((c) =>
                            c.charCodeAt(0)
                        ),
                        suspiciousChars: Array.from(refreshToken).filter(
                            (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126
                        )
                    })
                }
            }

            // Clean up the ongoing refresh tracking
            ongoingRefreshes.delete(refreshKey)
            console.log('🧹 Cleaned up failed refresh from tracking:', {
                refreshKey,
                remainingOngoingRefreshes: ongoingRefreshes.size
            })

            throw new Error(`SLAS token refresh failed: ${response.status} ${response.statusText}`)
        }

        const tokenData = await response.json()

        // Clean up the ongoing refresh tracking
        ongoingRefreshes.delete(refreshKey)

        console.log('✅ SLAS token refresh successful:', {
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            accessTokenLength: tokenData.access_token?.length || 0,
            refreshTokenLength: tokenData.refresh_token?.length || 0,
            expiresIn: tokenData.expires_in,
            duration: `${requestDuration.toFixed(2)}ms`,
            oldRefreshKey: refreshKey,
            newRefreshTokenStart: tokenData.refresh_token?.substring(0, 10) + '...',
            remainingOngoingRefreshes: ongoingRefreshes.size
        })

        return {
            authToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token
        }
    } catch (error) {
        // Clean up the ongoing refresh tracking on any error
        ongoingRefreshes.delete(refreshKey)
        console.error('❌ Direct token refresh failed:', {
            error: error.message,
            refreshKey,
            remainingOngoingRefreshes: ongoingRefreshes.size
        })
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
    site = null,
    tokenProvider = null
) => {
    const requestId = Math.random().toString(36).substring(2, 8)

    console.log('🚀 Making authenticated request with token:', {
        hasToken: !!authToken,
        tokenLength: authToken?.length || 0,
        tokenStart: authToken?.substring(0, 10) + '...',
        hasUpdateCallback: !!onTokenUpdate,
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length || 0,
        refreshTokenStart: refreshToken?.substring(0, 10) + '...',
        siteId: site?.id,
        requestId,
        timestamp: new Date().toISOString()
    })

    // First attempt with current token
    const requestStartTime = performance.now()
    let response = await requestFunction(authToken)
    const requestDuration = performance.now() - requestStartTime

    console.log('📊 Initial request response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        duration: `${requestDuration.toFixed(2)}ms`,
        requestId
    })

    // If we get a 401, try token refresh
    if (response.status === 401) {
        try {
            console.log('🔄 Request failed with 401, attempting direct SLAS token refresh...')
            console.log('🔍 Token refresh context:', {
                hasRefreshToken: !!refreshToken,
                hasSite: !!site,
                refreshTokenLength: refreshToken?.length || 0,
                refreshTokenStart: refreshToken?.substring(0, 10) + '...',
                refreshTokenEnd: refreshToken?.substring(-10) + '...',
                siteId: site?.id || 'N/A',
                requestId,
                currentAuthTokenStart: authToken?.substring(0, 10) + '...',
                ongoingRefreshCount: ongoingRefreshes.size,
                refreshAttemptNumber: 1
            })

            // Ensure we have the necessary data for SLAS refresh
            if (!refreshToken || !site) {
                console.error('❌ Missing refresh token or site configuration for token refresh:', {
                    hasRefreshToken: !!refreshToken,
                    hasSite: !!site,
                    requestId
                })
                throw new Error('Missing refresh token or site configuration for token refresh')
            }

            // Get the most current refresh token (in case it was updated during this request)
            const currentRefreshToken = tokenProvider?.getCurrentRefreshToken() || refreshToken

            console.log('🎯 Performing direct SLAS token refresh with current token:', {
                originalRefreshToken: refreshToken?.substring(0, 10) + '...',
                currentRefreshToken: currentRefreshToken?.substring(0, 10) + '...',
                tokenUpdated: currentRefreshToken !== refreshToken,
                hasTokenProvider: !!tokenProvider,
                requestId
            })
            const refreshStartTime = performance.now()
            const {authToken: newAuthToken, refreshToken: newRefreshToken} =
                await refreshTokensDirectly(currentRefreshToken, site)
            const refreshDuration = performance.now() - refreshStartTime
            console.log('✅ Direct SLAS token refresh succeeded')

            console.log('✅ New tokens received:', {
                hasNewAuthToken: !!newAuthToken,
                hasNewRefreshToken: !!newRefreshToken,
                newTokenLength: newAuthToken?.length || 0,
                newTokenStart: newAuthToken?.substring(0, 10) + '...',
                newRefreshTokenStart: newRefreshToken?.substring(0, 10) + '...',
                refreshDuration: `${refreshDuration.toFixed(2)}ms`,
                requestId,
                oldAuthTokenStart: authToken?.substring(0, 10) + '...',
                oldRefreshTokenStart: refreshToken?.substring(0, 10) + '...',
                tokenChanged: newAuthToken !== authToken,
                refreshTokenChanged: newRefreshToken !== refreshToken
            })

            // Update tokens in the parent component if callback provided
            if (onTokenUpdate) {
                console.log('🔄 Updating tokens in parent component...')
                const updateStartTime = performance.now()
                onTokenUpdate(newAuthToken, newRefreshToken)
                const updateDuration = performance.now() - updateStartTime
                console.log('✅ Tokens updated in parent component:', {
                    updateDuration: `${updateDuration.toFixed(2)}ms`,
                    requestId
                })

                // CRITICAL FIX: Update our local refresh token variable for any subsequent refresh attempts
                refreshToken = newRefreshToken
                authToken = newAuthToken

                // Also update the TokenProvider if available
                if (tokenProvider) {
                    tokenProvider.updateTokens(newAuthToken, newRefreshToken)
                    console.log('🔄 Updated TokenProvider with new tokens:', {
                        requestId,
                        providerId: tokenProvider.providerId
                    })
                }
                console.log('🔧 Updated local token variables for subsequent refreshes:', {
                    requestId,
                    newRefreshTokenStart: refreshToken?.substring(0, 10) + '...',
                    newAuthTokenStart: authToken?.substring(0, 10) + '...'
                })
            } else {
                console.warn(
                    '⚠️ No token update callback provided - tokens will not be persisted!',
                    {
                        requestId
                    }
                )
            }

            // Retry the request with the new token
            console.log('🔄 Retrying request with new token...')
            const retryStartTime = performance.now()
            response = await requestFunction(newAuthToken)
            const retryDuration = performance.now() - retryStartTime

            console.log('📊 Retry request response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
                retryDuration: `${retryDuration.toFixed(2)}ms`,
                requestId,
                newTokenUsed: newAuthToken?.substring(0, 10) + '...'
            })

            if (response.ok) {
                console.log('✅ Retry after token refresh succeeded')
            } else {
                console.error('❌ Retry after token refresh still failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    requestId,
                    newTokenUsed: newAuthToken?.substring(0, 10) + '...'
                })
            }
        } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
            console.log('🔍 Refresh error details:', {
                errorName: refreshError.name,
                errorMessage: refreshError.message,
                errorStack: refreshError.stack,
                requestId,
                refreshTokenUsed: refreshToken?.substring(0, 10) + '...',
                ongoingRefreshCount: ongoingRefreshes.size
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
    site = null,
    tokenProvider = null
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

    return makeAuthenticatedRequest(
        requestFunction,
        authToken,
        onTokenUpdate,
        refreshToken,
        site,
        tokenProvider
    )
}
