/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'

export default function useLoginFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        email: {
            name: `${prefix}email`,
            label: formatMessage({defaultMessage: 'Email', id: 'use_login_fields.label.email'}),
            placeholder: 'you@email.com',
            defaultValue: '',
            type: 'email',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your email address.',
                    id: 'use_login_fields.error.required_email'
                })
            },
            error: errors[`${prefix}email`],
            control
        },
        password: {
            name: `${prefix}password`,
            label: formatMessage({
                defaultMessage: 'Password',
                id: 'use_login_fields.label.password'
            }),
            defaultValue: '',
            type: 'password',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your password.',
                    id: 'use_login_fields.error.required_password'
                })
            },
            error: errors[`${prefix}password`],
            control
        }
    }

    return fields
}
