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

        console.log('🔧 ApiClient: New instance created with TokenProvider:', {
            instanceId: this.instanceId,
            url: this.url,
            providerId: this.tokenProvider?.providerId,
            providerInfo: this.tokenProvider?.getTokenInfo()
        })
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
        
        console.log('📡 ApiClient: Making request with current tokens:', {
            instanceId: this.instanceId,
            method: method.toUpperCase(),
            url: this.url,
            tokenUsageCount: this.tokenUsageCount,
            timeSinceLastUpdate: `${timeSinceLastUpdate}ms`,
            tokenStart: authToken?.substring(0, 10) + '...',
            refreshTokenStart: refreshToken?.substring(0, 10) + '...',
            providerId: this.tokenProvider?.providerId,
            requestStartTime
        })

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
            console.log('🔑 ApiClient: Using token for request:', {
                instanceId: this.instanceId,
                tokenStart: token?.substring(0, 10) + '...',
                isCurrentToken: token === authToken,
                tokenAge: timeSinceLastUpdate,
                providerId: this.tokenProvider?.providerId
            })
            
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
                console.log('🔄 ApiClient: Received token update, forwarding to provider:', {
                    instanceId: this.instanceId,
                    providerId: this.tokenProvider?.providerId,
                    newAuthTokenStart: newAuthToken?.substring(0, 10) + '...',
                    newRefreshTokenStart: newRefreshToken?.substring(0, 10) + '...'
                })
                
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
            
            console.log('🔧 ApiClient: Using current refresh token for request:', {
                instanceId: this.instanceId,
                providerId: this.tokenProvider?.providerId,
                originalRefreshTokenStart: currentRefreshToken?.substring(0, 10) + '...',
                latestRefreshTokenStart: latestRefreshToken?.substring(0, 10) + '...',
                refreshTokenUpdated: latestRefreshToken !== currentRefreshToken
            })
            
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

        console.log('📡 ApiClient: Request completed:', {
            instanceId: this.instanceId,
            status: response.status,
            ok: response.ok,
            tokenUsageCount: this.tokenUsageCount,
            providerId: this.tokenProvider?.providerId
        })

        return response
    }

    get(options) {
        return this.base('get', options)
    }

    post(options) {
        return this.base('post', options)
    }
}
