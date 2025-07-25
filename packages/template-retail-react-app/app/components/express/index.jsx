/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'

import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import {AdyenExpressCheckoutProvider} from '@adyen/adyen-salesforce-pwa'
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

function Express() {
    const {getTokenWhenReady} = useAccessToken()
    const customerId = useCustomerId()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const {data: basket} = useCurrentBasket()

    const [authToken, setAuthToken] = useState()

    useEffect(() => {
        /*
        const getCorrectCustomerId = () => {
            try {
                console.log("723 - getCorrectCustomerId start")
                // Check if we're in an iframe
                if (window !== window.top) {
                    console.log("723 - in iframe")
                    console.log("723 - window: ", window)
                    console.log("723 - window.parent: ", window.parent)
                
                    // Access parent window's localStorage
                    const parentStorageKey = `customer_id_${site.id}`
                    const parentCustomerId = window.parent.localStorage.getItem(parentStorageKey)
                    
                    console.log("723 - Parent customer ID:", parentCustomerId)
                    console.log("723 - Current customer ID:", customerId)
                    
                    if (parentCustomerId && parentCustomerId !== customerId) {
                        console.log("723 - Using parent window's customer ID")
                        setCorrectCustomerId(parentCustomerId)
                        
                        // Update current localStorage to match
                        localStorage.setItem(parentStorageKey, parentCustomerId)
                        return parentCustomerId
                    }
                }
                else {
                    console.log("723 - not in iframe")
                }
                
                // If not in iframe, try to find the correct customer ID in current storage
                const allKeys = Object.keys(localStorage)
                const customerIdKeys = allKeys.filter(key => key.includes('customer_id'))
                
                console.log("723 - All customer ID keys:", customerIdKeys)
                
                // Look for the customer ID that has associated basket data
                for (const key of customerIdKeys) {
                    const potentialCustomerId = localStorage.getItem(key)
                    console.log(`723 - Checking ${key}:`, potentialCustomerId)
                    
                    // You could also check for other indicators like access_token
                    const accessTokenKey = key.replace('customer_id', 'access_token')
                    const hasAccessToken = localStorage.getItem(accessTokenKey)
                    
                    if (hasAccessToken) {
                        console.log(`723 - Found customer ID with access token: ${potentialCustomerId}`)
                        setCorrectCustomerId(potentialCustomerId)
                        return potentialCustomerId
                    }
                }
                
                return customerId
            } catch (error) {
                console.error("723 - Error accessing parent window:", error)
                return customerId
            }
        }
        
        const correctId = getCorrectCustomerId()
        console.log("723 - Final customer ID to use:", correctId)
        */

        const getToken = async () => {
            const token = await getTokenWhenReady()
            setAuthToken(token)
        }

        getToken()
    }, [])

    if (!authToken) {
        return null
    }

    return (
        <div>
            <AdyenExpressCheckoutProvider
                authToken={authToken}
                customerId={customerId}
                locale={locale}
                site={site}
                basket={basket}
                navigate={navigate}
            >
                {/* <ApplePayExpress /> */}
                <GooglePayExpress />
            </AdyenExpressCheckoutProvider>
        </div>
    )
}

export default Express
