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

    // Check for PDP mode flag in URL
    const urlParams = new URLSearchParams(location.search)
    const isPdpMode = urlParams.get('pdp') === 'true'

    // State to track current SKU, quantity, and currency (will be set via postMessage)
    const [currentSku, setCurrentSku] = useState(null)
    const [currentQuantity, setCurrentQuantity] = useState(1)
    const [currentCurrency, setCurrentCurrency] = useState(null)

    // Initialize the express payment manager - always call this hook
    const {manager, isDone, availableCount, managerError} = useExpressPaymentManager(PAYMENT_METHODS)

    // Fetch payment methods and environment data directly
    // Only call this hook when we have all required parameters to prevent hook ordering issues
    const {paymentMethods: adyenPaymentMethods} = useStandalonePaymentMethods(
        authToken || null, // Ensure we always pass a consistent value
        site || null, // Ensure we always pass a consistent value
        locale || null, // Ensure we always pass a consistent value
        !!(authToken && site && locale) // Only enable when all params are available
    )

    // Mark when payment methods are being fetched
    useEffect(() => {
        if (authToken && site && locale) {
            performance.mark('express-payment-methods-fetch-start')
            console.log('🚀 Express Payment: Starting payment methods fetch...')
            if (!isPdpMode) {
                console.log(`📦 Waiting for basket data: ${basket?.basketId ? 'available' : 'missing'}`)
            }
        }
    }, [authToken, site?.id, locale?.id, isPdpMode, basket?.basketId]) // Include basket status for non-PDP mode

    // PostMessage listener for SKU updates
    useEffect(() => {
        const handleMessage = (event) => {
            // Basic security check - accept messages from any origin for now
            // In production, you might want to restrict this to specific origins

            if (event.data && typeof event.data === 'object') {
                const {type, sku, quantity, currency} = event.data

                // Handle SKU update messages
                if (type === 'UPDATE_SKU' && typeof sku === 'string') {
                    console.log('💬💬💬 Express Payment: SKU update:', sku, 'currency:', currency)
                    setCurrentSku(sku)
                    // Always set quantity to 1 when SKU changes
                    setCurrentQuantity(1)

                    setCurrentCurrency('EUR') // HARD-SETTING THIS FOR NOW -- IT WILL COME FROM THE MESSAGE EVENTUALLY

                    // Update currency if provided
                    if (typeof currency === 'string') {
                        setCurrentCurrency(currency)
                    }
                }

                // Handle quantity update messages
                if (type === 'UPDATE_QUANTITY' && typeof quantity === 'number') {
                    console.log('💬💬💬 Express Payment: Quantity update:', quantity)
                    // Validate quantity is a positive integer with reasonable limits
                    const validatedQuantity = Math.max(1, Math.min(999, Math.floor(quantity)))
                    setCurrentQuantity(validatedQuantity)
                }

                // Handle SKU clear messages (for regular checkout)
                if (type === 'CLEAR_SKU') {
                    console.log('💬💬💬 Express Payment: Clear SKU')
                    setCurrentSku(null)
                    setCurrentQuantity(1) // Reset quantity when clearing
                }

                // Handle basket data messages
                if (type === 'basketDataAvailable') {
                    const {basketData, authData} = event.data.data

                    basketData.currency = 'EUR' // OVERWRITING THIS FOR NOW TO WHAT IT SHOULD BE -- COMPONENTS ARE PULLING THIS WRONG AND DEFAULTING TO USD
                    
                    console.log('💬💬💬 Express Payment: Basket data available:', basketData)
                    setAuthToken(authData.authToken)
                    setBasketData(basketData)
                }

                // Handle authentication data messages
                if (type === 'authDataAvailable') {
                    const authData = event.data.data.authData
                    console.log('💬💬💬 Express Payment: Auth data available:', authData)
                    setAuthToken(authData.authToken)
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
        locale,
        site,
        basket,
        sku: currentSku,
        quantity: currentQuantity,
        currency: currentCurrency,
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
