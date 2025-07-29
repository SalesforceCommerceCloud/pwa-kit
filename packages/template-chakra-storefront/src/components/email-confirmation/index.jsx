/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Button, Stack, Text} from '@chakra-ui/react'
import {BrandLogo} from '../../components/icons'

const PasswordlessEmailConfirmation = ({form, submitForm, email = ''}) => {
    const {formatMessage} = useIntl()
    
    const messages = {
        title: formatMessage({
            id: 'auth_modal.check_email.title.check_your_email',
            defaultMessage: 'Check Your Email'
        }),
        justSent: formatMessage(
            {
                id: 'auth_modal.check_email.description.just_sent',
                defaultMessage: 'We just sent a login link to <b>{email}</b>'
            },
            {
                email: email,
                b: (chunks) => <b>{chunks}</b>
            }
        ),
        checkSpam: formatMessage({
            id: 'auth_modal.check_email.description.check_spam_folder',
            defaultMessage: "The link may take a few minutes to arrive, check your spam folder if you're having trouble finding it"
        }),
        resendLink: formatMessage({
            id: 'auth_modal.check_email.button.resend_link',
            defaultMessage: 'Resend Link'
        })
    }
    
    return (
        <form
            onSubmit={form.handleSubmit(submitForm)}
            data-testid="sf-form-resend-passwordless-email"
        >
            <Stack gap={6}>
                <Stack justify="center" align="center" gap={6} role="alert">
                    <BrandLogo width="60px" height="auto" aria-hidden={true} />
                    <Text textAlign="center" fontSize="xl" fontWeight="semibold">
                        {messages.title}
                    </Text>
                    <Stack gap={10}>
                        <Text textAlign="center" fontSize="md">
                            {messages.justSent}
                        </Text>
                        <Text textAlign="center" fontSize="sm">
                            {messages.checkSpam}
                        </Text>
                    </Stack>
                </Stack>
                <Button type="submit">
                    {messages.resendLink}
                </Button>
            </Stack>
        </form>
    )
}

PasswordlessEmailConfirmation.propTypes = {
    form: PropTypes.object,
    submitForm: PropTypes.func,
    email: PropTypes.string
}

export default PasswordlessEmailConfirmation
