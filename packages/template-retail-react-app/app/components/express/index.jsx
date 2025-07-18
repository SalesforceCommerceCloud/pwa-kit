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
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

function Express() {
    const {getTokenWhenReady} = useAccessToken()
    const customerId = useCustomerId()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const {data: basket} = useCurrentBasket()
    const location = useLocation()

    const [authToken, setAuthToken] = useState()

    // Extract SKU from URL parameters for "Buy Now" flow
    const urlParams = new URLSearchParams(location.search)
    const sku = urlParams.get('sku') || urlParams.get('productId')

    useEffect(() => {
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
            {sku ? (
                // "Buy Now" mode - use ApplePayExpress directly without the provider
                // This prevents the regular Adyen APIs from being called
                <ApplePayExpress sku={sku} />
            ) : (
                // Regular mode - use the full Adyen provider
                <AdyenExpressCheckoutProvider
                    authToken={authToken}
                    customerId={customerId}
                    locale={locale}
                    site={site}
                    basket={basket}
                    navigate={navigate}
                >
                    <ApplePayExpress />
                </AdyenExpressCheckoutProvider>
            )}
        </div>
    )
}

export default Express
