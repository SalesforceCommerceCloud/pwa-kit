/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/api/adyen/utils/parsers.js'
import {BLOCKED_PAYMENT_METHODS} from '@salesforce/retail-react-app/app/api/adyen/utils/constants.js'
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import AdyenCheckoutConfig from '@salesforce/retail-react-app/app/api/adyen/api/controllers/checkout-config'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'
import {v4 as uuidv4} from 'uuid'
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'
import {getApplicationInfo} from '@salesforce/retail-react-app/app/api/adyen/utils/getApplicationInfo.js'

const errorMessages = {
    UNAUTHORIZED: 'unauthorized',
    INVALID_BASKET: 'invalid basket',
    NO_PAYMENT_METHODS: 'no payment methods'
}

async function getPaymentMethods(req, res, next) {
    Logger.info('getPaymentMethods', 'start')

    try {
        const {siteId} = req.query

        const checkout = AdyenCheckoutConfig.getInstance(siteId)
        const adyenConfig = getAdyenConfigForCurrentSite(siteId)

        const {app: appConfig} = getConfig()
        const shopperCustomers = new ShopperCustomers({
            ...appConfig.commerceAPI,
            headers: {authorization: req.headers.authorization}
        })

        const customer = await shopperCustomers.getCustomer({
            parameters: {
                customerId: req.headers.customerid
            }
        })

        if (!customer?.customerId) {
            throw new AdyenError(errorMessages.UNAUTHORIZED, 401)
        }

        const {baskets} = await shopperCustomers.getCustomerBaskets({
            parameters: {
                customerId: customer?.customerId
            }
        })

        if (!baskets?.length) {
            throw new AdyenError(errorMessages.INVALID_BASKET, 404)
        }

        const [{orderTotal, productTotal, currency}] = baskets
        const {locale: shopperLocale} = req.query
        const countryCode = shopperLocale?.slice(-2)

        const paymentMethodsRequest = {
            blockedPaymentMethods: BLOCKED_PAYMENT_METHODS,
            shopperLocale,
            countryCode,
            merchantAccount: adyenConfig.merchantAccount,
            amount: {
                value: getCurrencyValueForApi(orderTotal || productTotal, currency),
                currency: currency
            }
        }

        if (customer?.authType === 'registered') {
            paymentMethodsRequest.shopperReference = customer.customerId
        }

        const response = await checkout.paymentMethods(paymentMethodsRequest, {
            idempotencyKey: uuidv4()
        })

        if (!response?.paymentMethods?.length) {
            throw new AdyenError(errorMessages.NO_PAYMENT_METHODS, 400)
        }

        Logger.info('getPaymentMethods', 'success')
        res.locals.response = {
            ...response,
            applicationInfo: getApplicationInfo(adyenConfig.systemIntegratorName)
        }
        next()
    } catch (err) {
        Logger.error('getPaymentMethods', JSON.stringify(err))
        next(err)
    }
}

export default getPaymentMethods
