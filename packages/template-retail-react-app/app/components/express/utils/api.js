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
    onTokenUpdate = null

    constructor(url, token, refreshToken, site, onTokenUpdate = null) {
        this.url = url
        this.token = token
        this.refreshToken = refreshToken
        this.site = site
        this.onTokenUpdate = onTokenUpdate

        // Create a wrapped onTokenUpdate callback that also updates this instance
        this.wrappedOnTokenUpdate = onTokenUpdate
            ? (newAuthToken, newRefreshToken) => {
                  // Update this instance's tokens
                  console.log('🔄 ApiClient: Auto-updating tokens via callback:', {
                      oldAuthTokenLength: this.token?.length || 0,
                      newAuthTokenLength: newAuthToken?.length || 0,
                      oldRefreshTokenLength: this.refreshToken?.length || 0,
                      newRefreshTokenLength: newRefreshToken?.length || 0
                  })
                  this.token = newAuthToken
                  this.refreshToken = newRefreshToken
                  console.log('✅ ApiClient: Tokens auto-updated successfully')

                  // Call the original callback
                  onTokenUpdate(newAuthToken, newRefreshToken)
              }
            : null
    }

    /**
     * Update the tokens used by this API client
     * @param {string} newAuthToken - New authentication token
     * @param {string} newRefreshToken - New refresh token
     */
    updateTokens(newAuthToken, newRefreshToken) {
        console.log('🔄 ApiClient: Manually updating tokens:', {
            oldAuthTokenLength: this.token?.length || 0,
            newAuthTokenLength: newAuthToken?.length || 0,
            oldRefreshTokenLength: this.refreshToken?.length || 0,
            newRefreshTokenLength: newRefreshToken?.length || 0
        })
        this.token = newAuthToken
        this.refreshToken = newRefreshToken
        console.log('✅ ApiClient: Tokens manually updated successfully')
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
            this.wrappedOnTokenUpdate,
            this.refreshToken,
            this.site
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
