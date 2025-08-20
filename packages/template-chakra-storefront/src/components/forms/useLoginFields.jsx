/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import {useIntl} from 'react-intl'

export function useLoginFields({
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
            emailLabel: formatMessage({
                id: 'use_login_fields.label.email',
                defaultMessage: 'Email'
            }),
            passwordLabel: formatMessage({
                id: 'use_login_fields.label.password',
                defaultMessage: 'Password'
            }),
            emailRequired: formatMessage({
                id: 'use_login_fields.error.required_email',
                defaultMessage: 'Please enter your email address.'
            }),
            passwordRequired: formatMessage({
                id: 'use_login_fields.error.required_password',
                defaultMessage: 'Please enter your password.'
            })
        }),
        [intl]
    )

    const fields = {
        email: {
            name: `${prefix}email`,
            label: messages.emailLabel,
            placeholder: 'you@email.com',
            defaultValue: '',
            type: 'email',
            autoComplete: 'email',
            rules: {
                required: messages.emailRequired
            },
            error: errors?.[`${prefix}email`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: messages.passwordLabel,
            defaultValue: '',
            type: 'password',
            rules: {
                required: messages.passwordRequired
            },
            error: errors?.[`${prefix}password`],
            control
        }
    }
    return fields
}
