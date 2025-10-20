/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {useLocation} from 'react-router-dom'

import {FormattedMessage} from 'react-intl'
import {Heading, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'

import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useSFPayments, STATUS_SUCCESS} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

const PaymentProcessing = () => {
    const intl = useIntl()
    const location = useLocation()
    const navigate = useNavigation()
    const {sfp} = useSFPayments()
    const toast = useToast()

    const params = new URLSearchParams(location.search)
    const isError = !params.has('orderNo')
    const orderNo = params.get('orderNo')

    useEffect(() => {
        if (!isError && sfp) {
            ;(async () => {
                // If the URL has the necessary parameters, attempt to handle the redirect
                const result = await sfp.handleRedirect()
                if (result.responseCode === STATUS_SUCCESS) {
                    // Payment was successful so navigate to order confirmation
                    navigate(`/checkout/confirmation/${orderNo}`)
                } else {
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

                    // TODO: need to fail the order if not failed automatically by webhook

                    // Navigate back to the checkout page to try again
                    navigate('/checkout')
                }
            })()
        }
    }, [sfp])

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
