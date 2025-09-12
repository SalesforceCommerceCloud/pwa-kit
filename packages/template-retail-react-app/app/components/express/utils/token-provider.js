/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Global registry to track all TokenProvider instances
const tokenProviderRegistry = new Map()

/**
 * Token Provider - Ensures all services use the most current tokens
 * This solves the issue where services are created with stale tokens after a refresh
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
        this.createdAt = new Date().toISOString()
        this.accessCount = 0

        // Register this provider globally
        tokenProviderRegistry.set(this.providerId, {
            provider: this,
            createdAt: this.createdAt,
            siteId: this.site?.id
        })

        console.log('🏭 TokenProvider: Created new provider:', {
            providerId: this.providerId,
            hasAuthToken: !!this.authToken,
            hasRefreshToken: !!this.refreshToken,
            authTokenStart: this.authToken?.substring(0, 10) + '...',
            refreshTokenStart: this.refreshToken?.substring(0, 10) + '...',
            siteId: this.site?.id,
            totalProviders: tokenProviderRegistry.size,
            createdAt: this.createdAt
        })

        // Log all existing providers for comparison
        if (tokenProviderRegistry.size > 1) {
            console.warn('⚠️ TokenProvider: Multiple providers detected!', {
                totalProviders: tokenProviderRegistry.size,
                providers: Array.from(tokenProviderRegistry.values()).map(entry => ({
                    providerId: entry.provider.providerId,
                    siteId: entry.siteId,
                    createdAt: entry.createdAt,
                    updateCount: entry.provider.updateCount,
                    accessCount: entry.provider.accessCount
                }))
            })
        }
    }

    /**
     * Get the current auth token
     */
    getCurrentAuthToken() {
        this.accessCount++
        const timeSinceUpdate = Date.now() - new Date(this.lastUpdate).getTime()
        
        console.log('🔑 TokenProvider: Getting current auth token:', {
            providerId: this.providerId,
            hasToken: !!this.authToken,
            tokenStart: this.authToken?.substring(0, 10) + '...',
            updateCount: this.updateCount,
            accessCount: this.accessCount,
            lastUpdate: this.lastUpdate,
            timeSinceUpdate: `${timeSinceUpdate}ms`,
            totalProviders: tokenProviderRegistry.size,
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' <- ')
        })

        // Check if there are other providers with newer tokens
        const allProviders = Array.from(tokenProviderRegistry.values())
        const newerProviders = allProviders.filter(entry => 
            entry.provider.providerId !== this.providerId && 
            entry.provider.updateCount > this.updateCount
        )
        
        if (newerProviders.length > 0) {
            console.warn('⚠️ TokenProvider: Using potentially stale token! Newer providers exist:', {
                currentProviderId: this.providerId,
                currentUpdateCount: this.updateCount,
                newerProviders: newerProviders.map(entry => ({
                    providerId: entry.provider.providerId,
                    updateCount: entry.provider.updateCount,
                    lastUpdate: entry.provider.lastUpdate
                }))
            })
        }

        return this.authToken
    }

    /**
     * Get the current refresh token
     */
    getCurrentRefreshToken() {
        this.accessCount++
        const timeSinceUpdate = Date.now() - new Date(this.lastUpdate).getTime()
        
        console.log('🔄 TokenProvider: Getting current refresh token:', {
            providerId: this.providerId,
            hasToken: !!this.refreshToken,
            tokenStart: this.refreshToken?.substring(0, 10) + '...',
            updateCount: this.updateCount,
            accessCount: this.accessCount,
            lastUpdate: this.lastUpdate,
            timeSinceUpdate: `${timeSinceUpdate}ms`,
            totalProviders: tokenProviderRegistry.size,
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' <- ')
        })

        // Check if there are other providers with newer tokens
        const allProviders = Array.from(tokenProviderRegistry.values())
        const newerProviders = allProviders.filter(entry => 
            entry.provider.providerId !== this.providerId && 
            entry.provider.updateCount > this.updateCount
        )
        
        if (newerProviders.length > 0) {
            console.warn('⚠️ TokenProvider: Using potentially stale refresh token! Newer providers exist:', {
                currentProviderId: this.providerId,
                currentUpdateCount: this.updateCount,
                newerProviders: newerProviders.map(entry => ({
                    providerId: entry.provider.providerId,
                    updateCount: entry.provider.updateCount,
                    lastUpdate: entry.provider.lastUpdate
                }))
            })
        }

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
        const updateId = Math.random().toString(36).substring(2, 8)
        const previousUpdateCount = this.updateCount
        this.updateCount++
        
        console.log('🔄 TokenProvider: Updating tokens:', {
            providerId: this.providerId,
            updateId,
            previousUpdateCount,
            newUpdateCount: this.updateCount,
            oldAuthTokenStart: this.authToken?.substring(0, 10) + '...',
            newAuthTokenStart: newAuthToken?.substring(0, 10) + '...',
            oldRefreshTokenStart: this.refreshToken?.substring(0, 10) + '...',
            newRefreshTokenStart: newRefreshToken?.substring(0, 10) + '...',
            authTokenChanged: newAuthToken !== this.authToken,
            refreshTokenChanged: newRefreshToken !== this.refreshToken,
            totalProviders: tokenProviderRegistry.size,
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' <- ')
        })

        // Log all other providers before update
        const allProviders = Array.from(tokenProviderRegistry.values())
        const otherProviders = allProviders.filter(entry => entry.provider.providerId !== this.providerId)
        
        if (otherProviders.length > 0) {
            console.log('📊 TokenProvider: Other providers before update:', {
                updatingProviderId: this.providerId,
                otherProviders: otherProviders.map(entry => ({
                    providerId: entry.provider.providerId,
                    updateCount: entry.provider.updateCount,
                    accessCount: entry.provider.accessCount,
                    authTokenStart: entry.provider.authToken?.substring(0, 10) + '...',
                    refreshTokenStart: entry.provider.refreshToken?.substring(0, 10) + '...',
                    lastUpdate: entry.provider.lastUpdate
                }))
            })
        }

        this.authToken = newAuthToken
        this.refreshToken = newRefreshToken
        this.lastUpdate = new Date().toISOString()

        console.log('✅ TokenProvider: Tokens updated successfully:', {
            providerId: this.providerId,
            updateId,
            updateCount: this.updateCount,
            lastUpdate: this.lastUpdate,
            newAuthTokenStart: this.authToken?.substring(0, 10) + '...',
            newRefreshTokenStart: this.refreshToken?.substring(0, 10) + '...'
        })

        // Call the original callback if provided
        if (this.onTokenUpdate) {
            console.log('📞 TokenProvider: Calling original token update callback:', {
                providerId: this.providerId,
                updateId,
                hasCallback: !!this.onTokenUpdate
            })
            this.onTokenUpdate(newAuthToken, newRefreshToken)
        } else {
            console.warn('⚠️ TokenProvider: No token update callback provided:', {
                providerId: this.providerId,
                updateId
            })
        }

        // Log state of all providers after update
        setTimeout(() => {
            const allProvidersAfter = Array.from(tokenProviderRegistry.values())
            console.log('📊 TokenProvider: All providers after update:', {
                updatedProviderId: this.providerId,
                totalProviders: allProvidersAfter.length,
                providers: allProvidersAfter.map(entry => ({
                    providerId: entry.provider.providerId,
                    updateCount: entry.provider.updateCount,
                    accessCount: entry.provider.accessCount,
                    authTokenStart: entry.provider.authToken?.substring(0, 10) + '...',
                    refreshTokenStart: entry.provider.refreshToken?.substring(0, 10) + '...',
                    lastUpdate: entry.provider.lastUpdate,
                    isUpdatedProvider: entry.provider.providerId === this.providerId
                }))
            })
        }, 100)
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
            authTokenStart: this.authToken?.substring(0, 10) + '...',
            refreshTokenStart: this.refreshToken?.substring(0, 10) + '...',
            updateCount: this.updateCount,
            lastUpdate: this.lastUpdate,
            siteId: this.site?.id
        }
    }
}
