/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {Box, Flex, RadioGroup, Stack, Text, Tooltip} from '@chakra-ui/react'
import {useCurrentBasket} from '../../../hooks/use-current-basket'
import {LockIcon, PaypalIcon} from '../../../components/icons'
import CreditCardFields from '../../../components/forms/credit-card-fields'
import {useCurrency} from '../../../hooks'

const PaymentForm = ({form, onSubmit}) => {
    const {formatMessage} = useIntl()
    const {data: basket} = useCurrentBasket()
    const {currency} = useCurrency()

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Stack gap={8}>
                <Stack gap={5}>
                    <Box border="1px solid" borderColor="gray.100" rounded="base" overflow="hidden">
                        <RadioGroup.Root
                            value="cc"
                            aria-label={formatMessage({
                                defaultMessage: 'Payment',
                                id: 'payment_selection.radio_group.assistive_msg'
                            })}
                            name="payment-selection"
                        >
                            <Box
                                py={3}
                                px={[4, 4, 6]}
                                bg="gray.50"
                                borderBottom="1px solid"
                                borderColor="gray.100"
                            >
                                <RadioGroup.Item value="cc">
                                    <RadioGroup.ItemHiddenInput />
                                    <RadioGroup.ItemIndicator />
                                    <RadioGroup.ItemText>
                                        <Flex justify="space-between">
                                            <Stack direction="row" align="center">
                                                <Text fontWeight="bold">
                                                    <FormattedMessage
                                                        defaultMessage="Credit Card"
                                                        id="payment_selection.heading.credit_card"
                                                    />
                                                </Text>
                                                <Tooltip.Root
                                                    positioning={{ placement: "top" }}
                                                >
                                                    <Tooltip.Trigger asChild>
                                                        <LockIcon color="gray.700" boxSize={5} />
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Positioner>
                                                        <Tooltip.Content>
                                                            <Tooltip.Arrow>
                                                                <Tooltip.ArrowTip />
                                                            </Tooltip.Arrow>
                                                            {formatMessage({
                                                                defaultMessage:
                                                                    'This is a secure SSL encrypted payment.',
                                                                id: 'payment_selection.tooltip.secure_payment'
                                                            })}
                                                        </Tooltip.Content>
                                                    </Tooltip.Positioner>
                                                </Tooltip.Root>
                                            </Stack>
                                            <Text fontWeight="bold">
                                                <FormattedNumber
                                                    value={basket?.orderTotal}
                                                    style="currency"
                                                    currency={currency}
                                                />
                                            </Text>
                                        </Flex>
                                    </RadioGroup.ItemText>
                                </RadioGroup.Item>
                            </Box>

                            <Box p={[4, 4, 6]} borderBottom="1px solid" borderColor="gray.100">
                                <Stack gap={6}>
                                    <Stack gap={6}>
                                        <CreditCardFields form={form} />
                                    </Stack>
                                </Stack>
                            </Box>

                            <Box py={3} px={[4, 4, 6]} bg="gray.50" borderColor="gray.100">
                                <RadioGroup.Item value="paypal">
                                    <RadioGroup.ItemHiddenInput />
                                    <RadioGroup.ItemIndicator />
                                    <RadioGroup.ItemText>
                                        <Box py="2px">
                                            <PaypalIcon width="auto" height="20px" />
                                        </Box>
                                    </RadioGroup.ItemText>
                                </RadioGroup.Item>
                            </Box>
                        </RadioGroup.Root>
                    </Box>
                </Stack>
            </Stack>
        </form>
    )
}

PaymentForm.propTypes = {
    /** The form object returned from `useForm` */
    form: PropTypes.object,

    /** Callback for form submit */
    onSubmit: PropTypes.func
}

export default PaymentForm
