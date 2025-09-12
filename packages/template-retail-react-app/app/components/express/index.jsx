/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState, useRef} from 'react'
import {useLocation} from 'react-router-dom'

import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useExpressPaymentManager} from '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-manager'
import {useStandalonePaymentMethods} from '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods'
import {TokenProvider} from '@salesforce/retail-react-app/app/components/express/utils/token-provider'
import '@salesforce/retail-react-app/app/components/express/styles/express-payments.css'

// Define the payment methods we will attempt to load
const PAYMENT_METHODS = ['applepay', 'googlepay']

function Express() {
    const {locale, site} = useMultiSite()
    const [basket, setBasketData] = useState(null)
    const location = useLocation()

    // Set transparent background for iframe
    useEffect(() => {
        document.documentElement.style.backgroundColor = 'transparent'
        document.body.style.backgroundColor = 'transparent'

        // Cleanup on unmount
        return () => {
            document.documentElement.style.backgroundColor = ''
            document.body.style.backgroundColor = ''
        }
    }, [])

    const [authToken, setAuthToken] = useState()
    const [refreshToken, setRefreshToken] = useState()

    // Create a TokenProvider that will be shared across all services
    const tokenProviderRef = useRef(null)
    const [tokenProviderReady, setTokenProviderReady] = useState(false)

    // Initialize or update the TokenProvider when tokens change
    useEffect(() => {
        console.log('🔍 Express: TokenProvider effect triggered:', {
            hasAuthToken: !!authToken,
            hasRefreshToken: !!refreshToken,
            hasSite: !!site,
            authTokenStart: authToken?.substring(0, 10) + '...',
            refreshTokenStart: refreshToken?.substring(0, 10) + '...',
            siteId: site?.id,
            hasExistingProvider: !!tokenProviderRef.current,
            existingProviderId: tokenProviderRef.current?.providerId
        })

        if (authToken && refreshToken && site) {
            if (!tokenProviderRef.current) {
                // Create new TokenProvider
                console.log('🏭 Express: Creating new TokenProvider:', {
                    authTokenStart: authToken?.substring(0, 10) + '...',
                    refreshTokenStart: refreshToken?.substring(0, 10) + '...',
                    siteId: site?.id
                })
                tokenProviderRef.current = new TokenProvider(
                    authToken,
                    refreshToken,
                    site,
                    updateTokens
                )
                console.log('✅ Express: TokenProvider created:', {
                    providerId: tokenProviderRef.current.providerId
                })
                setTokenProviderReady(true)
            } else {
                // Update existing TokenProvider
                console.log('🔄 Express: Updating existing TokenProvider:', {
                    existingProviderId: tokenProviderRef.current.providerId,
                    existingUpdateCount: tokenProviderRef.current.updateCount,
                    newAuthTokenStart: authToken?.substring(0, 10) + '...',
                    newRefreshTokenStart: refreshToken?.substring(0, 10) + '...',
                    authTokenChanged: authToken !== tokenProviderRef.current.authToken,
                    refreshTokenChanged: refreshToken !== tokenProviderRef.current.refreshToken
                })
                tokenProviderRef.current.updateTokens(authToken, refreshToken)
                console.log('✅ Express: TokenProvider updated:', {
                    providerId: tokenProviderRef.current.providerId,
                    newUpdateCount: tokenProviderRef.current.updateCount
                })
                // TokenProvider is already ready, no need to set state again
            }
        } else {
            console.warn('⚠️ Express: Missing required data for TokenProvider:', {
                hasAuthToken: !!authToken,
                hasRefreshToken: !!refreshToken,
                hasSite: !!site
            })
            if (tokenProviderReady) {
                console.log('🔄 Express: Resetting TokenProvider ready state')
                setTokenProviderReady(false)
            }
        }
    }, [authToken, refreshToken, site?.id])

    // Token update callback for child components
    const updateTokens = (newAuthToken, newRefreshToken) => {
        const updateId = Math.random().toString(36).substring(2, 8)

        console.log('🔄 Express: Updating tokens via callback:', {
            hasNewAuthToken: !!newAuthToken,
            hasNewRefreshToken: !!newRefreshToken,
            newAuthTokenLength: newAuthToken?.length || 0,
            newRefreshTokenLength: newRefreshToken?.length || 0,
            oldAuthTokenLength: authToken?.length || 0,
            oldRefreshTokenLength: refreshToken?.length || 0,
            newAuthTokenStart: newAuthToken?.substring(0, 10) + '...',
            newRefreshTokenStart: newRefreshToken?.substring(0, 10) + '...',
            oldAuthTokenStart: authToken?.substring(0, 10) + '...',
            oldRefreshTokenStart: refreshToken?.substring(0, 10) + '...',
            authTokenChanged: newAuthToken !== authToken,
            refreshTokenChanged: newRefreshToken !== refreshToken,
            updateId,
            timestamp: new Date().toISOString()
        })

        setAuthToken(newAuthToken)
        setRefreshToken(newRefreshToken)

        console.log('✅ Express: Tokens updated successfully:', {
            updateId,
            newAuthTokenSet: !!newAuthToken,
            newRefreshTokenSet: !!newRefreshToken
        })
    }

    // Check for PDP mode flag in URL
    const urlParams = new URLSearchParams(location.search)
    const isPdpMode = urlParams.get('pdp') === 'true'

    // State to track current SKU and quantity (will be set via postMessage)
    const [currentSku, setCurrentSku] = useState(null)
    const [currentQuantity, setCurrentQuantity] = useState(1)

    // Initialize the express payment manager - always call this hook
    const {manager, availableCount} = useExpressPaymentManager(PAYMENT_METHODS)

    // Fetch payment methods and environment data directly
    // Only call this hook when we have all required parameters to prevent hook ordering issues
    const {paymentMethods: adyenPaymentMethods} = useStandalonePaymentMethods(
        tokenProviderRef.current, // Pass the shared TokenProvider
        site || null, // Ensure we always pass a consistent value
        locale || null, // Ensure we always pass a consistent value
        !!(tokenProviderReady && tokenProviderRef.current && site && locale) // Only enable when TokenProvider is ready
    )

    // Mark when payment methods are being fetched
    useEffect(() => {
        if (authToken && site && locale) {
            performance.mark('express-payment-methods-fetch-start')
            console.log('🚀 Express Payment: Starting payment methods fetch...')
            if (!isPdpMode) {
                console.log(
                    `📦 Waiting for basket data: ${basket?.basketId ? 'available' : 'missing'}`
                )
            }
        }
    }, [authToken, site?.id, locale?.id, isPdpMode, basket?.basketId]) // Include basket status for non-PDP mode

    // PostMessage listener for SKU updates
    useEffect(() => {
        const handleMessage = (event) => {
            // Basic security check - accept messages from any origin for now
            // In production, you might want to restrict this to specific origins

            console.log('📨 Express: Received message:', {
                type: event.data?.type,
                origin: event.origin,
                hasData: !!event.data?.data,
                timestamp: new Date().toISOString()
            })

            if (event.data && typeof event.data === 'object') {
                const {type, sku, quantity} = event.data

                // Handle SKU update messages
                if (type === 'UPDATE_SKU' && typeof sku === 'string') {
                    console.log('📦 Express: Updating SKU:', sku)
                    setCurrentSku(sku)
                    // Always set quantity to 1 when SKU changes
                    setCurrentQuantity(1)
                }

                // Handle quantity update messages
                if (type === 'UPDATE_QUANTITY' && typeof quantity === 'number') {
                    // Validate quantity is a positive integer with reasonable limits
                    const validatedQuantity = Math.max(1, Math.min(999, Math.floor(quantity)))
                    console.log('🔢 Express: Updating quantity:', validatedQuantity)
                    setCurrentQuantity(validatedQuantity)
                }

                // Handle SKU clear messages (for regular checkout)
                if (type === 'CLEAR_SKU') {
                    console.log('🗑️ Express: Clearing SKU')
                    setCurrentSku(null)
                    setCurrentQuantity(1) // Reset quantity when clearing
                }

                // Handle basket data messages
                if (type === 'basketDataAvailable') {
                    const {basketData, authData} = event.data.data
                    console.log('🛒 Express: Received basket data:', {
                        hasBasketData: !!basketData,
                        basketId: basketData?.basketId,
                        hasAuthData: !!authData,
                        hasAuthToken: !!authData?.authToken,
                        hasRefreshToken: !!authData?.refreshToken,
                        authTokenLength: authData?.authToken?.length || 0,
                        refreshTokenLength: authData?.refreshToken?.length || 0,
                        authTokenStart: authData?.authToken?.substring(0, 10) + '...',
                        refreshTokenStart: authData?.refreshToken?.substring(0, 10) + '...',
                        currentAuthTokenStart: authToken?.substring(0, 10) + '...',
                        currentRefreshTokenStart: refreshToken?.substring(0, 10) + '...',
                        authTokenChanging: authData?.authToken !== authToken,
                        refreshTokenChanging: authData?.refreshToken !== refreshToken,
                        timestamp: new Date().toISOString()
                    })
                    setAuthToken(authData.authToken)
                    setRefreshToken(authData.refreshToken)
                    setBasketData(basketData)
                }

                // Handle authentication data messages
                if (type === 'authDataAvailable') {
                    const authData = event.data.data.authData

                    // Enhanced token reception diagnostics
                    console.log('🔐 Express: Received auth data with enhanced analysis:', {
                        hasAuthToken: !!authData?.authToken,
                        hasRefreshToken: !!authData?.refreshToken,
                        authTokenLength: authData?.authToken?.length || 0,
                        refreshTokenLength: authData?.refreshToken?.length || 0,
                        authTokenStart: authData?.authToken?.substring(0, 10) + '...',
                        refreshTokenStart: authData?.refreshToken?.substring(0, 10) + '...',
                        refreshTokenEnd: authData?.refreshToken?.substring(-10) + '...',
                        currentAuthTokenStart: authToken?.substring(0, 10) + '...',
                        currentRefreshTokenStart: refreshToken?.substring(0, 10) + '...',
                        authTokenChanging: authData?.authToken !== authToken,
                        refreshTokenChanging: authData?.refreshToken !== refreshToken,
                        timestamp: new Date().toISOString(),
                        timestampMs: Date.now()
                    })

                    // Analyze refresh token for potential issues
                    if (authData?.refreshToken) {
                        const refreshToken = authData.refreshToken
                        const tokenIssues = []

                        if (refreshToken !== refreshToken.trim()) tokenIssues.push('HAS_WHITESPACE')
                        if (/\s/.test(refreshToken)) tokenIssues.push('CONTAINS_SPACES')
                        if (refreshToken.includes('\n')) tokenIssues.push('CONTAINS_NEWLINES')
                        if (refreshToken.startsWith('"') || refreshToken.endsWith('"'))
                            tokenIssues.push('QUOTED')
                        if (refreshToken.includes('undefined'))
                            tokenIssues.push('CONTAINS_UNDEFINED')
                        if (refreshToken.length < 10) tokenIssues.push('TOO_SHORT')
                        if (refreshToken.length > 2000) tokenIssues.push('TOO_LONG')

                        if (tokenIssues.length > 0) {
                            console.warn(
                                '⚠️ Express: Refresh token issues detected on reception:',
                                {
                                    issues: tokenIssues,
                                    tokenSample:
                                        refreshToken.substring(0, 20) +
                                        '...' +
                                        refreshToken.substring(-10),
                                    tokenBytes: new TextEncoder().encode(refreshToken).length
                                }
                            )
                        }

                        // Try to decode if JWT-like
                        if (refreshToken.includes('.')) {
                            try {
                                const parts = refreshToken.split('.')
                                if (parts.length >= 2) {
                                    const payload = JSON.parse(
                                        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
                                    )
                                    const now = Math.floor(Date.now() / 1000)

                                    console.log('🔍 Express: Received refresh token analysis:', {
                                        exp: payload.exp,
                                        iat: payload.iat,
                                        currentTime: now,
                                        isExpired: payload.exp ? payload.exp < now : 'UNKNOWN',
                                        expiresInSeconds: payload.exp
                                            ? payload.exp - now
                                            : 'UNKNOWN',
                                        expiresInHours: payload.exp
                                            ? ((payload.exp - now) / 3600).toFixed(2)
                                            : 'UNKNOWN',
                                        ageInHours: payload.iat
                                            ? ((now - payload.iat) / 3600).toFixed(2)
                                            : 'UNKNOWN',
                                        tokenSource: 'parent_page'
                                    })

                                    if (payload.exp && payload.exp < now) {
                                        console.error(
                                            '❌ Express: RECEIVED EXPIRED REFRESH TOKEN FROM PARENT!',
                                            {
                                                expiredSinceSeconds: now - payload.exp,
                                                expiredSinceHours: (
                                                    (now - payload.exp) /
                                                    3600
                                                ).toFixed(2)
                                            }
                                        )
                                    }
                                }
                            } catch (e) {
                                console.log(
                                    '🔍 Express: Could not decode received refresh token as JWT'
                                )
                            }
                        }
                    }

                    setAuthToken(authData.authToken)
                    setRefreshToken(authData.refreshToken)
                }

                // Handle token refresh needed messages (for debugging)
                if (type === 'TOKEN_REFRESH_NEEDED') {
                    console.log(
                        '🔄 Express: Token refresh needed message received (this should be handled by parent)'
                    )
                }
            }
        }

        // Add event listener
        window.addEventListener('message', handleMessage)
        console.log('👂 Express: Message listener added')

        // Request basket data from parent with a small delay to ensure listener is active
        setTimeout(() => {
            console.log('📤 Express: Requesting basket data from parent')
            console.log('🔍 Express: Context check:', {
                isIframe: window !== window.parent,
                parentExists: !!window.parent,
                locationOrigin: window.location.origin
                // Note: Cannot access parent origin due to cross-origin restrictions
            })
            window.parent.postMessage({type: 'basketDataRequested'}, '*')
            console.log('✅ Express: Basket data request sent')
        }, 200)

        // Cleanup event listener on unmount
        return () => {
            console.log('🧹 Express: Cleaning up message listener')
            window.removeEventListener('message', handleMessage)
        }
    }, [])

    // Prepare context data for express payment components
    const expressPaymentContext = {
        adyenPaymentMethods,
        authToken,
        refreshToken,
        updateTokens,
        tokenProvider: tokenProviderRef.current,
        locale,
        site,
        basket,
        sku: currentSku,
        quantity: currentQuantity,
        isPdpMode,
        manager
    }

    // Log context preparation
    useEffect(() => {
        console.log('📦 Express: Payment context prepared:', {
            hasAdyenPaymentMethods: !!adyenPaymentMethods,
            hasAuthToken: !!authToken,
            hasRefreshToken: !!refreshToken,
            hasTokenProvider: !!tokenProviderRef.current,
            tokenProviderId: tokenProviderRef.current?.providerId,
            tokenProviderUpdateCount: tokenProviderRef.current?.updateCount,
            tokenProviderReady,
            hasUpdateCallback: !!updateTokens,
            hasSite: !!site,
            hasBasket: !!basket,
            currentSku,
            isPdpMode,
            authTokenStart: authToken?.substring(0, 10) + '...',
            refreshTokenStart: refreshToken?.substring(0, 10) + '...',
            hookEnabled: !!(tokenProviderReady && tokenProviderRef.current && site && locale)
        })
    }, [
        adyenPaymentMethods,
        authToken,
        refreshToken,
        tokenProviderRef.current,
        tokenProviderReady,
        site,
        basket,
        currentSku,
        isPdpMode,
        locale
    ])

    return (
        <div className="express-payment-container">
            <div
                className={`express-payment-method ${
                    availableCount === 1
                        ? 'express-payment-method--single express-payment-method--no-margin'
                        : 'express-payment-method--multiple express-payment-method--with-margin'
                }`}
            >
                <ApplePayExpress {...expressPaymentContext} />
            </div>
            <div
                className={`express-payment-method ${
                    availableCount === 1
                        ? 'express-payment-method--single'
                        : 'express-payment-method--multiple'
                }`}
            >
                <GooglePayExpress {...expressPaymentContext} />
            </div>
        </div>
    )
}

export default Express
