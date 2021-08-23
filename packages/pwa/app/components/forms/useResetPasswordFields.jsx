/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'

export default function useResetPasswordFields({form: {control, errors}, prefix = ''}) {
    const {formatMessage} = useIntl()

    const fields = {
        email: {
            name: `${prefix}email`,
            label: formatMessage({defaultMessage: 'Email'}),
            placeholder: 'you@email.com',
            defaultValue: '',
            type: 'email',
            rules: {
                required: formatMessage({defaultMessage: 'Please enter a valid email address'})
            },
            error: errors[`${prefix}email`],
            control
        }
    }

    return fields
}
