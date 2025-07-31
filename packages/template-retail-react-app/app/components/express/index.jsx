/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'

import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import {AdyenExpressCheckoutProvider} from '@adyen/adyen-salesforce-pwa'

import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useBasketWithCustomerId} from '@salesforce/retail-react-app/app/hooks/use-basket-with-customer-id'

function Express() {
    const {getTokenWhenReady} = useAccessToken()
    const customerId = useCustomerId()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const {data: basket} = useCurrentBasket()
    const [authToken, setAuthToken] = useState()
    const [parentCustomerId, setParentCustomerId] = useState(null)
    const [parentBasketId, setParentBasketId] = useState(null)

    useEffect(() => {
        const getToken = async () => {
            const token = await getTokenWhenReady()
            setAuthToken(token)
        }

        getToken()
    }, [])

    // Listen for customer ID from parent
    useEffect(() => {
        console.log('iframe basket??', basket)

        const handleMessage = (event) => {
            console.log('===received an event===', event)
            if (event?.data?.type === 'express.customer.id') {
                console.log('===received get customer id -- event.data===', event.data)
                const receivedCustomerId = event.data.customerId
                if (receivedCustomerId) {
                    console.log('===Received customer ID from parent===', receivedCustomerId)
                    setParentCustomerId(receivedCustomerId)
                }
                const receivedBasketId = event.data.actualBasketId
                if (receivedBasketId) {
                    console.log('===Received basket ID from parent===', receivedBasketId)
                    setParentBasketId(receivedBasketId)
                }
            }
        }

        window.addEventListener('message', handleMessage)

        const retryInterval = setInterval(() => {
            var retryCount = 0
            if (retryCount < 10) {
                window.parent.postMessage({type: 'express.get.customer.id', siteId: site.id}, '*')
                console.log('===sent get customer id -- window.parent.postMessage===')
                retryCount++
            }
            clearInterval(retryInterval)
        }, 500)

        const intervalId = retryInterval

        return () => {
            window.removeEventListener('message', handleMessage)
            clearInterval(intervalId)
        }
    }, [])

    const {data: parentBasket} = useBasketWithCustomerId(
        {
            customerId: parentCustomerId,
            id: parentBasketId
        },
        {enabled: !!parentCustomerId}
    )

    // Use parent's customer ID if available, otherwise use iframe's (needed for Chrome support)
    const finalCustomerId = parentCustomerId || customerId
    const finalBasket = basket || parentBasket
    console.log('===finalCustomerId===', finalCustomerId)
    console.log('===final basket passed to adyen===', finalBasket)

    if (!authToken) {
        return null
    }

    return (
        <div>
            <AdyenExpressCheckoutProvider
                authToken={authToken}
                customerId={finalCustomerId}
                locale={locale}
                site={site}
                basket={finalBasket}
                navigate={navigate}
            >
                {/* <ApplePayExpress /> */}
                <GooglePayExpress />
            </AdyenExpressCheckoutProvider>
        </div>
    )
}

export default Express
