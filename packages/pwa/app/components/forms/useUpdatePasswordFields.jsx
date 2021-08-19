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
            label: formatMessage({defaultMessage: 'Current Password'}),
            defaultValue: '',
            type: 'password',
            rules: {required: formatMessage({defaultMessage: 'Please enter your password'})},
            error: errors[`${prefix}currentPassword`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: formatMessage({defaultMessage: 'New Password'}),
            type: 'password',
            defaultValue: '',
            rules: {
                required: formatMessage({defaultMessage: 'Please provide a new password'}),
                validate: {
                    hasMinChars: (val) =>
                        validatePassword(val).hasMinChars ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least 8 characters'
                        }),
                    hasUppercase: (val) =>
                        validatePassword(val).hasUppercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one uppercase letter'
                        }),
                    hasLowercase: (val) =>
                        validatePassword(val).hasLowercase ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one lowercase letter'
                        }),
                    hasNumber: (val) =>
                        validatePassword(val).hasNumber ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one number'
                        }),
                    hasSpecialChar: (val) =>
                        validatePassword(val).hasSpecialChar ||
                        formatMessage({
                            defaultMessage: 'Password must contain at least one special character'
                        })
                }
            },
            error: errors[`${prefix}password`],
            control
        }
    }

    return fields
}
