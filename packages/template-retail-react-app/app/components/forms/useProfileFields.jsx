/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'
import {formatPhoneNumber} from '@salesforce/retail-react-app/app/utils/phone-utils'

export default function useProfileFields({
    form: {
        control,
        formState: {errors}
    },
    prefix = ''
}) {
    const {formatMessage} = useIntl()

    const fields = {
        firstName: {
            name: `${prefix}firstName`,
            label: formatMessage({
                defaultMessage: 'First Name',
                id: 'use_profile_fields.label.first_name'
            }),
            type: 'text',
            autoComplete: 'given-name',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your first name.',
                    id: 'use_profile_fields.error.required_first_name'
                })
            },
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: formatMessage({
                defaultMessage: 'Last Name',
                id: 'use_profile_fields.label.last_name'
            }),
            type: 'text',
            defaultValue: '',
            autoComplete: 'family-name',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your last name.',
                    id: 'use_profile_fields.error.required_last_name'
                })
            },
            error: errors[`${prefix}lastName`],
            control
        },
        email: {
            name: `${prefix}email`,
            label: formatMessage({defaultMessage: 'Email', id: 'use_profile_fields.label.email'}),
            placeholder: 'you@email.com',
            type: 'email',
            defaultValue: '',
            autoComplete: 'email',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter a valid email address.',
                    id: 'use_profile_fields.error.required_email'
                })
            },
            error: errors[`${prefix}email`],
            inputProps: {
                // For security reason, updating the email must be validated via OTP (One Time Password)
                // If you are to change this to allow updating the email, you must validate the email via OTP otherwise you will have a security gap
                readOnly: true
            },
            control
        },
        phone: {
            name: `${prefix}phone`,
            label: formatMessage({
                defaultMessage: 'Phone Number',
                id: 'use_profile_fields.label.phone'
            }),
            defaultValue: '',
            type: 'tel',
            autoComplete: 'tel',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your phone number.',
                    id: 'use_profile_fields.error.required_phone'
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
        }
    }

    return fields
}
