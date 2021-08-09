import {useIntl, defineMessages} from 'react-intl'

const messages = defineMessages({
    required: {defaultMessage: 'Required'},
    firstName: {defaultMessage: 'First Name'},
    lastName: {defaultMessage: 'Last Name'},
    phone: {defaultMessage: 'Phone'},
    country: {defaultMessage: 'Country'},
    address: {defaultMessage: 'Address'},
    city: {defaultMessage: 'City'},
    state: {defaultMessage: 'State'},
    province: {defaultMessage: 'Province'},
    zipCode: {defaultMessage: 'Zip Code'},
    postalCode: {defaultMessage: 'Postal Code'},
    stateCodeInvalid: {defaultMessage: 'Please enter 2-letter state/province'}
})

/**
 * A React hook that provides the field definitions for an address form.
 * @param {Object} form - The object returned from `useForm`
 * @param {Object} form.control - The form control object
 * @param {Object} form.errors - An object containing field errors
 * @returns {Object} Field definitions for use in a form
 */
export default function useAddressFields({form: {watch, control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const countryCode = watch('countryCode')

    const fields = {
        firstName: {
            name: `${prefix}firstName`,
            label: formatMessage(messages.firstName),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage(messages.required)},
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: formatMessage(messages.lastName),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage(messages.required)},
            error: errors[`${prefix}lastName`],
            control
        },
        phone: {
            name: `${prefix}phone`,
            label: formatMessage(messages.phone),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage(messages.required)},
            error: errors[`${prefix}phone`],
            control
        },
        countryCode: {
            name: `${prefix}countryCode`,
            label: formatMessage(messages.country),
            defaultValue: 'US',
            type: 'select',
            options: [{value: 'CA', label: 'Canada'}, {value: 'US', label: 'United States'}],
            rules: {required: formatMessage(messages.required)},
            error: errors[`${prefix}countryCode`],
            control
        },
        address1: {
            name: `${prefix}address1`,
            label: formatMessage(messages.address),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage(messages.required)},
            error: errors[`${prefix}address1`],
            control
        },
        city: {
            name: `${prefix}city`,
            label: formatMessage(messages.city),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage(messages.required)},
            error: errors[`${prefix}city`],
            control
        },
        stateCode: {
            name: `${prefix}stateCode`,
            label: formatMessage(countryCode === 'CA' ? messages.province : messages.state),
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage(messages.required),
                validate: (value) =>
                    /[a-zA-Z]{2}/.test(value) || formatMessage(messages.stateCodeInvalid)
            },
            error: errors[`${prefix}stateCode`],
            inputProps: ({onChange}) => ({
                maxLength: 2,
                onChange(evt) {
                    if (/[^a-zA-Z]/g.test(evt.target.value)) {
                        return
                    }
                    onChange(evt.target.value)
                }
            }),
            control
        },
        postalCode: {
            name: `${prefix}postalCode`,
            label: formatMessage(countryCode === 'CA' ? messages.postalCode : messages.zipCode),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage(messages.required)},
            error: errors[`${prefix}postalCode`],
            control
        }
    }

    return fields
}
