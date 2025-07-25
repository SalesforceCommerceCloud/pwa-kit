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
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

function Express() {
    const {getTokenWhenReady} = useAccessToken()
    const customerId = useCustomerId()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const [basketData, setBasketData] = useState(null)
    const [authToken, setAuthToken] = useState()

    useEffect(() => {
        const getToken = async () => {
            const token = await getTokenWhenReady()
            setAuthToken(token)
        }

        getToken()
    }, [])

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'BASKET_DATA') {
                const {data} = event.data
                console.log('Received BASKET_DATA:', {
                    amount: data.amount,
                    currencyCode: data.currencyCode,
                    id: data.id,
                    customerId: data.customerId,
                    isCartSummary: data.isCartSummary,
                    items: data.items
                })

                setBasketData(data)
            }
        }

        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
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
                navigate={navigate}
            >
                <ApplePayExpress basketData={basketData} />
            </AdyenExpressCheckoutProvider>
        </div>
    )
}

export default Express
