/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {Box, Heading, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {getCreditCardIcon} from '@salesforce/retail-react-app/app/utils/cc-utils'

const SFPaymentsOrderSummary = ({paymentInstrument}) => {
    const intl = useIntl()

    const brand = (() => {
        switch (paymentInstrument.c_paymentReference_brand) {
            case 'amex':
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.amex',
                    defaultMessage: 'American Express'
                })
            case 'diners':
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.diners',
                    defaultMessage: 'Diners Club'
                })
            case 'discover':
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.discover',
                    defaultMessage: 'Discover'
                })
            case 'jcb':
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.jcb',
                    defaultMessage: 'JCB'
                })
            case 'mastercard':
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.mastercard',
                    defaultMessage: 'MasterCard'
                })
            case 'unionpay':
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.unionpay',
                    defaultMessage: 'China UnionPay'
                })
            case 'visa':
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.visa',
                    defaultMessage: 'Visa'
                })
            default:
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.brand.unknown',
                    defaultMessage: 'Unknown'
                })
        }
    })()
    const CardIcon = getCreditCardIcon(paymentInstrument.c_paymentReference_brand)
    const bank = (() => {
        switch (paymentInstrument.c_paymentReference_bank) {
            // TODO: translate bank names
            default:
                return intl.formatMessage({
                    id: 'sf_payments_order_summary.label.bank.unknown',
                    defaultMessage: 'Unknown'
                })
        }
    })()

    return (
        <Stack spacing={1}>
            <Heading as="h3" fontSize="sm">
                {paymentInstrument.c_paymentReference_type === 'afterpay_clearpay' ? (
                    <FormattedMessage
                        defaultMessage="Afterpay/Clearpay"
                        id="checkout_confirmation.heading.afterpay_clearpay"
                    />
                ) : paymentInstrument.c_paymentReference_type === 'bancontact' ? (
                    <FormattedMessage
                        defaultMessage="Bancontact"
                        id="checkout_confirmation.heading.bancontact"
                    />
                ) : paymentInstrument.c_paymentReference_type === 'card' ? (
                    <FormattedMessage
                        defaultMessage="Credit Card"
                        id="checkout_confirmation.heading.credit_card"
                    />
                ) : paymentInstrument.c_paymentReference_type === 'eps' ? (
                    <FormattedMessage defaultMessage="EPS" id="checkout_confirmation.heading.eps" />
                ) : paymentInstrument.c_paymentReference_type === 'ideal' ? (
                    <FormattedMessage
                        defaultMessage="iDEAL"
                        id="checkout_confirmation.heading.ideal"
                    />
                ) : paymentInstrument.c_paymentReference_type === 'klarna' ? (
                    <FormattedMessage
                        defaultMessage="Klarna"
                        id="checkout_confirmation.heading.klarna"
                    />
                ) : paymentInstrument.c_paymentReference_type === 'sepa_debit' ? (
                    <FormattedMessage
                        defaultMessage="SEPA Debit"
                        id="checkout_confirmation.heading.sepa_debit"
                    />
                ) : (
                    <FormattedMessage
                        defaultMessage="Unknown"
                        id="checkout_confirmation.heading.unknown"
                    />
                )}
            </Heading>

            <Stack direction="row">
                {paymentInstrument.c_paymentReference_type === 'bancontact' && (
                    <Box>
                        <Text>{paymentInstrument.c_paymentReference_bankName}</Text>
                        <Stack direction="row">
                            <Text>
                                &bull;&bull;&bull;&bull;{' '}
                                {paymentInstrument.c_paymentReference_last4}
                            </Text>
                        </Stack>
                    </Box>
                )}
                {paymentInstrument.c_paymentReference_type === 'card' && (
                    <Stack direction="row">
                        {CardIcon && <CardIcon layerStyle="ccIcon" />}

                        <Box>
                            <Text>{brand}</Text>
                            <Stack direction="row">
                                <Text>
                                    &bull;&bull;&bull;&bull;{' '}
                                    {paymentInstrument.c_paymentReference_last4}
                                </Text>
                            </Stack>
                        </Box>
                    </Stack>
                )}
                {paymentInstrument.c_paymentReference_type === 'eps' && (
                    <Box>
                        <Text>{bank}</Text>
                    </Box>
                )}
                {paymentInstrument.c_paymentReference_type === 'ideal' && (
                    <Box>
                        <Text>{bank}</Text>
                    </Box>
                )}
                {paymentInstrument.c_paymentReference_type === 'sepa_debit' && (
                    <Box>
                        <Stack direction="row">
                            <Text>
                                &bull;&bull;&bull;&bull;{' '}
                                {paymentInstrument.c_paymentReference_last4}
                            </Text>
                        </Stack>
                    </Box>
                )}
            </Stack>
        </Stack>
    )
}

SFPaymentsOrderSummary.propTypes = {
    paymentInstrument: PropTypes.object.isRequired
}

export default SFPaymentsOrderSummary
