/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Simplified Token Provider - Single source of truth for tokens
 * Eliminates the need to pass individual authToken/refreshToken parameters
 */
export class TokenProvider {
    constructor(initialAuthToken = null, initialRefreshToken = null, site = null, onTokenUpdate = null) {
        this.authToken = initialAuthToken
        this.refreshToken = initialRefreshToken
        this.site = site
        this.onTokenUpdate = onTokenUpdate
        this.providerId = Math.random().toString(36).substring(2, 8)
        this.updateCount = 0
        this.lastUpdate = new Date().toISOString()

    }

    /**
     * Get the current auth token
     */
    getCurrentAuthToken() {
        return this.authToken
    }

    /**
     * Get the current refresh token
     */
    getCurrentRefreshToken() {
        return this.refreshToken
    }

    /**
     * Get the current site
     */
    getCurrentSite() {
        return this.site
    }

    /**
     * Get the token update callback
     */
    getTokenUpdateCallback() {
        return this.onTokenUpdate
    }

    /**
     * Update tokens - this is called when tokens are refreshed
     */
    updateTokens(newAuthToken, newRefreshToken) {
        this.updateCount++
        this.authToken = newAuthToken
        this.refreshToken = newRefreshToken
        this.lastUpdate = new Date().toISOString()

        // Call the original callback if provided
        if (this.onTokenUpdate) {
            this.onTokenUpdate(newAuthToken, newRefreshToken)
        }
    }

    /**
     * Create a wrapped token update callback that updates this provider
     */
    createWrappedCallback() {
        return (newAuthToken, newRefreshToken) => {
            this.updateTokens(newAuthToken, newRefreshToken)
        }
    }

    /**
     * Get current token info for debugging
     */
    getTokenInfo() {
        return {
            providerId: this.providerId,
            hasAuthToken: !!this.authToken,
            hasRefreshToken: !!this.refreshToken,
            updateCount: this.updateCount,
            lastUpdate: this.lastUpdate,
            siteId: this.site?.id
        }
    }
}
