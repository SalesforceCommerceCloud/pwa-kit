/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * SLAS Token Security - Proxy API Client
 *
 * This API client is designed for use in nested iframes (Express Payments).
 * Instead of requiring a Bearer token, it uses `credentials: 'include'` to
 * automatically send HTTP-only cookies with requests.
 *
 * The server-side proxy endpoints extract the SLAS token from cookies,
 * ensuring tokens are never exposed to client-side JavaScript.
 */

/**
 * Proxy API Client for Express Payments
 *
 * Key differences from the original ApiClient:
 * - No token parameter required
 * - Uses credentials: 'include' for automatic cookie sending
 * - Points to /api/express/* proxy endpoints
 */
export class ProxyApiClient {
    baseUrl = null
    site = null

    constructor(baseUrl, site) {
        this.baseUrl = baseUrl
        this.site = site
    }

    async base(method, options = {}) {
        const queryParams = {
            siteId: this.site.id,
            ...(options?.queryParams || {})
        }

        let fullUrl = this.baseUrl
        if (options?.pathSuffix) {
            fullUrl = `${this.baseUrl}${options.pathSuffix}`
        }
        fullUrl = `${fullUrl}?${new URLSearchParams(queryParams)}`

        const requestConfig = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers || {})
            },
            credentials: 'include'
        }

        if (options?.body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            requestConfig.body = options.body
        }

        return fetch(fullUrl, requestConfig)
    }

    get(options) {
        return this.base('GET', options)
    }

    post(options) {
        return this.base('POST', options)
    }

    put(options) {
        return this.base('PUT', options)
    }

    delete(options) {
        return this.base('DELETE', options)
    }

    patch(options) {
        return this.base('PATCH', options)
    }
}

/**
 * Shipping Address Service using Proxy API
 */
export class ProxyShippingAddressService {
    apiClient = null

    constructor(site) {
        this.apiClient = new ProxyApiClient('/api/express/baskets', site)
    }

    async _handleResponse(res) {
        if (res.status >= 300) {
            const errorBody = await res.text()
            throw new Error(`Request failed with status ${res.status}: ${errorBody}`)
        }
        return res.json()
    }

    async updateShippingAddress(basketId, data) {
        const res = await this.apiClient.put({
            pathSuffix: `/${basketId}/shipping-address`,
            body: JSON.stringify({data})
        })
        return this._handleResponse(res)
    }
}

/**
 * Shipping Methods Service using Proxy API
 */
export class ProxyShippingMethodsService {
    apiClient = null

    constructor(site) {
        this.apiClient = new ProxyApiClient('/api/express/baskets', site)
    }

    async _handleResponse(res) {
        if (res.status >= 300) {
            const errorBody = await res.text()
            throw new Error(`Request failed with status ${res.status}: ${errorBody}`)
        }
        return res.json()
    }

    async getShippingMethods(basketId) {
        const res = await this.apiClient.get({
            pathSuffix: `/${basketId}/shipping-methods`
        })
        return this._handleResponse(res)
    }

    async updateShippingMethod(shippingMethodId, basketId) {
        const res = await this.apiClient.put({
            pathSuffix: `/${basketId}/shipping-methods`,
            body: JSON.stringify({shippingMethodId})
        })
        return this._handleResponse(res)
    }
}

/**
 * Payments Service using Proxy API
 */
export class ProxyPaymentsService {
    apiClient = null

    constructor(site) {
        this.apiClient = new ProxyApiClient('/api/express/payments', site)
    }

    async _handleResponse(res) {
        if (res.status >= 300) {
            const errorBody = await res.text()
            throw new Error(`Request failed with status ${res.status}: ${errorBody}`)
        }
        return res.json()
    }

    async submitPayment(adyenStateData, basketId, customerId) {
        const res = await this.apiClient.post({
            body: JSON.stringify({
                data: adyenStateData,
                basketId,
                customerId
            })
        })
        return this._handleResponse(res)
    }
}

/**
 * Baskets Service using Proxy API
 */
export class ProxyBasketsService {
    apiClient = null

    constructor(site) {
        this.apiClient = new ProxyApiClient('/api/express/baskets', site)
    }

    async _handleResponse(res) {
        if (res.status >= 300) {
            const errorBody = await res.text()
            throw new Error(`Request failed with status ${res.status}: ${errorBody}`)
        }
        if (res.status === 204) {
            return null
        }
        return res.json()
    }

    async createTemporaryBasket(productItems, currency = null) {
        const body = {productItems}
        if (currency) {
            body.currency = currency
        }

        const res = await this.apiClient.post({
            pathSuffix: '/temporary',
            body: JSON.stringify(body)
        })
        return this._handleResponse(res)
    }

    async getBasket(basketId) {
        const res = await this.apiClient.get({
            pathSuffix: `/${basketId}`
        })
        return this._handleResponse(res)
    }

    async deleteBasket(basketId) {
        const res = await this.apiClient.delete({
            pathSuffix: `/${basketId}`
        })
        return this._handleResponse(res)
    }

    async calculateBasket(basketId) {
        const res = await this.apiClient.post({
            pathSuffix: `/${basketId}/calculate`
        })
        return this._handleResponse(res)
    }
}
