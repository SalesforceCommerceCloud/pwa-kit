/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Collapse,
    Flex,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Tooltip
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {LockIcon, PaypalIcon} from '@salesforce/retail-react-app/app/components/icons'
import CreditCardFields from '@salesforce/retail-react-app/app/components/forms/credit-card-fields'
import {getCreditCardIcon} from '@salesforce/retail-react-app/app/utils/cc-utils'

const INITIAL_DISPLAYED_SAVED_PAYMENT_INSTRUMENTS = 3

const PaymentCardSummary = ({payment}) => {
    const CardIcon = getCreditCardIcon(payment?.paymentCard?.cardType)

    return (
        <Stack direction="row" alignItems="center" spacing={3}>
            {CardIcon && <CardIcon layerStyle="ccIcon" />}

            <Stack direction="row">
                <Text>{payment.paymentCard.cardType}</Text>
                <Text>&bull;&bull;&bull;&bull; {payment.paymentCard.numberLastDigits}</Text>
                <Text>
                    {payment.paymentCard.expirationMonth}/{payment.paymentCard.expirationYear}
                </Text>
            </Stack>
        </Stack>
    )
}

PaymentCardSummary.propTypes = {payment: PropTypes.object}

const PaymentForm = ({
    form,
    onSubmit,
    savedPaymentInstruments,
    children,
    onPaymentMethodChange,
    selectedPaymentMethod
}) => {
    const {formatMessage} = useIntl()
    const [showAllPaymentInstruments, setShowAllPaymentInstruments] = useState(false)

    const sortedSaved = (savedPaymentInstruments || [])
        .slice()
        .sort((a, b) => (b?.default ? 1 : 0) - (a?.default ? 1 : 0))
    const savedCount = sortedSaved.length
    const totalItems = savedCount + 2 // saved + credit card + paypal
    const viewCount = showAllPaymentInstruments
        ? totalItems
        : INITIAL_DISPLAYED_SAVED_PAYMENT_INSTRUMENTS

    const displayedSavedCount = Math.min(savedCount, viewCount)
    const displayedSavedPaymentInstruments = sortedSaved.slice(0, displayedSavedCount)

    const showCreditCard = viewCount > displayedSavedCount
    const displayedAfterCC = displayedSavedCount + (showCreditCard ? 1 : 0)
    const showPaypal = viewCount > displayedAfterCC

    const showViewAllButton =
        totalItems > INITIAL_DISPLAYED_SAVED_PAYMENT_INSTRUMENTS && !showAllPaymentInstruments

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Stack spacing={8}>
                <Stack spacing={5}>
                    <Box border="1px solid" borderColor="gray.100" rounded="base" overflow="hidden">
                        <RadioGroup
                            value={selectedPaymentMethod}
                            onChange={onPaymentMethodChange}
                            aria-label={formatMessage({
                                defaultMessage: 'Payment',
                                id: 'payment_selection.radio_group.assistive_msg'
                            })}
                            name="payment-selection"
                        >
                            {displayedSavedPaymentInstruments?.map((paymentInstrument) => (
                                <Box
                                    py={3}
                                    px={[4, 4, 6]}
                                    bg="gray.50"
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                    key={paymentInstrument.paymentInstrumentId}
                                >
                                    <Radio
                                        value={paymentInstrument.paymentInstrumentId}
                                        key={paymentInstrument.paymentInstrumentId}
                                    >
                                        <PaymentCardSummary payment={paymentInstrument} />
                                    </Radio>
                                </Box>
                            ))}

                            {showCreditCard && (
                                <>
                                    <Box
                                        py={3}
                                        px={[4, 4, 6]}
                                        bg="gray.50"
                                        borderBottom="1px solid"
                                        borderColor="gray.100"
                                    >
                                        <Radio value="cc">
                                            <Flex justify="space-between">
                                                <Stack direction="row" align="center">
                                                    <Text fontWeight="bold">
                                                        <FormattedMessage
                                                            defaultMessage="Credit Card"
                                                            id="payment_selection.heading.credit_card"
                                                        />
                                                    </Text>
                                                    <Tooltip
                                                        hasArrow
                                                        placement="top"
                                                        label={formatMessage({
                                                            defaultMessage:
                                                                'This is a secure SSL encrypted payment.',
                                                            id: 'payment_selection.tooltip.secure_payment'
                                                        })}
                                                    >
                                                        <LockIcon color="gray.700" boxSize={5} />
                                                    </Tooltip>
                                                </Stack>
                                            </Flex>
                                        </Radio>
                                    </Box>
                                    <Collapse in={selectedPaymentMethod === 'cc'} animateOpacity>
                                        <Box
                                            p={[4, 4, 6]}
                                            borderBottom="1px solid"
                                            borderColor="gray.100"
                                        >
                                            <Stack spacing={6}>
                                                <Stack spacing={6}>
                                                    <CreditCardFields form={form} />
                                                </Stack>
                                                {children && <Box pt={2}>{children}</Box>}
                                            </Stack>
                                        </Box>
                                    </Collapse>
                                </>
                            )}

                            {showPaypal && (
                                <Box py={3} px={[4, 4, 6]} bg="gray.50" borderColor="gray.100">
                                    <Radio value="paypal">
                                        <Box py="2px">
                                            <PaypalIcon width="auto" height="20px" />
                                        </Box>
                                    </Radio>
                                </Box>
                            )}
                        </RadioGroup>
                    </Box>
                    {showViewAllButton && savedCount > 0 && (
                        <Box py={3} px={[4, 4, 6]}>
                            <button
                                type="button"
                                data-testid="view-all-saved-payments"
                                onClick={() => setShowAllPaymentInstruments(true)}
                            >
                                <FormattedMessage
                                    defaultMessage="View All ({count} more)"
                                    id="payment_selection.button.view_all"
                                    values={{
                                        count: Math.max(totalItems - viewCount, 0)
                                    }}
                                />
                            </button>
                        </Box>
                    )}
                </Stack>
            </Stack>
        </form>
    )
}

PaymentForm.propTypes = {
    /** The form object returned from `useForm` */
    form: PropTypes.object,

    /** Callback for form submit */
    onSubmit: PropTypes.func,

    /** Additional content to render after credit card fields */
    children: PropTypes.node,

    /** Saved payment instruments */
    savedPaymentInstruments: PropTypes.array,

    /** Callback for payment method selection change */
    onPaymentMethodChange: PropTypes.func,

    /** Currently selected payment method */
    selectedPaymentMethod: PropTypes.string
}

export default PaymentForm
