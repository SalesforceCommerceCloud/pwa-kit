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

    const fields = {
        email: {
            name: `${prefix}email`,
            label: formatMessage({
                defaultMessage: 'Email',
                id: 'use_reset_password_fields.label.email'
            }),
            placeholder: 'you@email.com',
            defaultValue: '',
            type: 'email',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter a valid email address.',
                    id: 'use_reset_password_fields.error.required_email'
                })
            },
            error: errors[`${prefix}email`],
            control
        }
    }

    return fields
}
