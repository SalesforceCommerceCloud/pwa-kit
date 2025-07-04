/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Stack, Text, SimpleGrid, Field} from '@chakra-ui/react'
import {PlusIcon} from '../../../components/icons'
import {RadioCard, RadioCardGroup} from '../../../components/radio-card'
import ActionCard from '../../../components/action-card'
import {getCreditCardIcon} from '../../../utils/cc-utils'
import {useCurrentCustomer} from '../../../hooks/use-current-customer'

const CCRadioGroup = ({
    form,
    value = '',
    isEditingPayment = false,
    togglePaymentEdit = () => null,
    onPaymentIdChange = () => null
}) => {
    const {data: customer} = useCurrentCustomer()

    return (
        <Field.Root
            id="paymentInstrumentId"
            isInvalid={form.formState.errors.paymentInstrumentId}
            isRequired={!isEditingPayment}
        >
            {form.formState.errors.paymentInstrumentId && (
                <FormErrorMessage marginTop={0} marginBottom={4}>
                    {form.formState.errors.paymentInstrumentId.message}
                </FormErrorMessage>
            )}

            <RadioCardGroup value={value} onValueChange={(selected) => {
                // Chakra v3 radio returns the selected id in an object with a value property
                onPaymentIdChange(selected.value)}
            }
                >
                <Stack gap={4}>
                    <SimpleGrid columns={[1, 1, 2]} gap={4}>
                        {customer.paymentInstruments?.map((payment, index) => {
                            const CardIcon = getCreditCardIcon(payment.paymentCard?.cardType)
                            return (
                                <RadioCard
                                    key={payment.paymentInstrumentId}
                                    value={payment.paymentInstrumentId}
                                    isSelected={payment.paymentInstrumentId === value}
                                >
                                    <Stack direction="row">
                                        {CardIcon && <CardIcon layerStyle="ccIcon" />}
                                        <ActionCard
                                            padding={0}
                                            border="none"
                                            onRemove={() => {}}
                                            data-testid={`sf-checkout-payment-option-${index}`}
                                            removeBtnLabel={"cc_radio_group.action.remove"}
                                        >
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
                                        </ActionCard>
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
        </Field.Root>
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
