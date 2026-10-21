/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useEffect, useMemo} from 'react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    useConfigurations,
    usePaymentConfiguration,
    useProduct,
    useShopperBasketsV2Mutation as useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'

import SFPaymentsExpress from '@salesforce/retail-react-app/app/components/sf-payments-express'
import SFPaymentsExpressButtons from '@salesforce/retail-react-app/app/components/sf-payments-express-buttons'
import {EXPRESS_BUY_NOW} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {useSFPaymentsCountry} from '@salesforce/retail-react-app/app/hooks/use-sf-payments-country'
import {useCleanupTemporaryBaskets} from '@salesforce/retail-react-app/app/hooks/use-cleanup-temporary-baskets'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import useExpressPaymentBasket from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/use-express-payment-basket'
import {
    EXPRESS_PAYMENT_BASKET_STATUSES,
    EXPRESS_PAYMENT_SURFACES,
    expressPaymentProviderPropTypes
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract'

const SFP_FALLBACK_PAYMENT_METHOD = 'salesforce_payments'
const SFP_FAILURE_MESSAGE = 'Express payment could not be completed. Please try again.'
const SFP_CANCEL_MESSAGE = 'Express payment was cancelled.'
const SHOPPER_AGENT_PAYMENT_METHODS = new Set(['applepay', 'googlepay'])
const SHOPPER_AGENT_PAYMENT_VENDORS = new Set(['Stripe', 'Adyen'])

export const filterShopperAgentPaymentMethodSet = ({
    paymentMethods = [],
    paymentMethodSetAccounts = []
}) => {
    const accountsById = new Map(
        paymentMethodSetAccounts.map((account) => [account.accountId, account])
    )
    const filteredPaymentMethods = paymentMethods.filter((method) => {
        const account = accountsById.get(method.accountId)
        return (
            SHOPPER_AGENT_PAYMENT_METHODS.has(method.paymentMethodType) &&
            SHOPPER_AGENT_PAYMENT_VENDORS.has(account?.vendor)
        )
    })
    const accountIds = new Set(filteredPaymentMethods.map((method) => method.accountId))
    const filteredAccounts = paymentMethodSetAccounts.filter((account) =>
        accountIds.has(account.accountId)
    )

    return {
        paymentMethods: filteredPaymentMethods,
        paymentMethodSetAccounts: filteredAccounts
    }
}

export const normalizeRenderedPaymentMethods = (rendered = []) =>
    rendered
        .map((method) => {
            if (typeof method === 'string') return method
            return method?.paymentMethodType || method?.type || method?.id || method?.name
        })
        .filter((method) => typeof method === 'string' && method.trim())

const useShopperAgentPaymentMethodSet = ({currency, countryCode}) => {
    const {countryCode: fallbackCountryCode} = useSFPaymentsCountry()
    const query = usePaymentConfiguration({
        parameters: {
            currency,
            countryCode: countryCode || fallbackCountryCode || 'US'
        }
    })
    const paymentMethodSet = useMemo(() => {
        if (!query.data) return null

        return filterShopperAgentPaymentMethodSet({
            paymentMethods: query.data.paymentMethods || [],
            paymentMethodSetAccounts: query.data.paymentMethodSetAccounts || []
        })
    }, [query.data])

    return {...query, paymentMethodSet}
}

const useSalesforcePaymentsLifecycle = (lifecycle) =>
    useMemo(
        () => ({
            onPaymentMethodsRendered: (rendered) => {
                const paymentMethods = normalizeRenderedPaymentMethods(rendered)
                if (paymentMethods.length) {
                    lifecycle.available({paymentMethods})
                } else {
                    lifecycle.unavailable()
                }
            },
            onExpressPaymentCompleted: ({orderId, paymentMethod} = {}) => {
                lifecycle.success({
                    orderId,
                    paymentMethod: paymentMethod || SFP_FALLBACK_PAYMENT_METHOD
                })
            },
            onExpressPaymentCancelled: ({paymentMethod} = {}) => {
                lifecycle.cancel({
                    shopperMessage: SFP_CANCEL_MESSAGE,
                    paymentMethod: paymentMethod || SFP_FALLBACK_PAYMENT_METHOD
                })
            },
            onExpressPaymentFailed: ({error, paymentMethod} = {}) => {
                lifecycle.failure({
                    shopperMessage: error || SFP_FAILURE_MESSAGE,
                    paymentMethod: paymentMethod || SFP_FALLBACK_PAYMENT_METHOD
                })
            }
        }),
        [lifecycle]
    )

const SalesforcePaymentsCartProvider = ({context, lifecycle}) => {
    const callbacks = useSalesforcePaymentsLifecycle(lifecycle)
    const {data: basket} = useExpressPaymentBasket()
    const {
        paymentMethodSet,
        isLoading: isPaymentConfigurationLoading,
        isError: isPaymentConfigurationError
    } = useShopperAgentPaymentMethodSet({
        currency: context.currency,
        countryCode: basket?.billingAddress?.countryCode
    })
    const basketIsReady =
        context.basket.status === EXPRESS_PAYMENT_BASKET_STATUSES.READY && context.basket.id
    const paymentMethodsAreReady = Boolean(paymentMethodSet?.paymentMethods.length)

    useEffect(() => {
        if (!basketIsReady) lifecycle.unavailable()
    }, [basketIsReady, lifecycle])

    useEffect(() => {
        if (
            !isPaymentConfigurationLoading &&
            (isPaymentConfigurationError || !paymentMethodsAreReady)
        ) {
            lifecycle.unavailable()
        }
    }, [
        isPaymentConfigurationError,
        isPaymentConfigurationLoading,
        lifecycle,
        paymentMethodsAreReady
    ])

    if (!basketIsReady || isPaymentConfigurationLoading || !paymentMethodsAreReady) return null

    return (
        <SFPaymentsExpress
            expressButtonLayout="horizontal"
            onPaymentMethodsRendered={callbacks.onPaymentMethodsRendered}
            onExpressPaymentCompleted={callbacks.onExpressPaymentCompleted}
            onExpressPaymentCancelled={callbacks.onExpressPaymentCancelled}
            onExpressPaymentFailed={callbacks.onExpressPaymentFailed}
            paymentMethodSet={paymentMethodSet}
            mode={context.mode}
        />
    )
}

SalesforcePaymentsCartProvider.propTypes = expressPaymentProviderPropTypes

const SalesforcePaymentsProductProvider = ({context, lifecycle}) => {
    const callbacks = useSalesforcePaymentsLifecycle(lifecycle)
    const cleanupTemporaryBaskets = useCleanupTemporaryBaskets()
    const {mutateAsync: createBasket} = useShopperBasketsMutation('createBasket')
    const {mutateAsync: addItemToBasket} = useShopperBasketsMutation('addItemToBasket')
    const {
        data: product,
        isLoading,
        isError
    } = useProduct({
        parameters: {
            id: context.productId,
            perPricebook: true,
            expand: ['availability', 'prices']
        }
    })
    const initialAmount = getPriceData(product, {quantity: context.quantity}).currentPrice
    const productIsReady = Boolean(product?.id && initialAmount > 0)
    const {
        paymentMethodSet,
        isLoading: isPaymentConfigurationLoading,
        isError: isPaymentConfigurationError
    } = useShopperAgentPaymentMethodSet({currency: context.currency})
    const paymentMethodsAreReady = Boolean(paymentMethodSet?.paymentMethods.length)

    useEffect(() => {
        if (!isLoading && (isError || !productIsReady)) lifecycle.unavailable()
    }, [isError, isLoading, lifecycle, productIsReady])

    useEffect(() => {
        if (
            !isPaymentConfigurationLoading &&
            (isPaymentConfigurationError || !paymentMethodsAreReady)
        ) {
            lifecycle.unavailable()
        }
    }, [
        isPaymentConfigurationError,
        isPaymentConfigurationLoading,
        lifecycle,
        paymentMethodsAreReady
    ])

    const prepareBasket = useCallback(async () => {
        await cleanupTemporaryBaskets()
        const basket = await createBasket({parameters: {temporary: true}, body: {}})
        return addItemToBasket({
            parameters: {basketId: basket.basketId},
            body: [{productId: context.productId, quantity: context.quantity}]
        })
    }, [
        addItemToBasket,
        cleanupTemporaryBaskets,
        context.productId,
        context.quantity,
        createBasket
    ])

    if (isLoading || !productIsReady || isPaymentConfigurationLoading || !paymentMethodsAreReady) {
        return null
    }

    return (
        <SFPaymentsExpressButtons
            usage={EXPRESS_BUY_NOW}
            paymentCurrency={context.currency}
            paymentCountryCode={null}
            initialAmount={initialAmount}
            prepareBasket={prepareBasket}
            expressButtonLayout="horizontal"
            onPaymentMethodsRendered={callbacks.onPaymentMethodsRendered}
            onExpressPaymentCompleted={callbacks.onExpressPaymentCompleted}
            onExpressPaymentCancelled={callbacks.onExpressPaymentCancelled}
            onExpressPaymentFailed={callbacks.onExpressPaymentFailed}
            paymentMethodSet={paymentMethodSet}
            mode={context.mode}
        />
    )
}

SalesforcePaymentsProductProvider.propTypes = expressPaymentProviderPropTypes

const SalesforcePaymentsExpressPaymentProvider = ({context, lifecycle}) => {
    const localEnabled = getConfig()?.app?.sfPayments?.enabled ?? true
    const {
        data: configurations,
        isLoading,
        isError
    } = useConfigurations({}, {staleTime: 10 * 60 * 1000})
    const apiEnabled =
        configurations?.configurations?.find(
            (configuration) => configuration.id === 'SalesforcePaymentsAllowed'
        )?.value === true
    const enabled = localEnabled && apiEnabled

    useEffect(() => {
        if (!isLoading && (isError || !enabled)) lifecycle.unavailable()
    }, [enabled, isError, isLoading, lifecycle])

    if (isLoading || !enabled) return null

    return context.surface === EXPRESS_PAYMENT_SURFACES.CART ? (
        <SalesforcePaymentsCartProvider context={context} lifecycle={lifecycle} />
    ) : (
        <SalesforcePaymentsProductProvider context={context} lifecycle={lifecycle} />
    )
}

SalesforcePaymentsExpressPaymentProvider.propTypes = expressPaymentProviderPropTypes

export default SalesforcePaymentsExpressPaymentProvider
