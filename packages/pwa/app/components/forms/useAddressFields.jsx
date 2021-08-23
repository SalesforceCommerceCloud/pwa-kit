/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl, defineMessages} from 'react-intl'
import {formatPhoneNumber} from '../../utils/phone-utils'
import {stateOptions, provinceOptions} from './state-province-options'

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
    stateCodeInvalid: {defaultMessage: 'Please enter 2-letter state/province'},
    preferred: {defaultMessage: 'Set as default'}
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
            rules: {required: formatMessage({defaultMessage: 'Please enter your first name'})},
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: formatMessage(messages.lastName),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage({defaultMessage: 'Please enter your last name'})},
            error: errors[`${prefix}lastName`],
            control
        },
        phone: {
            name: `${prefix}phone`,
            label: formatMessage(messages.phone),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage({defaultMessage: 'Please enter your phone number'})},
            error: errors[`${prefix}phone`],
            inputProps: ({onChange}) => ({
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
            options: [{value: 'CA', label: 'Canada'}, {value: 'US', label: 'United States'}],
            rules: {required: formatMessage({defaultMessage: 'Please select your country'})},
            error: errors[`${prefix}countryCode`],
            control
        },
        address1: {
            name: `${prefix}address1`,
            label: formatMessage(messages.address),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage({defaultMessage: 'Please enter your address'})},
            error: errors[`${prefix}address1`],
            control
        },
        city: {
            name: `${prefix}city`,
            label: formatMessage(messages.city),
            defaultValue: '',
            type: 'text',
            rules: {required: formatMessage({defaultMessage: 'Please enter your city'})},
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
                required: formatMessage(
                    {
                        defaultMessage: 'Please select your {stateOrProvince}'
                    },
                    {stateOrProvince: countryCode === 'CA' ? 'province' : 'state'}
                )
            },
            error: errors[`${prefix}stateCode`],
            control
        },
        postalCode: {
            name: `${prefix}postalCode`,
            label: formatMessage(countryCode === 'CA' ? messages.postalCode : messages.zipCode),
            defaultValue: '',
            type: 'text',
            rules: {
                required: formatMessage(
                    {
                        defaultMessage: 'Please enter your {postalOrZip}'
                    },
                    {postalOrZip: countryCode === 'CA' ? 'postal code' : 'zip code'}
                )
            },
            error: errors[`${prefix}postalCode`],
            control
        },
        preferred: {
            name: `${prefix}preferred`,
            label: formatMessage(messages.preferred),
            defaultValue: false,
            type: 'checkbox',
            rules: {},
            control
        }
    }

    return fields
}
