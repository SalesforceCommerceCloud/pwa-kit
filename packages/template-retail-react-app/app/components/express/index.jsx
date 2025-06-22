/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState, Suspense} from 'react'

import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import {ApplePayExpressWithSuspense} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

// Dynamic import for AdyenExpressCheckoutProvider
const AdyenExpressCheckoutProvider = React.lazy(() => import('@adyen/adyen-salesforce-pwa').then(module => ({default: module.AdyenExpressCheckoutProvider})))

function Express() {
    const {getTokenWhenReady} = useAccessToken()
    const customerId = useCustomerId()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()
    const {data: basket} = useCurrentBasket()

    const [authToken, setAuthToken] = useState()

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
            <Suspense fallback={<div>Loading AdyenExpressCheckoutProvider...</div>}>
                <AdyenExpressCheckoutProvider
                    authToken={authToken}
                    customerId={customerId}
                    locale={locale}
                    site={site}
                    basket={basket}
                    navigate={navigate}
                >
                    <ApplePayExpressWithSuspense />
                </AdyenExpressCheckoutProvider>
            </Suspense>
        </div>
    )
}

export default Express
