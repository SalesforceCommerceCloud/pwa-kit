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

    // Check for PDP mode flag in URL
    const urlParams = new URLSearchParams(location.search)
    const isPdpMode = urlParams.get('pdp') === 'true'

    // State to track current SKU and quantity (will be set via postMessage)
    const [currentSku, setCurrentSku] = useState(null)
    const [currentQuantity, setCurrentQuantity] = useState(1)

    // Initialize the express payment manager - always call this hook
    const {manager, managerError} = useExpressPaymentManager(PAYMENT_METHODS)

    // Fetch payment methods and environment data directly
    // Only call this hook when we have all required parameters to prevent hook ordering issues
    const {paymentMethods: adyenPaymentMethods} = useStandalonePaymentMethods(
        authToken || null, // Ensure we always pass a consistent value
        site || null, // Ensure we always pass a consistent value
        locale || null, // Ensure we always pass a consistent value
        !!(authToken && site && locale) // Only enable when all params are available
    )

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
                    setAuthToken(authData.authToken)
                    setBasketData(basketData)
                }

                // Handle authentication data messages
                if (type === 'authDataAvailable') {
                    const authData = event.data.data.authData
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
        isPdpMode,
        manager
    }

    // NOW check for early return conditions - after all hooks have been called
    if (!authToken || managerError) {
        // Do not render express payment components if there is no auth token
        // or if there was an error setting up the manager
        return null
    }

    // Determine if we should render based on mode and requirements
    let shouldRender = false

    if (isPdpMode) {
        // In PDP mode, render if we have basic requirements (authToken, payment methods)
        // Basket will be created dynamically when needed
        shouldRender = !!(authToken && adyenPaymentMethods)
    } else {
        // In checkout mode, render if we have a basket
        shouldRender = !!(authToken && basket)
    }

    if (!shouldRender) {
        return null
    }

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
