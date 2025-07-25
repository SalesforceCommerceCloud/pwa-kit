/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState, useRef} from 'react'

import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import {AdyenExpressCheckoutProvider} from '@adyen/adyen-salesforce-pwa'

import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

function Express() {
    const {getTokenWhenReady} = useAccessToken()
    const customerId = useCustomerId()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const [basket, setBasketData] = useState(null)
    const [authToken, setAuthToken] = useState()
    const [basketDataReceived, setBasketDataReceived] = useState(false)
    const retryCountRef = useRef(0)
    const retryIntervalRef = useRef(null)
    const customerIdStartTimeRef = useRef(performance.now())

    useEffect(() => {
        console.log('🔑 Starting to get auth token...')

        // Log customer ID timing when it becomes available
        if (customerId !== undefined) {
            const customerIdEndTime = performance.now()
            const customerIdDuration = customerIdEndTime - customerIdStartTimeRef.current
            console.log(
                `👤 Customer ID received in ${customerIdDuration.toFixed(2)}ms:`,
                customerId ? `ID: ${customerId}` : 'No customer ID (guest user)'
            )
        }

        const getToken = async () => {
            const startTime = performance.now()
            try {
                console.log('🔑 Calling getTokenWhenReady()...')
                const token = await getTokenWhenReady()
                const endTime = performance.now()
                const duration = endTime - startTime
                console.log(
                    `🔑 Auth token received in ${duration.toFixed(2)}ms:`,
                    !!token,
                    'Token length:',
                    token?.length
                )
                setAuthToken(token)
            } catch (error) {
                const endTime = performance.now()
                const duration = endTime - startTime
                console.error(`🔑 Error getting auth token after ${duration.toFixed(2)}ms:`, error)
            }
        }

        getToken()
    }, [])

    useEffect(() => {
        const handleMessage = (event) => {
            console.log('📨 Received postMessage:', event.data)

            if (event.data?.type === 'basketDataAvailable') {
                const basketData = event.data.data

                // Set the basket data from the postMessage
                setBasketData(basketData)
                setBasketDataReceived(true)

                // Clear the retry interval since we received the data
                clearInterval(retryIntervalRef.current)
                retryIntervalRef.current = null
                console.log('Stopped retry interval - data received')
            }
        }

        window.addEventListener('message', handleMessage)

        // Request basket data from parent with a small delay to ensure listener is active
        setTimeout(() => {
            console.log('📤 Requesting basket data from parent...')
            window.parent.postMessage({type: 'basketDataRequested'}, '*')
        }, 200)

        // Retry basket data up to 10 times with 500ms delays
        retryIntervalRef.current = setInterval(() => {
            if (retryCountRef.current < 10) {
                console.log(
                    `⏰ Retrying basket data request... (attempt ${retryCountRef.current + 1}/10)`
                )
                window.parent.postMessage({type: 'basketDataRequested'}, '*')
                retryCountRef.current++
            } else {
                console.log('❌ Max retry attempts reached')
                clearInterval(retryIntervalRef.current)
            }
        }, 500)

        return () => {
            console.log('🧹 Cleaning up postMessage listeners')
            window.removeEventListener('message', handleMessage)
            clearInterval(retryIntervalRef.current)
        }
    }, [])

    return (
        <div>
            <AdyenExpressCheckoutProvider
                authToken={authToken}
                customerId={customerId}
                locale={locale}
                site={site}
                navigate={navigate}
            >
                {basket && basketDataReceived && <ApplePayExpress basket={basket} />}
                {/*<GooglePayExpress />*/}
            </AdyenExpressCheckoutProvider>
        </div>
    )
}

export default Express
