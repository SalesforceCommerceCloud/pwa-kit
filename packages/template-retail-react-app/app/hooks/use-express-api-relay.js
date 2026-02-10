/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * SLAS Token Security - Express API Relay Hook
 *
 * This hook enables the PostMessage relay pattern for Express Payments iframes.
 *
 * Due to browser storage partitioning, nested iframes (like Express Payments)
 * cannot access the parent's cookies. This hook listens for API requests from
 * the iframe via postMessage, makes the actual API call with credentials included,
 * and relays the response back to the iframe.
 *
 * Flow:
 * 1. Express iframe sends: EXPRESS_API_REQUEST {requestId, endpoint, method, body}
 * 2. Parent (this hook) receives message and validates origin
 * 3. Parent makes fetch() with credentials: 'include' (cookies auto-sent)
 * 4. Parent sends response: EXPRESS_API_RESPONSE {requestId, data, error}
 * 5. Express iframe receives response and resolves the pending promise
 *
 * Security:
 * - SLAS token stays in HTTP-only cookies
 * - Token is never exposed to iframe JavaScript
 * - Origin validation prevents unauthorized requests
 */

import {useEffect, useCallback} from 'react'

/**
 * Message types for the relay protocol
 */
export const EXPRESS_RELAY_MESSAGES = {
    API_REQUEST: 'EXPRESS_API_REQUEST',
    API_RESPONSE: 'EXPRESS_API_RESPONSE'
}

/**
 * Allowed API endpoints that can be relayed
 * This prevents the relay from being used for arbitrary requests
 */
const ALLOWED_ENDPOINTS = ['/api/express/baskets', '/api/express/payments']

/**
 * Validates that an endpoint is allowed for relaying
 *
 * @param {string} endpoint - The endpoint to validate
 * @returns {boolean} True if endpoint is allowed
 */
const isAllowedEndpoint = (endpoint) => {
    return ALLOWED_ENDPOINTS.some((allowed) => endpoint.startsWith(allowed))
}

/**
 * Hook to handle Express API relay for nested iframes.
 *
 * This should be used in the parent application (e.g., _app/index.jsx)
 * to enable secure API calls from Express Payment iframes.
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.enabled - Whether the relay is enabled (default: true)
 * @param {string[]} options.allowedOrigins - List of allowed origins for messages
 * @returns {Object} Relay state and controls
 *
 * @example
 * // In _app/index.jsx
 * useExpressApiRelay({
 *   enabled: true,
 *   allowedOrigins: [window.location.origin]
 * })
 */
export const useExpressApiRelay = ({enabled = true, allowedOrigins = []} = {}) => {
    // CRITICAL: Only the top-level window should relay requests.
    // If we're in an iframe, we should NOT process requests because:
    // 1. We might be in a third-party context without access to first-party cookies
    // 2. We'd be catching our own messages meant for the actual top window
    const isTopLevel = typeof window !== 'undefined' && window === window.top

    /**
     * Handles incoming postMessage requests from iframes
     */
    const handleMessage = useCallback(
        async (event) => {
            // Validate origin if allowedOrigins is specified
            if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
                // For same-origin iframes, origin might be empty or match window.location.origin
                if (event.origin !== '' && event.origin !== window.location.origin) {
                    console.warn(
                        '[Express Relay] Blocked message from unauthorized origin:',
                        event.origin
                    )
                    return
                }
            }

            // Check if this is an Express API request
            if (!event.data || event.data.type !== EXPRESS_RELAY_MESSAGES.API_REQUEST) {
                return
            }

            const {requestId, endpoint, method, body, headers} = event.data

            if (!requestId || !endpoint) {
                console.warn('[Express Relay] Invalid request: missing requestId or endpoint')
                return
            }

            // Validate endpoint is allowed
            if (!isAllowedEndpoint(endpoint)) {
                console.warn('[Express Relay] Blocked request to unauthorized endpoint:', endpoint)
                sendResponse(event.source, requestId, null, {
                    error: 'UNAUTHORIZED_ENDPOINT',
                    message: 'This endpoint is not allowed for relay'
                })
                return
            }

            console.log('[Express Relay] Proxying:', method || 'GET', endpoint)

            try {
                // Make the actual API call with credentials included
                const response = await fetch(endpoint, {
                    method: method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(headers || {})
                    },
                    credentials: 'include', // This sends HTTP-only cookies
                    ...(body && {body: typeof body === 'string' ? body : JSON.stringify(body)})
                })

                let data = null
                let error = null

                if (response.ok) {
                    // Handle 204 No Content
                    if (response.status === 204) {
                        data = null
                    } else {
                        data = await response.json()
                    }
                } else {
                    // Try to parse error response
                    try {
                        error = await response.json()
                    } catch {
                        error = {
                            status: response.status,
                            message: response.statusText
                        }
                    }
                    console.error('[Express Relay] Error:', response.status, error)
                }

                sendResponse(event.source, requestId, data, error, response.status)
            } catch (err) {
                console.error('[Express Relay] Request failed:', err.message)
                sendResponse(event.source, requestId, null, {
                    error: 'RELAY_ERROR',
                    message: err.message
                })
            }
        },
        [allowedOrigins]
    )

    /**
     * Sends a response back to the iframe
     */
    const sendResponse = (source, requestId, data, error, status = 200) => {
        if (!source) {
            console.error('[Express Relay] No source window to send response')
            return
        }

        const response = {
            type: EXPRESS_RELAY_MESSAGES.API_RESPONSE,
            requestId,
            data,
            error,
            status
        }

        try {
            source.postMessage(response, '*')
        } catch (err) {
            console.error('[Express Relay] Failed to send response:', err)
        }
    }

    // Set up message listener - ONLY on top-level window
    useEffect(() => {
        if (!enabled || !isTopLevel) {
            return
        }

        console.log('[Express Relay] Active on top-level window')
        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [enabled, handleMessage, isTopLevel])

    return {
        enabled,
        isTopLevel
    }
}

export default useExpressApiRelay
