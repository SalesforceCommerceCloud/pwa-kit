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
        if (authToken && refreshToken && site) {
            if (!tokenProviderRef.current) {
                // Create new TokenProvider
                tokenProviderRef.current = new TokenProvider(
                    authToken,
                    refreshToken,
                    site,
                    updateTokens
                )
                setTokenProviderReady(true)
            } else {
                // Update existing TokenProvider
                tokenProviderRef.current.updateTokens(authToken, refreshToken)
                // TokenProvider is already ready, no need to set state again
            }
        } else {
            if (tokenProviderReady) {
                setTokenProviderReady(false)
            }
        }
    }, [authToken, refreshToken, site?.id])

    // Token update callback for child components
    const updateTokens = (newAuthToken, newRefreshToken) => {
        setAuthToken(newAuthToken)
        setRefreshToken(newRefreshToken)
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
        }
    }, [authToken, site?.id, locale?.id, isPdpMode, basket?.basketId]) // Include basket status for non-PDP mode

    // PostMessage listener for SKU updates
    useEffect(() => {
        const handleMessage = (event) => {
            // Basic security check - accept messages from any origin for now
            // In production, you might want to restrict this to specific origins

            if (event.data && typeof event.data === 'object') {
                const {type, sku, quantity} = event.data

                // Handle SKU update messages
                if (type === 'UPDATE_SKU' && typeof sku === 'string') {
                    setCurrentSku(sku)
                    // Always set quantity to 1 when SKU changes
                    setCurrentQuantity(1)
                }

                // Handle quantity update messages
                if (type === 'UPDATE_QUANTITY' && typeof quantity === 'number') {
                    // Validate quantity is a positive integer with reasonable limits
                    const validatedQuantity = Math.max(1, Math.min(999, Math.floor(quantity)))
                    setCurrentQuantity(validatedQuantity)
                }

                // Handle SKU clear messages (for regular checkout)
                if (type === 'CLEAR_SKU') {
                    setCurrentSku(null)
                    setCurrentQuantity(1) // Reset quantity when clearing
                }

                // Handle basket data messages
                if (type === 'basketDataAvailable') {
                    const {basketData, authData} = event.data.data
                    console.debug('Express: basket/auth data received', {
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
                    console.debug('Express: auth data received', {
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
                            console.debug('Express: refresh token issues detected', {tokenIssues})
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

                                    console.debug('Express: parsed refresh token JWT payload', {
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
                                        console.warn('Express: refresh token appears expired', {
                                            exp: payload.exp,
                                            now
                                        })
                                    }
                                }
                            } catch (e) {
                                console.debug('Express: failed to parse refresh token JWT', e)
                            }
                        }
                    }

                    setAuthToken(authData.authToken)
                    setRefreshToken(authData.refreshToken)
                }

                // Handle token refresh needed messages (for debugging)
                if (type === 'TOKEN_REFRESH_NEEDED') {
                    console.debug('Express: token refresh needed message received')
                }
            }
        }

        // Add event listener
        window.addEventListener('message', handleMessage)

        // Request basket data from parent with a small delay to ensure listener is active
        setTimeout(() => {
            window.parent.postMessage({type: 'basketDataRequested'}, '*')
        }, 200)

        // Cleanup event listener on unmount
        return () => {
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
