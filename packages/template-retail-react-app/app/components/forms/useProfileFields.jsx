/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'
import {formatPhoneNumber} from '../../utils/phone-utils'

export default function useProfileFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        firstName: {
            name: `${prefix}firstName`,
            label: formatMessage({
                defaultMessage: 'First Name',
                id: 'use_profile_fields.label.first_name'
            }),
            type: 'text',
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
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter a valid email address.',
                    id: 'use_profile_fields.error.required_email'
                })
            },
            error: errors[`${prefix}email`],
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
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your phone number.',
                    id: 'use_profile_fields.error.required_phone'
                })
            },
            error: errors[`${prefix}phone`],
            inputProps: ({onChange}) => ({
                inputmode: 'numeric',
                onChange(evt) {
                    onChange(formatPhoneNumber(evt.target.value))
                }
            }),
            control
        }
    }

    return fields
}
