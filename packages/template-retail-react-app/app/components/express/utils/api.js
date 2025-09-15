/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {makeAuthenticatedRequest} from '@salesforce/retail-react-app/app/components/express/utils/token-refresh'

export class ApiClient {
    url = null
    tokenProvider = null
    instanceId = null
    tokenUsageCount = 0
    lastTokenUpdate = null

    constructor(url, tokenProvider) {
        this.url = url
        this.tokenProvider = tokenProvider
        this.instanceId = Math.random().toString(36).substring(2, 8)
        this.tokenUsageCount = 0
        this.lastTokenUpdate = new Date().toISOString()

    }

    /**
     * Get current tokens from the provider
     */
    getCurrentTokens() {
        const authToken = this.tokenProvider?.getCurrentAuthToken()
        const refreshToken = this.tokenProvider?.getCurrentRefreshToken()
        const site = this.tokenProvider?.getCurrentSite()
        const onTokenUpdate = this.tokenProvider?.getTokenUpdateCallback()

        return {
            authToken,
            refreshToken,
            site,
            onTokenUpdate
        }
    }

    async base(method, options) {
        this.tokenUsageCount++
        const requestStartTime = new Date().toISOString()
        const timeSinceLastUpdate = Date.now() - new Date(this.lastTokenUpdate).getTime()
        
        // Get current tokens from provider
        const {authToken, refreshToken, site, onTokenUpdate} = this.getCurrentTokens()
        

        const queryParams = {
            siteId: site?.id,
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

        // Create a wrapped callback that updates the token provider
        const wrappedOnTokenUpdate = onTokenUpdate 
            ? (newAuthToken, newRefreshToken) => {
                
                // Update the token provider
                this.tokenProvider?.updateTokens(newAuthToken, newRefreshToken)
                this.lastTokenUpdate = new Date().toISOString()
                this.tokenUsageCount = 0 // Reset usage count after token update
                
                // Call the original callback if provided
                if (onTokenUpdate) {
                    onTokenUpdate(newAuthToken, newRefreshToken)
                }
            }
            : null

        // Create a wrapper that always gets the current refresh token from the provider
        const tokenRefreshWrapper = async (requestFunction, currentAuthToken, tokenUpdateCallback, currentRefreshToken, currentSite) => {
            // Always get the most current refresh token from the provider
            const latestRefreshToken = this.tokenProvider?.getCurrentRefreshToken() || currentRefreshToken
            
            
            return makeAuthenticatedRequest(
                requestFunction,
                currentAuthToken,
                tokenUpdateCallback,
                latestRefreshToken,
                currentSite,
                this.tokenProvider
            )
        }

        const response = await tokenRefreshWrapper(
            makeRequest,
            authToken,
            wrappedOnTokenUpdate,
            refreshToken,
            site
        )


        return response
    }

    get(options) {
        return this.base('get', options)
    }

    post(options) {
        return this.base('post', options)
    }
}
