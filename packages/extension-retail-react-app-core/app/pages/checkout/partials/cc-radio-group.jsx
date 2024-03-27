/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Stack,
    Text,
    SimpleGrid,
    FormControl,
    FormErrorMessage
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {PlusIcon} from '@salesforce/retail-react-app/app/components/icons'
import {RadioCard, RadioCardGroup} from '@salesforce/retail-react-app/app/components/radio-card'
import {getCreditCardIcon} from '@salesforce/retail-react-app/app/utils/cc-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const CCRadioGroup = ({
    form,
    value = '',
    isEditingPayment = false,
    togglePaymentEdit = () => null,
    onPaymentIdChange = () => null
}) => {
    const {data: customer} = useCurrentCustomer()

    return (
        <FormControl
            id="paymentInstrumentId"
            isInvalid={form.formState.errors.paymentInstrumentId}
            isRequired={!isEditingPayment}
        >
            {form.formState.errors.paymentInstrumentId && (
                <FormErrorMessage marginTop={0} marginBottom={4}>
                    {form.formState.errors.paymentInstrumentId.message}
                </FormErrorMessage>
            )}

            <RadioCardGroup value={value} onChange={onPaymentIdChange}>
                <Stack spacing={4}>
                    <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                        {customer.paymentInstruments?.map((payment) => {
                            const CardIcon = getCreditCardIcon(payment.paymentCard?.cardType)
                            return (
                                <RadioCard
                                    key={payment.paymentInstrumentId}
                                    value={payment.paymentInstrumentId}
                                >
                                    <Stack direction="row">
                                        {CardIcon && <CardIcon layerStyle="ccIcon" />}
                                        <Stack spacing={4}>
                                            <Stack spacing={1}>
                                                <Text>{payment.paymentCard?.cardType}</Text>
                                                <Stack direction="row">
                                                    <Text>
                                                        &bull;&bull;&bull;&bull;{' '}
                                                        {payment.paymentCard?.numberLastDigits}
                                                    </Text>
                                                    <Text>
                                                        {payment.paymentCard?.expirationMonth}/
                                                        {payment.paymentCard?.expirationYear}
                                                    </Text>
                                                </Stack>
                                                <Text>{payment.paymentCard.holder}</Text>
                                            </Stack>

                                            <Box>
                                                <Button variant="link" size="sm" colorScheme="red">
                                                    <FormattedMessage
                                                        defaultMessage="Remove"
                                                        id="cc_radio_group.action.remove"
                                                    />
                                                </Button>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </RadioCard>
                            )
                        })}

                        {!isEditingPayment && (
                            <Button
                                variant="outline"
                                border="1px dashed"
                                borderColor="gray.200"
                                color="blue.600"
                                height={{lg: 'full'}}
                                minHeight={['44px', '44px', '154px']}
                                rounded="base"
                                fontWeight="medium"
                                leftIcon={<PlusIcon boxSize={'15px'} />}
                                onClick={togglePaymentEdit}
                            >
                                <FormattedMessage
                                    defaultMessage="Add New Card"
                                    id="cc_radio_group.button.add_new_card"
                                />
                            </Button>
                        )}
                    </SimpleGrid>
                </Stack>
            </RadioCardGroup>
        </FormControl>
    )
}

CCRadioGroup.propTypes = {
    /** The form object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** The current payment ID value */
    value: PropTypes.string,

    /** Flag for payment add/edit form, used for setting validation rules */
    isEditingPayment: PropTypes.bool,

    /** Method for toggling the payment add/edit form */
    togglePaymentEdit: PropTypes.func,

    /** Callback for notifying on value change */
    onPaymentIdChange: PropTypes.func
}

export default CCRadioGroup
