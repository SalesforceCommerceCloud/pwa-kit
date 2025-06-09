/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {BrandLogo} from '@salesforce/retail-react-app/app/components/icons'


const PasswordlessEmailConfirmation = ({form, submitForm, email = ''}) => {
    const contentRef = useRef(null)

    useEffect(() => {
        // Set focus to the content when component mounts
        if (contentRef.current) {
            contentRef.current.focus()
        }
    }, [])

    return (
        <form
            onSubmit={form.handleSubmit(submitForm)}
            data-testid="sf-form-resend-passwordless-email"
        >
            <Stack spacing={6}>
                {/* Hidden live region for immediate announcement */}
                <div 
                    role="status" 
                    aria-live="assertive" 
                    className="sr-only"
                    style={{position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: '0'}}
                >
                    <FormattedMessage
                        defaultMessage="Check Your Email. We just sent a login link to {email}"
                        id="auth_modal.check_email.announcement"
                        values={{email}}
                    />
                </div>

                <Stack 
                    justify="center" 
                    align="center" 
                    spacing={6} 
                    role="alertdialog"
                    aria-labelledby="email-confirmation-title"
                    aria-describedby="email-confirmation-desc email-confirmation-spam"
                    ref={contentRef}
                    tabIndex="-1"
                >
                    <BrandLogo width="60px" height="auto" aria-hidden={true} />
                    <Text 
                        align="center" 
                        fontSize="xl" 
                        fontWeight="semibold"
                        id="email-confirmation-title"
                    >
                        <FormattedMessage
                            defaultMessage="Check Your Email"
                            id="auth_modal.check_email.title.check_your_email"
                        />
                    </Text>
                    <Stack spacing={10}>
                        <Text 
                            align="center" 
                            fontSize="md"
                            id="email-confirmation-desc"
                        >
                            <FormattedMessage
                                defaultMessage="We just sent a login link to <b>{email}</b>"
                                id="auth_modal.check_email.description.just_sent"
                                values={{
                                    email: email,
                                    b: (chunks) => <b>{chunks}</b>
                                }}
                            />
                        </Text>
                        <Text 
                            align="center" 
                            fontSize="sm"
                            id="email-confirmation-spam"
                        >
                            <FormattedMessage
                                defaultMessage="The link may take a few minutes to arrive, check your spam folder if you're having trouble finding it"
                                id="auth_modal.check_email.description.check_spam_folder"
                            />
                        </Text>
                    </Stack>
                </Stack>
                <Button type="submit">
                    <FormattedMessage
                        defaultMessage="Resend Link"
                        id="auth_modal.check_email.button.resend_link"
                        aria-label="Resend Link"
                    />
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
