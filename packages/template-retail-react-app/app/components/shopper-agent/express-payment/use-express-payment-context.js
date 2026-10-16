/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'

import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useExpressPaymentBasket from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/use-express-payment-basket'

export const EXPRESS_PAYMENT_CONTEXT_VERSION = 1

const PRODUCT_ROUTE_RE = /\/Payments-ExpressProduct\/?$/

const parseQuantity = (value) => {
    if (value === null || value === '') return 1
    const quantity = Number(value)
    return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null
}

/**
 * Builds the stable, provider-neutral launch context. Commerce resources such as
 * baskets, payment instruments, and orders remain provider-owned and are accessed
 * through supported Commerce SDK hooks or optional neutral helpers.
 */
export const buildExpressPaymentContext = ({
    pathname,
    search,
    siteId,
    locale,
    currency,
    basketId,
    basketStatus = 'loading'
}) => {
    const query = new URLSearchParams(search)
    const isProductSurface = PRODUCT_ROUTE_RE.test(pathname)

    if (!isProductSurface) {
        return {
            context: {
                contractVersion: EXPRESS_PAYMENT_CONTEXT_VERSION,
                surface: 'cart',
                siteId,
                locale,
                currency,
                basket: {
                    id: basketId || null,
                    status: basketStatus
                }
            },
            isValid: true
        }
    }

    const productId = (query.get('pid') || query.get('productId') || query.get('sku') || '').trim()
    const quantity = parseQuantity(query.get('quantity'))

    return {
        context: {
            contractVersion: EXPRESS_PAYMENT_CONTEXT_VERSION,
            surface: 'product',
            siteId,
            locale,
            currency,
            productId,
            quantity: quantity || 0
        },
        isValid: Boolean(productId && quantity)
    }
}

const useExpressPaymentContext = ({resolveBasket = true} = {}) => {
    const location = useLocation()
    const {site, locale} = useMultiSite()
    const {currency} = useCurrency()
    const isProductSurface = PRODUCT_ROUTE_RE.test(location.pathname)
    const {basketId, status: basketStatus} = useExpressPaymentBasket({
        enabled: resolveBasket && !isProductSurface
    })

    return useMemo(
        () =>
            buildExpressPaymentContext({
                pathname: location.pathname,
                search: location.search,
                siteId: site?.id,
                locale: locale?.id,
                currency,
                basketId,
                basketStatus
            }),
        [basketId, basketStatus, currency, locale?.id, location.pathname, location.search, site?.id]
    )
}

export default useExpressPaymentContext
