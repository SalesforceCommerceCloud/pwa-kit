/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import {useIntl} from 'react-intl'

export default function usePromoCodeFields({
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
            codeLabel: formatMessage({
                defaultMessage: 'Promo Code',
                id: 'use_promo_code_fields.label.promo_code'
            }),
            codeRequired: formatMessage({
                defaultMessage: 'Please provide a valid promo code.',
                id: 'use_promo_code_fields.error.required_promo_code'
            })
        }),
        [intl]
    )

    const fields = {
        code: {
            name: `${prefix}code`,
            label: messages.codeLabel,
            type: 'text',
            defaultValue: '',
            rules: {
                required: messages.codeRequired
            },
            error: errors[`${prefix}code`],
            control
        }
    }

    return fields
}
