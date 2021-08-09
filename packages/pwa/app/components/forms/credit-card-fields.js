import React from 'react'
import PropTypes from 'prop-types'
import ccValidator from 'card-validator'
import {Box, Flex, FormLabel, InputRightElement, SimpleGrid, Stack} from '@chakra-ui/react'
import {formatCreditCardNumber, getCreditCardIcon} from '../../utils/cc-utils'
import useCreditCardFields from './useCreditCardFields'
import Field from '../field'
import {AmexIcon, CVVIcon, DiscoverIcon, MastercardIcon, VisaIcon} from '../icons'

const CreditCardFields = ({form, prefix = ''}) => {
    const fields = useCreditCardFields({form, prefix})

    // Rerender the fields when we `cardType` changes so the detected
    // card icon appears while typing the card number.
    // https://react-hook-form.com/api#watch
    form.watch('cardType')

    const CardIcon = getCreditCardIcon(form.getValues().cardType)

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
                        onChange(evt) {
                            const number = evt.target.value
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
                            onChange(evt) {
                                let value = evt.target.value.replace('/', '')

                                // We ignore input values other than digits and `/`.
                                // eslint-disable-next-line no-useless-escape
                                if (value.match(/[^\d|\/]/g)) {
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
                            }
                        })}
                    />

                    <Field {...fields.securityCode}>
                        <InputRightElement width="60px">
                            <CVVIcon width={8} height="auto" />
                        </InputRightElement>
                    </Field>
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
