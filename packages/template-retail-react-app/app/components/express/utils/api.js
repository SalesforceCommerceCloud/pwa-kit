/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {makeAuthenticatedRequest} from '@salesforce/retail-react-app/app/components/express/utils/token-refresh'
export class ApiClient {
    url = null
    token = null
    refreshToken = null
    site = null

    constructor(url, token, refreshToken, site) {
        this.url = url
        this.token = token
        this.refreshToken = refreshToken
        this.site = site
    }

    async base(method, options) {
        const queryParams = {
            siteId: this.site.id,
            ...(options?.queryParams || {})
        }
        const fullUrl = `${this.url}?${new URLSearchParams(queryParams)}`
        const requestConfig = {
            method: method,
            body: options?.body || null,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        }

        const makeRequest = async (token) => {
            return await fetch(fullUrl, {
                ...requestConfig,
                headers: {
                    ...requestConfig.headers,
                    authorization: `Bearer ${token}`
                }
            })
        }

        const response = await makeAuthenticatedRequest(
            makeRequest,
            this.token,
            this.refreshToken,
            this.site.id,
            `${method.toUpperCase()} ${this.url}`
        )

        // Update token if it was refreshed (this would need to be handled differently in a real implementation)
        // For now, we'll assume the token refresh is handled at a higher level
        
        return response
    }

    get(options) {
        return this.base('get', options)
    }

    post(options) {
        return this.base('post', options)
    }
}
