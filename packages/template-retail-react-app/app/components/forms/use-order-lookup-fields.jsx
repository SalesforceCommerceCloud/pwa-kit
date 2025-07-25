/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'

export default function useOrderLookupFields({
    form: {
        control,
        formState: {errors}
    },
    prefix = ''
}) {
    const {formatMessage} = useIntl()

    const fields = {
        orderNumber: {
            name: `${prefix}orderNumber`,
            label: formatMessage({
                defaultMessage: 'Order Number',
                id: 'use_order_lookup_fields.label.order_number'
            }),
            placeholder: formatMessage({
                defaultMessage: 'Enter order number',
                id: 'use_order_lookup_fields.placeholder.order_number'
            }),
            type: 'text',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your order number.',
                    id: 'use_order_lookup_fields.error.required_order_number'
                })
            },
            error: errors[`${prefix}orderNumber`],
            control
        },
        email: {
            name: `${prefix}email`,
            label: formatMessage({
                defaultMessage: 'Email',
                id: 'use_order_lookup_fields.label.email'
            }),
            placeholder: formatMessage({
                defaultMessage: 'you@email.com',
                id: 'use_order_lookup_fields.placeholder.email'
            }),
            type: 'email',
            autoComplete: 'email',
            defaultValue: '',
            rules: {
                required: formatMessage({
                    defaultMessage: 'Please enter your email address.',
                    id: 'use_order_lookup_fields.error.required_email'
                })
            },
            error: errors[`${prefix}email`],
            control
        }
    }

    return fields
}
