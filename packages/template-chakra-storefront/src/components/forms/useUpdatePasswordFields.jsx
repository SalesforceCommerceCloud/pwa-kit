/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import {useIntl} from 'react-intl'
import {validatePassword} from '../../utils/password-utils'

export function useUpdatePasswordFields({
    form: {
        control,
        formState: {errors},
        getValues
    },
    prefix = ''
}) {
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            currentPasswordLabel: formatMessage({
                defaultMessage: 'Current Password',
                id: 'use_update_password_fields.label.current_password'
            }),
            newPasswordLabel: formatMessage({
                defaultMessage: 'New Password',
                id: 'use_update_password_fields.label.new_password'
            }),
            confirmPasswordLabel: formatMessage({
                defaultMessage: 'Confirm New Password',
                id: 'use_update_password_fields.label.confirm_new_password'
            }),
            currentPasswordRequired: formatMessage({
                defaultMessage: 'Please enter your password.',
                id: 'use_update_password_fields.error.required_password'
            }),
            newPasswordRequired: formatMessage({
                defaultMessage: 'Please provide a new password.',
                id: 'use_update_password_fields.error.required_new_password'
            }),
            confirmPasswordRequired: formatMessage({
                defaultMessage: 'Please confirm your password.',
                id: 'use_update_password_fields.error.required_confirm_password'
            }),
            minCharsError: formatMessage({
                defaultMessage: 'Password must contain at least 8 characters.',
                id: 'use_update_password_fields.error.minimum_characters'
            }),
            uppercaseError: formatMessage({
                defaultMessage: 'Password must contain at least one uppercase letter.',
                id: 'use_update_password_fields.error.uppercase_letter'
            }),
            lowercaseError: formatMessage({
                defaultMessage: 'Password must contain at least one lowercase letter.',
                id: 'use_update_password_fields.error.lowercase_letter'
            }),
            numberError: formatMessage({
                defaultMessage: 'Password must contain at least one number.',
                id: 'use_update_password_fields.error.contain_number'
            }),
            specialCharError: formatMessage({
                defaultMessage: 'Password must contain at least one special character.',
                id: 'use_update_password_fields.error.special_character'
            }),
            passwordMismatchError: formatMessage({
                defaultMessage: 'Passwords do not match.',
                id: 'use_update_password_fields.error.password_mismatch'
            })
        }),
        [intl]
    )

    const fields = {
        currentPassword: {
            name: `${prefix}currentPassword`,
            label: messages.currentPasswordLabel,
            defaultValue: '',
            type: 'password',
            autoComplete: 'current-password',
            rules: {
                required: messages.currentPasswordRequired
            },
            error: errors[`${prefix}currentPassword`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: messages.newPasswordLabel,
            type: 'password',
            autoComplete: 'new-password',
            defaultValue: '',
            rules: {
                required: messages.newPasswordRequired,
                validate: {
                    hasMinChars: (val) =>
                        validatePassword(val).hasMinChars || messages.minCharsError,
                    hasUppercase: (val) =>
                        validatePassword(val).hasUppercase || messages.uppercaseError,
                    hasLowercase: (val) =>
                        validatePassword(val).hasLowercase || messages.lowercaseError,
                    hasNumber: (val) => validatePassword(val).hasNumber || messages.numberError,
                    hasSpecialChar: (val) =>
                        validatePassword(val).hasSpecialChar || messages.specialCharError
                }
            },
            error: errors[`${prefix}password`],
            control
        },
        confirmPassword: {
            name: `${prefix}confirmPassword`,
            label: messages.confirmPasswordLabel,
            type: 'password',
            autoComplete: 'new-password',
            defaultValue: '',
            rules: {
                required: messages.confirmPasswordRequired,
                validate: {
                    matches: (val) =>
                        val === getValues(`${prefix}password`) || messages.passwordMismatchError
                }
            },
            error: errors[`${prefix}confirmPassword`],
            control
        }
    }

    return fields
}
