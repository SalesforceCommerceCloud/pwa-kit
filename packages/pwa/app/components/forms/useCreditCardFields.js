import cardValidator from 'card-validator'
import {useIntl, defineMessages} from 'react-intl'

const messages = defineMessages({
    required: {defaultMessage: 'Required'},
    cardNumberInvalid: {defaultMessage: 'Please enter a valid card number'},
    nameInvalid: {defaultMessage: 'Please enter a valid name'},
    dateInvalid: {defaultMessage: 'Please enter a valid date'},
    codeInvalid: {defaultMessage: 'Please enter a valid security code'}
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
            label: 'Card Number',
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage(messages.required),
                validate: (value) =>
                    cardValidator.number(value).isValid || formatMessage(messages.cardNumberInvalid)
            },
            error: errors[`${prefix}number`],
            control
        },
        cardType: {
            name: `${prefix}cardType`,
            label: 'Card Type',
            defaultValue: '',
            type: 'hidden',
            error: errors[`${prefix}cardType`],
            control
        },
        holder: {
            name: `${prefix}holder`,
            label: 'Name on Card',
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage(messages.required),
                validate: (value) =>
                    cardValidator.cardholderName(value).isValid ||
                    formatMessage(messages.nameInvalid)
            },
            error: errors[`${prefix}holder`],
            control
        },
        expiry: {
            name: `${prefix}expiry`,
            label: 'Expiry Date',
            defaultValue: '',
            type: 'text',
            placeholder: 'MM/YY',
            rules: {
                required: formatMessage(messages.required),
                validate: (value) =>
                    cardValidator.expirationDate(value).isValid ||
                    formatMessage(messages.dateInvalid)
            },
            error: errors[`${prefix}expiry`],
            control
        },
        securityCode: {
            name: `${prefix}securityCode`,
            label: 'Security Code',
            defaultValue: '',
            type: 'number',
            rules: {
                required: formatMessage(messages.required),
                validate: (value) =>
                    cardValidator.cvv(value).isValid || formatMessage(messages.codeInvalid)
            },
            error: errors[`${prefix}securityCode`],
            inputProps: ({onChange}) => ({
                onChange(evt) {
                    if (/[^\d]/g.test(evt.target.value)) {
                        return
                    }
                    onChange(evt.target.value)
                }
            }),
            control
        }
    }

    return fields
}
