/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {useLocation} from 'react-router-dom'

import {AdyenExpressCheckoutProvider} from '@adyen/adyen-salesforce-pwa'

import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useExpressPaymentManager} from '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-manager'

// Define the payment methods we will attempt to load
const PAYMENT_METHODS = ['applepay', 'googlepay']

function Express() {
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const [basket, setBasketData] = useState(null)
    const location = useLocation()

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

    // PostMessage listener for SKU updates
    useEffect(() => {
        const handleMessage = (event) => {
            // Basic security check - accept messages from any origin for now
            // In production, you might want to restrict this to specific origins

            if (event.data && typeof event.data === 'object') {
                const {type, sku} = event.data

                // Handle SKU update messages
                if (type === 'UPDATE_SKU' && typeof sku === 'string') {
                    setCurrentSku(sku)
                    // Always set quantity to 1 when SKU changes
                    setCurrentQuantity(1)
                }

                // Handle SKU clear messages (for regular checkout)
                if (type === 'CLEAR_SKU') {
                    setCurrentSku(null)
                    setCurrentQuantity(1) // Reset quantity when clearing
                }

                // Handle basket data messages
                if (type === 'basketDataAvailable') {
                    const authData = event.data.data.authData
                    setAuthToken(authData.authToken)
                    setCustomerId(authData.customerId)
                    const basketData = event.data.data.basketData
                    // Store values in localStorage
                    setBasketData(basketData)
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

    if (!authToken || managerError) {
        // Do not render express payment components if there is no auth token
        // or if there was an error setting up the manager
        return null
    }

    return (
        <div>
            {!isPdpMode && basket && (
                <AdyenExpressCheckoutProvider
                    authToken={authToken}
                    customerId={customerId}
                    locale={locale}
                    site={site}
                    basket={basket}
                    navigate={navigate}
                >
                    <ApplePayExpress
                        sku={currentSku}
                        quantity={currentQuantity}
                        isPdpMode={isPdpMode}
                        basketData={basket}
                        authToken={authToken}
                        manager={manager}
                    />
                    <GooglePayExpress manager={manager} overrideData={{authToken, basket}} />
                </AdyenExpressCheckoutProvider>
            )}
            {isPdpMode && (
                <ApplePayExpress
                    sku={currentSku}
                    quantity={currentQuantity}
                    isPdpMode={isPdpMode}
                    basketData={basket}
                    authToken={authToken}
                />
            )}
        </div>
    )
}

export default Express
