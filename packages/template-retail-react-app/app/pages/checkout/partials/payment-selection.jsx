/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Tooltip
} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {LockIcon, PaypalIcon} from '../../../components/icons'
import {useCheckout} from '../util/checkout-context'
import CreditCardFields from '../../../components/forms/credit-card-fields'
import CCRadioGroup from './cc-radio-group'

const PaymentSelection = ({form, hideSubmitButton, onSubmit = () => null}) => {
    const {formatMessage} = useIntl()
    const {customer, basket} = useCheckout()

    const hasSavedCards = customer?.paymentInstruments?.length > 0

    const [isEditingPayment, setIsEditingPayment] = useState(!hasSavedCards)

    form = form || useForm()

    const submitForm = async (payment) => {
        await onSubmit(payment)
    }

    // Acts as our `onChange` handler for paymentInstrumentId radio group. We do this
    // manually here so we can toggle off the 'add payment' form as needed.
    const onPaymentIdChange = (value) => {
        if (value && isEditingPayment) {
            togglePaymentEdit()
        }
        form.reset({paymentInstrumentId: value})
    }

    // Opens/closes the 'add payment' form. Notice that when toggling either state,
    // we reset the form so as to remove any payment selection.
    const togglePaymentEdit = () => {
        form.reset({paymentInstrumentId: ''})
        setIsEditingPayment(!isEditingPayment)
        form.trigger()
    }

    return (
        <form onSubmit={form.handleSubmit(submitForm)}>
            <Stack spacing={8}>
                <Stack spacing={5}>
                    <Box border="1px solid" borderColor="gray.100" rounded="base" overflow="hidden">
                        <RadioGroup value="cc">
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
                                        <Text fontWeight="bold">
                                            <FormattedNumber
                                                value={basket.orderTotal}
                                                style="currency"
                                                currency={basket.currency}
                                            />
                                        </Text>
                                    </Flex>
                                </Radio>
                            </Box>

                            <Box p={[4, 4, 6]} borderBottom="1px solid" borderColor="gray.100">
                                <Stack spacing={6}>
                                    {hasSavedCards && (
                                        <Controller
                                            name="paymentInstrumentId"
                                            defaultValue=""
                                            control={form.control}
                                            rules={{
                                                required: !isEditingPayment
                                                    ? formatMessage({
                                                          defaultMessage:
                                                              'Please select a payment method.',
                                                          id:
                                                              'payment_selection.message.select_payment_method'
                                                      })
                                                    : false
                                            }}
                                            render={({value}) => (
                                                <CCRadioGroup
                                                    form={form}
                                                    value={value}
                                                    isEditingPayment={isEditingPayment}
                                                    togglePaymentEdit={togglePaymentEdit}
                                                    onPaymentIdChange={onPaymentIdChange}
                                                />
                                            )}
                                        />
                                    )}

                                    {isEditingPayment && (
                                        <Box
                                            {...(hasSavedCards && {
                                                px: [4, 4, 6],
                                                py: 6,
                                                rounded: 'base',
                                                border: '1px solid',
                                                borderColor: 'blue.600'
                                            })}
                                        >
                                            <Stack spacing={6}>
                                                {hasSavedCards && (
                                                    <Heading as="h3" size="sm">
                                                        <FormattedMessage
                                                            defaultMessage="Add New Card"
                                                            id="payment_selection.heading.add_new_card"
                                                        />
                                                    </Heading>
                                                )}

                                                <CreditCardFields form={form} />

                                                {!hideSubmitButton && (
                                                    <Box>
                                                        <Container variant="form">
                                                            <Button
                                                                isLoading={
                                                                    form.formState.isSubmitting
                                                                }
                                                                type="submit"
                                                                w="full"
                                                            >
                                                                <FormattedMessage
                                                                    defaultMessage="Save & Continue"
                                                                    id="payment_selection.button.save_and_continue"
                                                                />
                                                            </Button>
                                                        </Container>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>

                            <Box py={3} px={[4, 4, 6]} bg="gray.50" borderColor="gray.100">
                                <Radio value="paypal">
                                    <Box py="2px">
                                        <PaypalIcon width="auto" height="20px" />
                                    </Box>
                                </Radio>
                            </Box>
                        </RadioGroup>
                    </Box>
                </Stack>
            </Stack>
        </form>
    )
}

PaymentSelection.propTypes = {
    /** The form object returnd from `useForm` */
    form: PropTypes.object,

    /** Show or hide the submit button (for controlling the form from outside component) */
    hideSubmitButton: PropTypes.bool,

    /** Callback for form submit */
    onSubmit: PropTypes.func
}

export default PaymentSelection
