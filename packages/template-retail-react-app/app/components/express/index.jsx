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
    const [customerId, setCustomerId] = useState()

    // Check for PDP mode flag in URL
    const urlParams = new URLSearchParams(location.search)
    const isPdpMode = urlParams.get('pdp') === 'true'

    // State to track current SKU and quantity (will be set via postMessage)
    const [currentSku, setCurrentSku] = useState(null)
    const [currentQuantity, setCurrentQuantity] = useState(1)

    // Initialize the express payment manager
    const {manager, managerError} = useExpressPaymentManager(PAYMENT_METHODS)

    // Fetch payment methods and environment data directly
    const {
        paymentMethods: adyenPaymentMethods,
        loading: paymentMethodsLoading,
        error: paymentMethodsError
    } = useStandalonePaymentMethods(authToken, site, locale, !!authToken)

    // Prepare context data for express payment components
    const expressPaymentContext = {
        adyenPaymentMethods,
        authToken,
        locale,
        site,
        basket,
        sku: currentSku,
        quantity: currentQuantity,
        isPdpMode,
        manager
    }

    // PostMessage listener for SKU updates
    useEffect(() => {
        const handleMessage = (event) => {
            // Basic security check - accept messages from any origin for now
            // In production, you might want to restrict this to specific origins

            if (event.data && typeof event.data === 'object') {
                const {type, sku, quantity} = event.data

                // Log all incoming messages for debugging
                console.log('[Express] Received message:', event.data)

                // Handle SKU update messages
                if (type === 'UPDATE_SKU' && typeof sku === 'string') {
                    console.log('[Express] Updating SKU:', sku)
                    setCurrentSku(sku)
                    // Always set quantity to 1 when SKU changes
                    setCurrentQuantity(1)
                }

                // Handle quantity update messages
                if (type === 'UPDATE_QUANTITY' && typeof quantity === 'number') {
                    console.log('[Express] Updating quantity:', quantity)
                    // Validate quantity is a positive integer with reasonable limits
                    const validatedQuantity = Math.max(1, Math.min(999, Math.floor(quantity)))
                    setCurrentQuantity(validatedQuantity)
                }

                // Handle SKU clear messages (for regular checkout)
                if (type === 'CLEAR_SKU') {
                    console.log('[Express] Clearing SKU')
                    setCurrentSku(null)
                    setCurrentQuantity(1) // Reset quantity when clearing
                }

                // Handle basket data messages
                if (type === 'basketDataAvailable') {
                    const {basketData, authData} = event.data.data
                    console.log('[Express] Received basket data:', {basketData, authData})
                    setAuthToken(authData.authToken)
                    setCustomerId(authData.customerId)
                    setBasketData(basketData)
                }

                // Handle authentication data messages
                if (type === 'authDataAvailable') {
                    const authData = event.data.data.authData
                    console.log('[Express] Received auth data:', authData)
                    setAuthToken(authData.authToken)
                    setCustomerId(authData.customerId)
                }
            }
        }

        // Add event listener
        window.addEventListener('message', handleMessage)

        // Request basket data from parent with a small delay to ensure listener is active
        setTimeout(() => {
            console.log('[Express] Requesting basket data from parent')
            window.parent.postMessage({type: 'basketDataRequested'}, '*')
        }, 200)

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [])

    if (!authToken || managerError) {
        // Do not render express payment components if there is no auth token
        // or if there was an error setting up the manager
        console.log('[Express] Not rendering - authToken:', !!authToken, 'managerError:', !!managerError)
        return null
    }

    // Add comprehensive logging for debugging
    console.log('[Express] Render state:', {
        isPdpMode,
        basket: !!basket,
        basketData: basket,
        authToken: !!authToken,
        customerId,
        currentSku,
        currentQuantity,
        manager: !!manager,
        managerError,
        adyenEnvironment,
        adyenPaymentMethods: !!adyenPaymentMethods,
        paymentMethodsLoading,
        paymentMethodsError
    })

    // Log the conditional logic
    console.log('[Express] Conditional check (!isPdpMode && basket):', {
        '!isPdpMode': !isPdpMode,
        'basket': !!basket,
        'result': !isPdpMode && basket
    })

    return (
        <div>
            <div style={{marginBottom: '8px'}}>
                <ApplePayExpress {...expressPaymentContext} />
            </div>
            <GooglePayExpress {...expressPaymentContext} />
        </div>
    )
}

export default Express
