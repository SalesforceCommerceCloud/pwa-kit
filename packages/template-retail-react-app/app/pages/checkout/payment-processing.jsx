/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {useLocation} from 'react-router-dom'

import {FormattedMessage} from 'react-intl'
import {Heading, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'

import {useOrder, useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useQueryClient} from '@tanstack/react-query'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useSFPayments, STATUS_SUCCESS} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {getSFPaymentsInstrument} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {PAYMENT_GATEWAYS} from '@salesforce/retail-react-app/app/constants'

const ADYEN_SUCCESS_RESULT_CODES = [
    'authorised',
    'partiallyauthorised',
    'received',
    'pending',
    'presenttoshopper'
]

const PaymentProcessing = () => {
    const intl = useIntl()
    const location = useLocation()
    const navigate = useNavigation()
    const {sfp} = useSFPayments()
    const toast = useToast()
    const queryClient = useQueryClient()

    const {mutateAsync: updatePaymentInstrumentForOrder} = useShopperOrdersMutation(
        'updatePaymentInstrumentForOrder'
    )
    const {mutateAsync: failOrder} = useShopperOrdersMutation('failOrder')

    const params = new URLSearchParams(location.search)
    const vendor = params.get('vendor')
    const orderNo = params.get('orderNo')
    const {data: order, refetch} = useOrder(
        {
            parameters: {orderNo}
        },
        {
            enabled: !!orderNo
        }
    )

    function isValidReturnUrl() {
        switch (vendor) {
            case 'Stripe':
                // Stripe requires orderNo
                return !!orderNo
            case 'Adyen':
                // Adyen requires orderNo, type, redirectResult, and zoneId
                return (
                    !!orderNo &&
                    params.has('type') &&
                    params.has('zoneId') &&
                    params.has('redirectResult')
                )
            default:
                // Unsupported payment gateway
                return false
        }
    }

    const isError = !isValidReturnUrl()
    const isHandled = useRef(false)

    async function handleAdyenRedirect() {
        // Find SF Payments payment instrument in order
        const orderPaymentInstrument = getSFPaymentsInstrument(order)

        // Submit redirect result
        const updatedOrder = await updatePaymentInstrumentForOrder({
            parameters: {
                orderNo: order.orderNo,
                paymentInstrumentId: orderPaymentInstrument.paymentInstrumentId
            },
            body: {
                paymentMethodId: 'Salesforce Payments',
                paymentReferenceRequest: {
                    paymentMethodType: params.get('type'),
                    zoneId: params.get('zoneId'),
                    gateway: PAYMENT_GATEWAYS.ADYEN,
                    gatewayProperties: {
                        adyen: {
                            redirectResult: params.get('redirectResult')
                        }
                    }
                }
            }
        })

        // Find updated SF Payments payment instrument in updated order
        const updatedOrderPaymentInstrument = getSFPaymentsInstrument(updatedOrder)

        // Check if Adyen result code indicates redirect payment was successful
        return ADYEN_SUCCESS_RESULT_CODES.includes(
            updatedOrderPaymentInstrument?.paymentReference?.gatewayProperties?.adyen?.adyenPaymentIntent?.resultCode?.toLowerCase()
        )
    }

    /**
     * Attempts to fail an order and reopen the basket.
     * Only calls failOrder if the order status is 'created' (avoids hanging when order
     * was already failed by webhook).
     * @returns {Promise<void>}
     */
    async function attemptFailOrderForPayment() {
        if (!orderNo) {
            return
        }

        try {
            const {data: currentOrder} = await refetch()
            if (currentOrder?.status === 'created') {
                await failOrder({
                    parameters: {
                        orderNo,
                        reopenBasket: true
                    },
                    body: {
                        reasonCode: 'payment_confirm_failure'
                    }
                })
            }
        } catch (error) {
            // Swallow so flow continues (invalidate, navigate). Causes: (1) Race: refetch
            // returned 'created' but webhook already failed the order, so failOrder fails. (2) refetch
            // or failOrder threw (network, 4xx/5xx). Same behavior for all: don't hang.
        } finally {
            queryClient.invalidateQueries()
        }
    }

    function showOrderConfirmation() {
        navigate(`/checkout/confirmation/${orderNo}`)
    }

    useEffect(() => {
        if (isError && order && !isHandled.current) {
            // Ensure we don't handle the redirect twice
            isHandled.current = true

            // Order exists but payment can't be processed for return URL
            attemptFailOrderForPayment()
        } else if (!isError && sfp && order) {
            ;(async () => {
                if (isHandled.current) {
                    // Redirect already handled
                    return
                }

                // Ensure we don't handle the redirect twice
                isHandled.current = true

                if (vendor === 'Stripe') {
                    // Use sfp.js to attempt to handle the redirect
                    const stripeResult = await sfp.handleRedirect()
                    if (stripeResult.responseCode === STATUS_SUCCESS) {
                        return showOrderConfirmation()
                    }
                } else if (vendor === 'Adyen') {
                    const adyenResult = await handleAdyenRedirect()
                    if (adyenResult) {
                        // Redirect result submitted successfully, and we can proceed to the order confirmation
                        return showOrderConfirmation()
                    }
                }

                // Show an error message that the payment was unsuccessful
                toast({
                    title: intl.formatMessage({
                        defaultMessage:
                            'Your attempted payment was unsuccessful. You have not been charged and your order has not been placed. Please select a different payment method and submit payment again to complete your checkout and place your order.',
                        id: 'payment_processing.error.unsuccessful'
                    }),
                    status: 'error',
                    duration: 30000
                })

                // Attempt to fail the order (no-op if already failed by webhook, e.g. 3DS declined)
                await attemptFailOrderForPayment()

                // Navigate back to the checkout page to try again
                navigate('/checkout')
            })()
        }
    }, [sfp, order])

    return (
        <Stack spacing={6} height="100%" alignContent="center" justifyContent="center">
            <Heading fontSize="lg" align="center">
                <FormattedMessage
                    defaultMessage="Payment Processing"
                    id="payment_processing.heading.payment_processing"
                />
            </Heading>
            {isError ? (
                <Stack spacing={4}>
                    <Text align="center">
                        <FormattedMessage
                            defaultMessage="There was an unexpected error processing your payment."
                            id="payment_processing.message.unexpected_error"
                        />
                    </Text>
                    <Link href="/checkout" align="center">
                        <FormattedMessage
                            defaultMessage="Return to Checkout"
                            id="payment_processing.link.return_to_checkout"
                        />
                    </Link>
                </Stack>
            ) : (
                <Text align="center">
                    <FormattedMessage
                        defaultMessage="Working on your payment..."
                        id="payment_processing.message.working_on_your_payment"
                    />
                </Text>
            )}
        </Stack>
    )
}

PaymentProcessing.getTemplateName = () => 'payment-processing'

PaymentProcessing.propTypes = {
    /**
     * The current react router match object. (Provided internally)
     */
    match: PropTypes.object
}

export default PaymentProcessing
