/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * SLAS Token Security - PostMessage API Client
 *
 * This client is used by Express Payment iframes to make API calls through
 * the parent window's relay handler. Due to browser storage partitioning,
 * nested iframes cannot access the parent's cookies directly.
 *
 * Flow:
 * 1. Iframe calls postMessageApi.fetch(endpoint, options)
 * 2. Client generates unique requestId and sends EXPRESS_API_REQUEST to parent
 * 3. Parent's useExpressApiRelay hook receives request
 * 4. Parent makes actual fetch() with credentials: 'include'
 * 5. Parent sends EXPRESS_API_RESPONSE back to iframe
 * 6. Client resolves the promise with the response data
 *
 * Security:
 * - SLAS token never exposed to iframe JavaScript
 * - Tokens stay in HTTP-only cookies on parent
 * - Request/response correlation via unique requestId
 *
 * SSR Safety:
 * - All window access is guarded with typeof checks
 * - Singleton is lazy-loaded only on client side
 */

/**
 * Check if we're running in a browser environment
 */
const isBrowser = typeof window !== 'undefined'

/**
 * Message types for the relay protocol
 */
const EXPRESS_RELAY_MESSAGES = {
    API_REQUEST: 'EXPRESS_API_REQUEST',
    API_RESPONSE: 'EXPRESS_API_RESPONSE'
}

/**
 * Generates a unique request ID for correlating requests and responses
 */
const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * PostMessage API Client for Express Payment iframes
 *
 * This client communicates with the parent window's relay handler
 * to make authenticated API calls without accessing tokens directly.
 */
class PostMessageApiClient {
    pendingRequests = new Map()
    timeout = 30000 // 30 second timeout
    initialized = false

    constructor() {
        // Only set up listener in browser environment
        if (isBrowser) {
            this.setupMessageListener()
        }
    }

    /**
     * Sets up the message listener for responses
     */
    setupMessageListener() {
        if (this.initialized || !isBrowser) {
            return
        }

        window.addEventListener('message', (event) => {
            if (!event.data || event.data.type !== EXPRESS_RELAY_MESSAGES.API_RESPONSE) {
                return
            }

            const {requestId, data, error, status} = event.data

            if (!requestId || !this.pendingRequests.has(requestId)) {
                return
            }

            const {resolve, reject, timeoutId} = this.pendingRequests.get(requestId)
            this.pendingRequests.delete(requestId)

            // Clear the timeout
            if (timeoutId) {
                clearTimeout(timeoutId)
            }

            if (error) {
                console.error('[PostMessageApi] Request failed:', status, error)
                reject(new PostMessageApiError(error.message || 'Request failed', status, error))
            } else {
                resolve({data, status})
            }
        })

        this.initialized = true
    }

    /**
     * Makes an API request through the parent relay
     *
     * @param {string} endpoint - API endpoint (e.g., '/api/express/baskets/123/shipping-methods')
     * @param {Object} options - Request options
     * @param {string} options.method - HTTP method (default: 'GET')
     * @param {Object|string} options.body - Request body
     * @param {Object} options.headers - Additional headers
     * @returns {Promise<Object>} Response data
     */
    fetch(endpoint, options = {}) {
        // On server, reject immediately
        if (!isBrowser) {
            return Promise.reject(
                new PostMessageApiError('Cannot use PostMessageApi on server side', 500, {
                    error: 'SSR_NOT_SUPPORTED'
                })
            )
        }

        // Architecture:
        // Main PWA (has cookie, has useExpressApiRelay listener)
        //   └─ MIAW iframe
        //        └─ Express iframe (this code runs here)
        //
        // We use window.top.postMessage() to send to the Main PWA,
        // NOT window.parent.postMessage() which would send to MIAW.

        return new Promise((resolve, reject) => {
            const isInIframe = window !== window.top

            if (!isInIframe) {
                // Not in an iframe, use direct fetch
                this.directFetch(endpoint, options).then(resolve).catch(reject)
                return
            }

            // We're in an iframe - use postMessage to top window (Main PWA)
            this.setupMessageListener()

            const requestId = generateRequestId()

            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    console.error('[PostMessageApi] Timeout:', endpoint)
                    this.pendingRequests.delete(requestId)
                    reject(new PostMessageApiError('Request timeout', 504, {error: 'TIMEOUT'}))
                }
            }, this.timeout)

            this.pendingRequests.set(requestId, {resolve, reject, timeoutId})

            const message = {
                type: EXPRESS_RELAY_MESSAGES.API_REQUEST,
                requestId,
                endpoint,
                method: options.method || 'GET',
                body: options.body,
                headers: options.headers
            }

            console.log('[PostMessageApi] Relay:', options.method || 'GET', endpoint)

            try {
                // IMPORTANT: Use window.top to send to the Main PWA, not window.parent (which is MIAW)
                window.top.postMessage(message, '*')
            } catch (err) {
                console.error('[PostMessageApi] Failed to send postMessage:', err)
                this.pendingRequests.delete(requestId)
                clearTimeout(timeoutId)
                reject(
                    new PostMessageApiError('Failed to send message to top window', 500, {
                        error: err.message
                    })
                )
            }
        })
    }

    /**
     * Direct fetch for when not in an iframe (fallback)
     */
    async directFetch(endpoint, options = {}) {
        const response = await fetch(endpoint, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            credentials: 'include',
            ...(options.body && {
                body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
            })
        })

        if (response.status === 204) {
            return {data: null, status: 204}
        }

        if (!response.ok) {
            let error
            try {
                error = await response.json()
            } catch {
                error = {message: response.statusText}
            }
            throw new PostMessageApiError(error.message || 'Request failed', response.status, error)
        }

        const data = await response.json()
        return {data, status: response.status}
    }
}

/**
 * Custom error class for PostMessage API errors
 */
class PostMessageApiError extends Error {
    constructor(message, status, details) {
        super(message)
        this.name = 'PostMessageApiError'
        this.status = status
        this.details = details
    }
}

// Lazy singleton - only created when first accessed in browser
let _postMessageApiInstance = null

const getPostMessageApi = () => {
    if (!isBrowser) {
        // Return a stub for SSR that throws on use
        return {
            fetch: () =>
                Promise.reject(
                    new PostMessageApiError('Cannot use PostMessageApi on server side', 500, {
                        error: 'SSR_NOT_SUPPORTED'
                    })
                )
        }
    }

    if (!_postMessageApiInstance) {
        _postMessageApiInstance = new PostMessageApiClient()
    }
    return _postMessageApiInstance
}

/**
 * Shipping Address Service using PostMessage API
 */
export class PostMessageShippingAddressService {
    site = null

    constructor(site) {
        this.site = site
    }

    async updateShippingAddress(basketId, data) {
        const endpoint = `/api/express/baskets/${basketId}/shipping-address?siteId=${this.site.id}`
        const {data: result} = await getPostMessageApi().fetch(endpoint, {
            method: 'PUT',
            body: {data}
        })
        return result
    }
}

/**
 * Shipping Methods Service using PostMessage API
 */
export class PostMessageShippingMethodsService {
    site = null

    constructor(site) {
        this.site = site
    }

    async getShippingMethods(basketId) {
        const endpoint = `/api/express/baskets/${basketId}/shipping-methods?siteId=${this.site.id}`
        const {data: result} = await getPostMessageApi().fetch(endpoint, {
            method: 'GET'
        })
        return result
    }

    async updateShippingMethod(shippingMethodId, basketId) {
        const endpoint = `/api/express/baskets/${basketId}/shipping-methods?siteId=${this.site.id}`
        const {data: result} = await getPostMessageApi().fetch(endpoint, {
            method: 'PUT',
            body: {shippingMethodId}
        })
        return result
    }
}

/**
 * Payments Service using PostMessage API
 */
export class PostMessagePaymentsService {
    site = null

    constructor(site) {
        this.site = site
    }

    async submitPayment(adyenStateData, basketId, customerId) {
        const endpoint = `/api/express/payments?siteId=${this.site.id}`
        const {data: result} = await getPostMessageApi().fetch(endpoint, {
            method: 'POST',
            body: {
                data: adyenStateData,
                basketId,
                customerId
            }
        })
        return result
    }
}

/**
 * Baskets Service using PostMessage API
 */
export class PostMessageBasketsService {
    site = null

    constructor(site) {
        this.site = site
    }

    async createTemporaryBasket(productItems, currency = null) {
        const endpoint = `/api/express/baskets/temporary?siteId=${this.site.id}`
        const body = {productItems}
        if (currency) {
            body.currency = currency
        }

        const {data: result} = await getPostMessageApi().fetch(endpoint, {
            method: 'POST',
            body
        })
        return result
    }

    async getBasket(basketId) {
        const endpoint = `/api/express/baskets/${basketId}?siteId=${this.site.id}`
        const {data: result} = await getPostMessageApi().fetch(endpoint, {
            method: 'GET'
        })
        return result
    }

    async deleteBasket(basketId) {
        const endpoint = `/api/express/baskets/${basketId}?siteId=${this.site.id}`
        await getPostMessageApi().fetch(endpoint, {
            method: 'DELETE'
        })
        return true
    }

    async calculateBasket(basketId) {
        const endpoint = `/api/express/baskets/${basketId}/calculate?siteId=${this.site.id}`
        const {data: result} = await getPostMessageApi().fetch(endpoint, {
            method: 'POST'
        })
        return result
    }
}

// Export getter function and error class
export {getPostMessageApi as postMessageApi, PostMessageApiError}
export default getPostMessageApi
