/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {useLocation} from 'react-router-dom'

import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import {AdyenExpressCheckoutProvider} from '@adyen/adyen-salesforce-pwa'

import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

function Express() {
    //const {getTokenWhenReady} = useAccessToken()
    const customerId = useCustomerId()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const [basket, setBasketData] = useState(null)
    const location = useLocation()

    const [authToken, setAuthToken] = useState()
    const [finalCustomerId, setFinalCustomerId] = useState()

    // Check for PDP mode flag in URL
    const urlParams = new URLSearchParams(location.search)
    const isPdpMode = urlParams.get('pdp') === 'true'

    // State to track current SKU and quantity (will be set via postMessage)
    const [currentSku, setCurrentSku] = useState(null)
    const [currentQuantity, setCurrentQuantity] = useState(1)

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
                    console.log('==basketDataAvailable==', event)
                    const authData = event.data.data.authData
                    setAuthToken(authData.authToken)
                    setFinalCustomerId(authData.customerId)
                    const basketData = event.data.data.basketData
                    // Store values in localStorage
                    window.localStorage.setItem('access_token_RefArch', authData.authToken)
                    window.localStorage.setItem('123access_token_RefArch', authData.authToken)
                    window.localStorage.setItem('customer_id_RefArch', authData.customerId)
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

    // useEffect(() => {
    //     const getToken = async () => {
    //         const token = await getTokenWhenReady()
    //         setAuthToken(token)
    //         console.log('set auth token using local storage')
    //     }

    //     getToken()
    // }, [])

    if (!authToken) {
        return null
    }

    console.log('==authToken sent to adyen==', authToken)
    console.log('==customerId==', customerId)
    console.log('==finalCustomerId sent to adyen==', finalCustomerId)
    console.log('==basket sent to adyen==', basket)

    return (
        <div>
            <AdyenExpressCheckoutProvider
                authToken={authToken}
                customerId={finalCustomerId}
                locale={locale}
                site={site}
                basket={basket}
                navigate={navigate}
            >
                {/*<ApplePayExpress sku={currentSku} quantity={currentQuantity} isPdpMode={isPdpMode} />*/}
                <GooglePayExpress authToken={authToken} basket={basket} />
            </AdyenExpressCheckoutProvider>
        </div>
    )
}

export default Express
