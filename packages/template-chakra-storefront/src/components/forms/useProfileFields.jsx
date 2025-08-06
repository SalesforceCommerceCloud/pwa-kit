/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import {useIntl} from 'react-intl'
import {formatPhoneNumber} from '../../utils/phone-utils'

export default function useProfileFields({
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
                id: 'use_profile_fields.label.first_name'
            }),
            lastNameLabel: formatMessage({
                defaultMessage: 'Last Name',
                id: 'use_profile_fields.label.last_name'
            }),
            emailLabel: formatMessage({
                defaultMessage: 'Email',
                id: 'use_profile_fields.label.email'
            }),
            phoneLabel: formatMessage({
                defaultMessage: 'Phone Number',
                id: 'use_profile_fields.label.phone'
            }),
            firstNameRequired: formatMessage({
                defaultMessage: 'Please enter your first name.',
                id: 'use_profile_fields.error.required_first_name'
            }),
            lastNameRequired: formatMessage({
                defaultMessage: 'Please enter your last name.',
                id: 'use_profile_fields.error.required_last_name'
            }),
            emailRequired: formatMessage({
                defaultMessage: 'Please enter a valid email address.',
                id: 'use_profile_fields.error.required_email'
            }),
            phoneRequired: formatMessage({
                defaultMessage: 'Please enter your phone number.',
                id: 'use_profile_fields.error.required_phone'
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
            defaultValue: '',
            autoComplete: 'email',
            rules: {
                required: messages.emailRequired
            },
            error: errors[`${prefix}email`],
            control
        },
        phone: {
            name: `${prefix}phone`,
            label: messages.phoneLabel,
            defaultValue: '',
            type: 'tel',
            autoComplete: 'tel',
            rules: {
                required: messages.phoneRequired
            },
            error: errors[`${prefix}phone`],
            inputProps: ({onChange}) => ({
                inputMode: 'numeric',
                onChange(evt) {
                    onChange(formatPhoneNumber(evt.target.value))
                }
            }),
            control
        }
    }

    return fields
}
