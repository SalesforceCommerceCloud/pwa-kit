/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {
    AdyenCheckout,
    AdyenProvider
} from '@salesforce/retail-react-app/app/components/adyen-provider'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

const AdyenCheckoutRedirectContainer = () => {
    const {data: basket} = useCurrentBasket()
    const customerId = useCustomerId()
    const {getTokenWhenReady} = useAccessToken()
    const navigate = useNavigation()
    const {locale, site} = useMultiSite()

    const [authToken, setAuthToken] = useState()

    useEffect(() => {
        const getToken = async () => {
            const token = await getTokenWhenReady()
            setAuthToken(token)
        }

        getToken()
    }, [getTokenWhenReady])

    if (!authToken || !basket) {
        return null
    }

    return (
        <div className="adyen-checkout-redirect">
            <AdyenProvider
                authToken={authToken}
                customerId={customerId}
                locale={locale}
                site={site}
                basket={basket}
                navigate={navigate}
            >
                <AdyenCheckout showLoading />
            </AdyenProvider>
        </div>
    )
}

export default AdyenCheckoutRedirectContainer
