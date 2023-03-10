/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'
import {validatePassword} from '../../utils/password-utils'

export default function useUpdatePasswordFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        currentPassword: {
            name: `${prefix}currentPassword`,
            label: formatMessage({
                defaultMessage: 'Current Password',
                id: 'use_update_password_fields.label.current_password'
            }),
            defaultValue: '',
            type: 'password',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your password.',
                    id: 'use_update_password_fields.error.required_password'
                })
            },
            error: errors[`${prefix}currentPassword`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: formatMessage({
                defaultMessage: 'New Password',
                id: 'use_update_password_fields.label.new_password'
            }),
            type: 'password',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please provide a new password.',
                    id: 'use_update_password_fields.error.required_new_password'
                }),
                validate: {
                    hasMinChars: (val) =>
                        validatePassword(val).hasMinChars ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least 8 characters.',
                            id: 'use_update_password_fields.error.minimum_characters'
                        }),
                    hasUppercase: (val) =>
                        validatePassword(val).hasUppercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one uppercase letter.',
                            id: 'use_update_password_fields.error.uppercase_letter'
                        }),
                    hasLowercase: (val) =>
                        validatePassword(val).hasLowercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one lowercase letter.',
                            id: 'use_update_password_fields.error.lowercase_letter'
                        }),
                    hasNumber: (val) =>
                        validatePassword(val).hasNumber ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one number.',
                            id: 'use_update_password_fields.error.contain_number'
                        }),
                    hasSpecialChar: (val) =>
                        validatePassword(val).hasSpecialChar ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one special character.',
                            id: 'use_update_password_fields.error.special_character'
                        })
                }
            },
            error: errors[`${prefix}password`],
            control
        }
    }

    return fields
}
