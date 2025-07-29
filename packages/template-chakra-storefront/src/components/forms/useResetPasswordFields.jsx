/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'

export default function useResetPasswordFields({
    form: {
        control,
        formState: {errors}
    },
    prefix = ''
}) {
    const {formatMessage} = useIntl()

    const messages = {
        emailLabel: formatMessage({
            defaultMessage: 'Email',
            id: 'use_reset_password_fields.label.email'
        }),
        emailRequired: formatMessage({
            defaultMessage: 'Please enter a valid email address.',
            id: 'use_reset_password_fields.error.required_email'
        })
    }

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
            error: errors[`${prefix}email`],
            control
        }
    }

    return fields
}
