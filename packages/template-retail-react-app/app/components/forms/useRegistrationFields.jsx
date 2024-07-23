/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'
import {validatePassword} from '@salesforce/retail-react-app/app/utils/password-utils'

export default function useRegistrationFields({
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
                id: 'use_registration_fields.label.first_name'
            }),
            type: 'text',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your first name.',
                    id: 'use_registration_fields.error.required_first_name'
                })
            },
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: formatMessage({
                defaultMessage: 'Last Name',
                id: 'use_registration_fields.label.last_name'
            }),
            type: 'text',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your last name.',
                    id: 'use_registration_fields.error.required_last_name'
                })
            },
            error: errors[`${prefix}lastName`],
            control
        },
        email: {
            name: `${prefix}email`,
            label: formatMessage({
                defaultMessage: 'Email',
                id: 'use_registration_fields.label.email'
            }),
            placeholder: 'you@email.com',
            type: 'email',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter a valid email address.',
                    id: 'use_registration_fields.error.required_email'
                })
            },
            error: errors[`${prefix}email`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: formatMessage({
                defaultMessage: 'Password',
                id: 'use_registration_fields.label.password'
            }),
            type: 'password',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please create a password.',
                    id: 'use_registration_fields.error.required_password'
                }),
                validate: {
                    hasMinChars: (val) =>
                        validatePassword(val).hasMinChars ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least 8 characters.',
                            id: 'use_registration_fields.error.minimum_characters'
                        }),
                    hasUppercase: (val) =>
                        validatePassword(val).hasUppercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one uppercase letter.',
                            id: 'use_registration_fields.error.uppercase_letter'
                        }),
                    hasLowercase: (val) =>
                        validatePassword(val).hasLowercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one lowercase letter.',
                            id: 'use_registration_fields.error.lowercase_letter'
                        }),
                    hasNumber: (val) =>
                        validatePassword(val).hasNumber ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one number.',
                            id: 'use_registration_fields.error.contain_number'
                        }),
                    hasSpecialChar: (val) =>
                        validatePassword(val).hasSpecialChar ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one special character.',
                            id: 'use_registration_fields.error.special_character'
                        })
                }
            },
            error: errors[`${prefix}password`],
            control
        },
        acceptsMarketing: {
            name: `${prefix}acceptsMarketing`,
            label: formatMessage({
                defaultMessage:
                    'Sign me up for Salesforce emails (you can unsubscribe at any time)',
                id: 'use_registration_fields.label.sign_up_to_emails'
            }),
            type: 'checkbox',
            defaultValue: false,
            error: errors[`${prefix}acceptsMarketing`],
            control
        }
    }

    return fields
}
