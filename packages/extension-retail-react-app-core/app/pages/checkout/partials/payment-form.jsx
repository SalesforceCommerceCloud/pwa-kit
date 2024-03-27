/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Flex,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Tooltip
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {LockIcon, PaypalIcon} from '@salesforce/retail-react-app/app/components/icons'
import CreditCardFields from '@salesforce/retail-react-app/app/components/forms/credit-card-fields'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'

const PaymentForm = ({form, onSubmit}) => {
    const {formatMessage} = useIntl()
    const {data: basket} = useCurrentBasket()
    const {currency} = useCurrency()

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                                                value={basket?.orderTotal}
                                                style="currency"
                                                currency={currency}
                                            />
                                        </Text>
                                    </Flex>
                                </Radio>
                            </Box>

                            <Box p={[4, 4, 6]} borderBottom="1px solid" borderColor="gray.100">
                                <Stack spacing={6}>
                                    <Stack spacing={6}>
                                        <CreditCardFields form={form} />
                                    </Stack>
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

PaymentForm.propTypes = {
    /** The form object returned from `useForm` */
    form: PropTypes.object,

    /** Callback for form submit */
    onSubmit: PropTypes.func
}

export default PaymentForm
