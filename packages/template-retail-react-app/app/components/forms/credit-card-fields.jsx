/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import ccValidator from 'card-validator'
import {useIntl} from 'react-intl'
import {
    Box,
    Flex,
    FormLabel,
    InputRightElement,
    SimpleGrid,
    Stack,
    Tooltip
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    formatCreditCardNumber,
    getCreditCardIcon
} from '@salesforce/retail-react-app/app/utils/cc-utils'
import useCreditCardFields from '@salesforce/retail-react-app/app/components/forms/useCreditCardFields'
import Field from '@salesforce/retail-react-app/app/components/field'
import {
    AmexIcon,
    DiscoverIcon,
    MastercardIcon,
    VisaIcon,
    InfoIcon
} from '@salesforce/retail-react-app/app/components/icons'

const CreditCardFields = ({form, prefix = ''}) => {
    const {formatMessage} = useIntl()
    const fields = useCreditCardFields({form, prefix})

    // Rerender the fields when we `cardType` changes so the detected
    // card icon appears while typing the card number.
    // https://react-hook-form.com/api#watch
    const cardType = form.watch('cardType')

    const CardIcon = getCreditCardIcon(form.getValues().cardType)

    // Note: The ternary should NOT be placed inside a call to `formatMessage`. The message
    // extraction script (`npm run extract-default-translations`) only works when `formatMessage` is
    // used with object literals.
    const securityCodeTooltipLabel =
        cardType === 'american-express'
            ? formatMessage({
                  id: 'credit_card_fields.tool_tip.security_code.american_express',
                  defaultMessage: 'This 4-digit code can be found on the front of your card.',
                  description: 'American Express security code help text'
              })
            : formatMessage({
                  id: 'credit_card_fields.tool_tip.security_code',
                  defaultMessage: 'This 3-digit code can be found on the back of your card.',
                  description: 'Generic credit card security code help text'
              })

    return (
        <Box>
            <Stack spacing={5}>
                <Field
                    {...fields.number}
                    formLabel={
                        <Flex justify="space-between">
                            <FormLabel>{fields.number.label}</FormLabel>
                            <Stack direction="row" spacing={1}>
                                <VisaIcon layerStyle="ccIcon" />
                                <MastercardIcon layerStyle="ccIcon" />
                                <AmexIcon layerStyle="ccIcon" />
                                <DiscoverIcon layerStyle="ccIcon" />
                            </Stack>
                        </Flex>
                    }
                    inputProps={({onChange}) => ({
                        ...fields.number.inputProps,
                        onChange(evt) {
                            const number = evt.target.value.replace(/[^0-9 ]+/, '')
                            const {card} = ccValidator.number(number)
                            const formattedNumber = card
                                ? formatCreditCardNumber(number, card)
                                : number
                            form.setValue('cardType', card?.type || '')
                            return onChange(formattedNumber)
                        }
                    })}
                >
                    {CardIcon && form.getValues().number?.length > 2 && (
                        <InputRightElement width="60px">
                            <CardIcon layerStyle="ccIcon" />
                        </InputRightElement>
                    )}
                </Field>

                <Field {...fields.holder} />

                <SimpleGrid columns={[2, 2, 3]} spacing={5}>
                    <Field
                        {...fields.expiry}
                        inputProps={({onChange}) => ({
                            ...fields.expiry.inputProps,
                            onChange(evt) {
                                let value = evt.target.value.replace('/', '')

                                // We ignore input values other than digits and `/`.
                                if (value.match(/[^\d|/]/g)) {
                                    return
                                }

                                // Ignore input when we already have MM/YY
                                if (value.length > 4) {
                                    return
                                }
                                if (value.length >= 2) {
                                    value = `${value.substr(0, 2)}/${value.substr(2)}`
                                }

                                return onChange(value)
                            },
                            onKeyDown(evt) {
                                if (evt.keyCode === 8 || evt.keyCode === 46) {
                                    evt.preventDefault()
                                    return onChange(evt.target.value.slice(0, -1))
                                }
                            }
                        })}
                    />

                    <Field
                        {...fields.securityCode}
                        formLabel={
                            <FormLabel>
                                {fields.securityCode.label}{' '}
                                <Tooltip hasArrow placement="top" label={securityCodeTooltipLabel}>
                                    <InfoIcon boxSize={5} color="gray.700" ml={1} />
                                </Tooltip>
                            </FormLabel>
                        }
                    />
                </SimpleGrid>
            </Stack>
            <Field {...fields.cardType} />
        </Box>
    )
}

CreditCardFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default CreditCardFields
