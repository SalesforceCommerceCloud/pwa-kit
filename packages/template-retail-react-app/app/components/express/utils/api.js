/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
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

    async refreshAccessToken() {
        if (!this.refreshToken) {
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
                    refreshToken: this.refreshToken,
                    siteId: this.site.id
                })
            })

            if (!refreshResponse.ok) {
                const errorText = await refreshResponse.text()
                throw new Error(`Token refresh failed: ${refreshResponse.status} ${errorText}`)
            }

            const data = await refreshResponse.json()
            this.token = data.authToken
            
            // Update refresh token if a new one is provided
            if (data.refreshToken) {
                this.refreshToken = data.refreshToken
            }

            return {
                authToken: this.token,
                refreshToken: this.refreshToken
            }
        } catch (error) {
            console.error('Failed to refresh access token:', error)
            throw error
        }
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
                authorization: `Bearer ${this.token}`,
                ...options?.headers
            }
        }
        
        const response = await fetch(fullUrl, requestConfig)
        
        // Handle 401 unauthorized errors by attempting token refresh
        if (response.status === 401 && this.refreshToken) {
            try {
                console.log('🔄 Authentication failed, attempting token refresh...')
                await this.refreshAccessToken()
                
                // Retry the original request with the new token
                const retryRequestConfig = {
                    ...requestConfig,
                    headers: {
                        ...requestConfig.headers,
                        authorization: `Bearer ${this.token}`
                    }
                }
                
                const retryResponse = await fetch(fullUrl, retryRequestConfig)
                console.log(`🔄 Token refresh successful, retry response: ${retryResponse.status}`)
                return retryResponse
            } catch (refreshError) {
                console.error('🔄 Token refresh failed:', refreshError)
                // Return original response if refresh fails
                return response
            }
        }
        
        return response
    }

    get(options) {
        return this.base('get', options)
    }

    post(options) {
        return this.base('post', options)
    }
}
