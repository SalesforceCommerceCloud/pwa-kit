/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import {useIntl} from 'react-intl'
import {validatePassword} from '../../utils/password-utils'

export default function useRegistrationFields({
    form: {
        control,
        formState: {errors}
    },
    prefix = ''
}) {
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            firstNameLabel: formatMessage({
                defaultMessage: 'First Name',
                id: 'use_registration_fields.label.first_name'
            }),
            lastNameLabel: formatMessage({
                defaultMessage: 'Last Name',
                id: 'use_registration_fields.label.last_name'
            }),
            emailLabel: formatMessage({
                defaultMessage: 'Email',
                id: 'use_registration_fields.label.email'
            }),
            passwordLabel: formatMessage({
                defaultMessage: 'Password',
                id: 'use_registration_fields.label.password'
            }),
            acceptsMarketingLabel: formatMessage({
                defaultMessage:
                    'Sign me up for Salesforce emails (you can unsubscribe at any time)',
                id: 'use_registration_fields.label.sign_up_to_emails'
            }),
            firstNameRequired: formatMessage({
                defaultMessage: 'Please enter your first name.',
                id: 'use_registration_fields.error.required_first_name'
            }),
            lastNameRequired: formatMessage({
                defaultMessage: 'Please enter your last name.',
                id: 'use_registration_fields.error.required_last_name'
            }),
            emailRequired: formatMessage({
                defaultMessage: 'Please enter a valid email address.',
                id: 'use_registration_fields.error.required_email'
            }),
            passwordRequired: formatMessage({
                defaultMessage: 'Please create a password.',
                id: 'use_registration_fields.error.required_password'
            }),
            passwordMinChars: formatMessage({
                defaultMessage: 'Password must contain at least 8 characters.',
                id: 'use_registration_fields.error.minimum_characters'
            }),
            passwordUppercase: formatMessage({
                defaultMessage: 'Password must contain at least one uppercase letter.',
                id: 'use_registration_fields.error.uppercase_letter'
            }),
            passwordLowercase: formatMessage({
                defaultMessage: 'Password must contain at least one lowercase letter.',
                id: 'use_registration_fields.error.lowercase_letter'
            }),
            passwordNumber: formatMessage({
                defaultMessage: 'Password must contain at least one number.',
                id: 'use_registration_fields.error.contain_number'
            }),
            passwordSpecialChar: formatMessage({
                defaultMessage: 'Password must contain at least one special character.',
                id: 'use_registration_fields.error.special_character'
            })
        }),
        [intl]
    )

    const fields = {
        firstName: {
            name: `${prefix}firstName`,
            label: messages.firstNameLabel,
            type: 'text',
            autoComplete: 'given-name',
            defaultValue: '',
            rules: {
                required: messages.firstNameRequired
            },
            error: errors[`${prefix}firstName`],
            control
        },
        lastName: {
            name: `${prefix}lastName`,
            label: messages.lastNameLabel,
            type: 'text',
            defaultValue: '',
            autoComplete: 'family-name',
            rules: {
                required: messages.lastNameRequired
            },
            error: errors[`${prefix}lastName`],
            control
        },
        email: {
            name: `${prefix}email`,
            label: messages.emailLabel,
            placeholder: 'you@email.com',
            type: 'email',
            autoComplete: 'email',
            defaultValue: '',
            rules: {
                required: messages.emailRequired
            },
            error: errors[`${prefix}email`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: messages.passwordLabel,
            type: 'password',
            defaultValue: '',
            rules: {
                required: messages.passwordRequired,
                validate: {
                    hasMinChars: (val) =>
                        validatePassword(val).hasMinChars || messages.passwordMinChars,
                    hasUppercase: (val) =>
                        validatePassword(val).hasUppercase || messages.passwordUppercase,
                    hasLowercase: (val) =>
                        validatePassword(val).hasLowercase || messages.passwordLowercase,
                    hasNumber: (val) => validatePassword(val).hasNumber || messages.passwordNumber,
                    hasSpecialChar: (val) =>
                        validatePassword(val).hasSpecialChar || messages.passwordSpecialChar
                }
            },
            error: errors[`${prefix}password`],
            control
        },
        acceptsMarketing: {
            name: `${prefix}acceptsMarketing`,
            label: messages.acceptsMarketingLabel,
            type: 'checkbox',
            defaultValue: false,
            error: errors[`${prefix}acceptsMarketing`],
            control
        }
    }

    return fields
}
