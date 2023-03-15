/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import cardValidator from 'card-validator'
import {useIntl, defineMessages} from 'react-intl'

const messages = defineMessages({
    required: {defaultMessage: 'Required', id: 'use_credit_card_fields.error.required'},
    cardNumberInvalid: {
        defaultMessage: 'Please enter a valid card number.',
        id: 'use_credit_card_fields.error.valid_card_number'
    },
    nameInvalid: {
        defaultMessage: 'Please enter a valid name.',
        id: 'use_credit_card_fields.error.valid_name'
    },
    dateInvalid: {
        defaultMessage: 'Please enter a valid date.',
        id: 'use_credit_card_fields.error.valid_date'
    },
    codeInvalid: {
        defaultMessage: 'Please enter a valid security code.',
        id: 'use_credit_card_fields.error.valid_security_code'
    },
    cardNumber: {defaultMessage: 'Card Number', id: 'use_credit_card_fields.label.card_number'},
    cardType: {defaultMessage: 'Card Type', id: 'use_credit_card_fields.label.card_type'},
    cardName: {defaultMessage: 'Name on Card', id: 'use_credit_card_fields.label.name'},
    expiryDate: {defaultMessage: 'Expiration Date', id: 'use_credit_card_fields.label.expiry'},
    securityCode: {
        defaultMessage: 'Security Code',
        id: 'use_credit_card_fields.label.security_code'
    }
})

/**
 * A React hook that provides the field definitions for a credit card form.
 * @param {Object} form - The object returned from `useForm`
 * @param {Object} form.control - The form control object
 * @param {Object} form.errors - An object containing field errors
 * @returns {Object} Field definitions for use in a form
 */
export default function useCreditCardFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        number: {
            name: `${prefix}number`,
            label: formatMessage(messages.cardNumber),
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your card number.',
                    id: 'use_credit_card_fields.error.required_card_number'
                }),
                validate: (value) =>
                    cardValidator.number(value).isValid || formatMessage(messages.cardNumberInvalid)
            },
            error: errors[`${prefix}number`],
            inputProps: {
                inputmode: 'numeric'
            },
            control
        },
        cardType: {
            name: `${prefix}cardType`,
            label: formatMessage(messages.cardType),
            defaultValue: '',
            type: 'hidden',
            error: errors[`${prefix}cardType`],
            control
        },
        holder: {
            name: `${prefix}holder`,
            label: formatMessage(messages.cardName),
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your name as shown on your card.',
                    id: 'use_credit_card_fields.error.required_name'
                }),
                validate: (value) =>
                    cardValidator.cardholderName(value).isValid ||
                    formatMessage(messages.nameInvalid)
            },
            error: errors[`${prefix}holder`],
            control
        },
        expiry: {
            name: `${prefix}expiry`,
            label: formatMessage(messages.expiryDate),
            defaultValue: '',
            type: 'text',
            placeholder: 'MM/YY',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your expiration date.',
                    id: 'use_credit_card_fields.error.required_expiry'
                }),
                validate: (value) =>
                    cardValidator.expirationDate(value).isValid ||
                    formatMessage(messages.dateInvalid)
            },
            error: errors[`${prefix}expiry`],
            inputProps: {
                inputmode: 'numeric'
            },
            control
        },
        securityCode: {
            name: `${prefix}securityCode`,
            label: formatMessage(messages.securityCode),
            defaultValue: '',
            type: 'password',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your security code.',
                    id: 'use_credit_card_fields.error.required_security_code'
                }),
                validate: (value) =>
                    cardValidator.cvv(value).isValid || formatMessage(messages.codeInvalid)
            },
            error: errors[`${prefix}securityCode`],
            inputProps: ({onChange}) => ({
                inputmode: 'numeric',
                maxLength: 4,
                onChange(evt) {
                    onChange(evt.target.value.replace(/[^0-9 ]+/, ''))
                }
            }),
            control
        }
    }

    return fields
}
