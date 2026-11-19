/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import {useLocation} from 'react-router-dom'
import {
    useAccessToken,
    useCommerceApi,
    useCustomerId,
    useCustomerType,
    useUsid
} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import SFPaymentsExpressButtons from '@salesforce/retail-react-app/app/components/sf-payments-express-buttons'
import {
    EXPRESS_PAY_NOW,
    useExpressCheckoutEnabled
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {CART_CHANGED_EVENT} from '@salesforce/retail-react-app/app/utils/commerce-client-cart'
import {
    readWalletLaunch,
    removeWalletLaunch,
    validateWalletLaunch
} from '@salesforce/retail-react-app/app/utils/commerce-client-wallet'
import {expressPaymentProviderPropTypes} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract'

const SalesforceExpressPaymentProvider = ({context, lifecycle}) => {
    const {search} = useLocation()
    const launchId = new URLSearchParams(search).get('launch')
    const customerId = useCustomerId()
    const {customerType} = useCustomerType()
    const {usid} = useUsid()
    const {site, locale} = useMultiSite()
    const {currency} = useCurrency()
    const identity = JSON.stringify([
        site?.id,
        locale?.id,
        currency,
        customerId,
        customerType,
        usid
    ])
    const api = useCommerceApi()
    const {getTokenWhenReady} = useAccessToken()
    const {cart: walletEnabled} = useExpressCheckoutEnabled()
    const settings = getConfig()?.app?.commerceAgent
    const enabled =
        settings?.cc_cartTransport === 'direct' &&
        settings?.cc_expressCheckoutEnabled === 'true' &&
        walletEnabled &&
        context.surface === 'cart'
    const [basket, setBasket] = useState(null)
    const latest = useRef()
    latest.current = {identity, customerId, api, getTokenWhenReady, lifecycle}
    const finishedRef = useRef(false)

    const readLiveBasket = async ({checkVersion = true} = {}) => {
        const session = latest.current
        const launch = readWalletLaunch(launchId)
        if (!launch || launch.identity !== session.identity || !session.customerId)
            throw new Error('Open View Cart to refresh express checkout.')
        const token = await session.getTokenWhenReady()
        const headers = {Authorization: `Bearer ${token}`}
        const baskets = await session.api.shopperCustomers.getCustomerBaskets({
            parameters: {customerId: session.customerId},
            headers
        })
        const active = baskets.baskets?.find((entry) => !entry.temporaryBasket)
        if (active?.basketId !== launch.basketId)
            throw new Error('Your cart changed. Open View Cart again.')
        const live = await session.api.shopperBasketsV2.getBasket({
            parameters: {basketId: active.basketId},
            headers
        })
        if (latest.current.identity !== session.identity || !readWalletLaunch(launchId))
            throw new Error('Your shopper session changed.')
        return validateWalletLaunch({
            launch,
            identity: session.identity,
            basket: live,
            checkVersion
        })
    }
    const readLiveRef = useRef()
    readLiveRef.current = readLiveBasket

    const refreshParent = () => {
        // Only the same-origin Payments-Express shell can reach the parent DOM.
        try {
            window.parent.dispatchEvent(new window.parent.CustomEvent(CART_CHANGED_EVENT))
        } catch (error) {
            /* The shell also validates parentOrigin before mounting. */
        }
    }
    const handleResult = ({status, orderId}) => {
        if (finishedRef.current) return
        finishedRef.current = true
        removeWalletLaunch(launchId)
        if (status === 'success' && orderId) latest.current.lifecycle.success({orderId})
        else if (status === 'cancel') latest.current.lifecycle.cancel()
        else
            latest.current.lifecycle.failure({
                shopperMessage: 'Open View Cart to check your basket before trying again.'
            })
        refreshParent()
        setBasket(null)
    }

    useEffect(() => {
        let active = true
        setBasket(null)
        if (!enabled) {
            lifecycle.unavailable()
            return undefined
        }
        finishedRef.current = false
        readLiveRef
            .current()
            .then((live) => {
                if (active) setBasket(live)
            })
            .catch(() => {
                if (active) lifecycle.unavailable()
            })
        return () => {
            active = false
        }
    }, [enabled, identity, launchId, lifecycle])

    if (!basket || !enabled) return null

    return (
        <SFPaymentsExpressButtons
            usage={EXPRESS_PAY_NOW}
            paymentCurrency={basket.currency}
            paymentCountryCode={basket.billingAddress?.countryCode}
            initialAmount={basket.orderTotal}
            walletsOnly
            prepareBasket={async () => {
                try {
                    return await readLiveRef.current()
                } catch (error) {
                    handleResult({status: 'failure'})
                    throw error
                }
            }}
            beforeExpressPayment={async (expected) => {
                try {
                    const live = await readLiveRef.current({checkVersion: false})
                    // Wallet address/shipping callbacks may legitimately update the
                    // quote. Compare against their latest returned basket, not the
                    // original launch total, before preparing a payment or order.
                    if (
                        !expected ||
                        live.orderTotal !== expected.orderTotal ||
                        live.currency !== expected.currency ||
                        JSON.stringify(live.productItems) !== JSON.stringify(expected.productItems)
                    ) {
                        throw new Error('The payable total changed. Open View Cart again.')
                    }
                    return live
                } catch (error) {
                    handleResult({status: 'failure'})
                    throw error
                }
            }}
            onPaymentMethodsRendered={({rendered = []} = {}) => {
                if (rendered.length) lifecycle.available()
                else lifecycle.unavailable()
            }}
            onExpressPaymentResult={handleResult}
        />
    )
}
SalesforceExpressPaymentProvider.propTypes = expressPaymentProviderPropTypes
export default SalesforceExpressPaymentProvider
