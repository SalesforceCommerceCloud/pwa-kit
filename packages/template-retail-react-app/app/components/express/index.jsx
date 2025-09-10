/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {useLocation} from 'react-router-dom'

import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useExpressPaymentManager} from '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-manager'
import {useStandalonePaymentMethods} from '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods'
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

    // Token update callback for child components
    const updateTokens = (newAuthToken, newRefreshToken) => {
        console.log('🔄 Express: Updating tokens via callback:', {
            hasNewAuthToken: !!newAuthToken,
            hasNewRefreshToken: !!newRefreshToken,
            newAuthTokenLength: newAuthToken?.length || 0,
            newRefreshTokenLength: newRefreshToken?.length || 0,
            oldAuthTokenLength: authToken?.length || 0,
            oldRefreshTokenLength: refreshToken?.length || 0
        })
        setAuthToken(newAuthToken)
        setRefreshToken(newRefreshToken)
        console.log('✅ Express: Tokens updated successfully')
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
        authToken || null, // Ensure we always pass a consistent value
        refreshToken || null, // Ensure we always pass a consistent value
        site || null, // Ensure we always pass a consistent value
        locale || null, // Ensure we always pass a consistent value
        !!(authToken && site && locale), // Only enable when all params are available
        updateTokens // Pass token update callback
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
                        authTokenLength: authData?.authToken?.length || 0
                    })
                    setAuthToken(authData.authToken)
                    setRefreshToken(authData.refreshToken)
                    setBasketData(basketData)
                }

                // Handle authentication data messages
                if (type === 'authDataAvailable') {
                    const authData = event.data.data.authData
                    console.log('🔐 Express: Received auth data:', {
                        hasAuthToken: !!authData?.authToken,
                        hasRefreshToken: !!authData?.refreshToken,
                        authTokenLength: authData?.authToken?.length || 0,
                        refreshTokenLength: authData?.refreshToken?.length || 0
                    })
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
