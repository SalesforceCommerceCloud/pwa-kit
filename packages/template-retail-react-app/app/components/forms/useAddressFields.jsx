/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl, defineMessages} from 'react-intl'
import {formatPhoneNumber} from '@salesforce/retail-react-app/app/utils/phone-utils'
import {
    stateOptions,
    provinceOptions
} from '@salesforce/retail-react-app/app/components/forms/state-province-options'
import {SHIPPING_COUNTRY_CODES} from '@salesforce/retail-react-app/app/constants'

const messages = defineMessages({
    required: {defaultMessage: 'Required', id: 'use_address_fields.error.required'},
    firstName: {defaultMessage: 'First Name', id: 'use_address_fields.label.first_name'},
    lastName: {defaultMessage: 'Last Name', id: 'use_address_fields.label.last_name'},
    phone: {defaultMessage: 'Phone', id: 'use_address_fields.label.phone'},
    country: {defaultMessage: 'Country', id: 'use_address_fields.label.country'},
    address: {defaultMessage: 'Address', id: 'use_address_fields.label.address'},
    city: {defaultMessage: 'City', id: 'use_address_fields.label.city'},
    state: {defaultMessage: 'State', id: 'use_address_fields.label.state'},
    province: {defaultMessage: 'Province', id: 'use_address_fields.label.province'},
    zipCode: {defaultMessage: 'Zip Code', id: 'use_address_fields.label.zipCode'},
    postalCode: {defaultMessage: 'Postal Code', id: 'use_address_fields.label.postal_code'},
    stateCodeInvalid: {
        defaultMessage: 'Please enter 2-letter state/province.',
        id: 'use_address_fields.error.state_code_invalid'
    },
    preferred: {defaultMessage: 'Set as default', id: 'use_address_fields.label.preferred'}
})

/**
 * A React hook that provides the field definitions for an address form.
 * @param {Object} form - The object returned from `useForm`
 * @param {Object} form.control - The form control object
 * @param {Object} form.formState.errors - An object containing field errors
 * @returns {Object} Field definitions for use in a form
 */
export default function useAddressFields({
    form: {
        watch,
        control,
        formState: {errors}
    },
    prefix = ''
}) {
    const {formatMessage} = useIntl()

    const countryCode = watch('countryCode')

    const fields = {
        firstName: {
            name: `${prefix}firstName`,
            label: formatMessage(messages.firstName),
            defaultValue: '',
            type: 'text',
            autoComplete: 'given-name',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your first name.',
                    id: 'use_address_fields.error.please_enter_first_name'
                })
            },
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: formatMessage(messages.lastName),
            defaultValue: '',
            type: 'text',
            autoComplete: 'family-name',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your last name.',
                    id: 'use_address_fields.error.please_enter_last_name'
                })
            },
            error: errors[`${prefix}lastName`],
            control
        },
        phone: {
            name: `${prefix}phone`,
            label: formatMessage(messages.phone),
            defaultValue: '',
            type: 'tel',
            autoComplete: 'tel',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your phone number.',
                    id: 'use_address_fields.error.please_enter_phone_number'
                })
            },
            error: errors[`${prefix}phone`],
            inputProps: ({onChange}) => ({
                inputMode: 'numeric',
                onChange(evt) {
                    onChange(formatPhoneNumber(evt.target.value))
                }
            }),
            control
        },
        countryCode: {
            name: `${prefix}countryCode`,
            label: formatMessage(messages.country),
            defaultValue: 'US',
            type: 'select',
            options: SHIPPING_COUNTRY_CODES,
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please select your country.',
                    id: 'use_address_fields.error.please_select_your_country'
                })
            },
            error: errors[`${prefix}countryCode`],
            control
        },
        address1: {
            name: `${prefix}address1`,
            label: formatMessage(messages.address),
            defaultValue: '',
            type: 'text',
            autoComplete: 'address-line1',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your address.',
                    id: 'use_address_fields.error.please_select_your_address'
                })
            },
            error: errors[`${prefix}address1`],
            control
        },
        city: {
            name: `${prefix}city`,
            label: formatMessage(messages.city),
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your city.',
                    id: 'use_address_fields.error.please_select_your_city'
                })
            },
            error: errors[`${prefix}city`],
            control
        },
        stateCode: {
            name: `${prefix}stateCode`,
            label: formatMessage(countryCode === 'CA' ? messages.province : messages.state),
            defaultValue: '',
            type: 'select',
            options: [
                {value: '', label: ''},
                ...(countryCode === 'CA' ? provinceOptions : stateOptions)
            ],
            rules: {
                required:
                    countryCode === 'CA'
                        ? 'Please select your province.' // FYI we won't translate this
                        : formatMessage({
                              defaultMessage: 'Please select your state.',
                              id: 'use_address_fields.error.please_select_your_state_or_province',
                              description: 'Error message for a blank state (US-specific checkout)'
                          })
            },
            error: errors[`${prefix}stateCode`],
            control
        },
        postalCode: {
            name: `${prefix}postalCode`,
            label: formatMessage(countryCode === 'CA' ? messages.postalCode : messages.zipCode),
            defaultValue: '',
            type: 'text',
            autoComplete: 'postal-code',
            rules: {
                required:
                    countryCode === 'CA'
                        ? 'Please enter your postal code.' // FYI we won't translate this
                        : formatMessage({
                              defaultMessage: 'Please enter your zip code.',
                              id: 'use_address_fields.error.please_enter_your_postal_or_zip',
                              description:
                                  'Error message for a blank zip code (US-specific checkout)'
                          })
            },
            error: errors[`${prefix}postalCode`],
            control
        },
        preferred: {
            name: `${prefix}preferred`,
            label: formatMessage(messages.preferred),
            defaultValue: false,
            type: 'checkbox',
            autoComplete: 'honorific-prefix',
            rules: {},
            control
        }
    }

    return fields
}
