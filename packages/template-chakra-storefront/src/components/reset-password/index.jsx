/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Alert, Button, Stack, Text} from '@chakra-ui/react'
import {AlertIcon, BrandLogo} from '../../components/icons'
import {noop} from '../../utils/utils'
import ResetPasswordFields from '../../components/forms/reset-password-fields'

const ResetPasswordForm = ({submitForm, clickSignIn = noop, form}) => {
    const {formatMessage} = useIntl()

    const messages = {
        title: formatMessage({
            id: 'reset_password_form.title.reset_password',
            defaultMessage: 'Reset Password'
        }),
        description: formatMessage({
            id: 'reset_password_form.message.enter_your_email',
            defaultMessage: 'Enter your email to receive instructions on how to reset your password'
        }),
        resetPasswordButton: formatMessage({
            id: 'reset_password_form.button.reset_password',
            defaultMessage: 'Reset Password'
        }),
        returnToSignIn: formatMessage({
            id: 'reset_password_form.message.return_to_sign_in',
            defaultMessage: 'Or return to'
        }),
        signInButton: formatMessage({
            id: 'reset_password_form.action.sign_in',
            defaultMessage: 'Sign in'
        }),
        passwordResetSuccess: formatMessage({
            id: 'auth_modal.password_reset_success.title.password_reset',
            defaultMessage: 'Password Reset'
        }),
        emailSentMessage: formatMessage(
            {
                id: 'auth_modal.password_reset_success.info.will_email_shortly',
                defaultMessage:
                    'You will receive an email at <b>{email}</b> with a link to reset your password shortly.'
            },
            {
                email: form.getValues('email'),
                b: (chunks) => <b>{chunks}</b>
            }
        ),
        backToSignInButton: formatMessage({
            id: 'auth_modal.password_reset_success.button.back_to_sign_in',
            defaultMessage: 'Back to Sign In'
        })
    }
    return (
        <Fragment>
            {!form.formState.isSubmitSuccessful ? (
                <>
                    <Stack justify="center" align="center" gap={8}>
                        <BrandLogo width="60px" height="auto" />
                        <Stack gap={2}>
                            <Text textAlign="center" fontSize="xl" fontWeight="semibold">
                                {messages.title}
                            </Text>
                            <Text fontSize="sm" textAlign="center" color="gray.700">
                                {messages.description}
                            </Text>
                        </Stack>
                    </Stack>
                    <form onSubmit={form.handleSubmit(submitForm)} data-testid="sf-auth-modal-form">
                        <Stack pt={8} gap={8} pl={4} pr={4}>
                            {form.formState.errors?.global && (
                                <Alert.Root status="error">
                                    <Alert.Indicator>
                                        <AlertIcon color="red.500" boxSize={4} />
                                    </Alert.Indicator>
                                    <Alert.Title fontSize="sm" ml={3}>
                                        {form.formState.errors.global.message}
                                    </Alert.Title>
                                </Alert.Root>
                            )}
                            <ResetPasswordFields form={form} />
                            <Stack gap={6}>
                                <Button
                                    type="submit"
                                    onClick={() => form.clearErrors('global')}
                                    loading={form.formState.isSubmitting}
                                >
                                    {messages.resetPasswordButton}
                                </Button>

                                <Stack direction="row" gap={1} justify="center">
                                    <Text fontSize="sm">{messages.returnToSignIn}</Text>
                                    <Button
                                        variant="link-blue"
                                        size="sm"
                                        lineHeight="1"
                                        onClick={clickSignIn}
                                    >
                                        {messages.signInButton}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    </form>
                </>
            ) : (
                <Stack justify="center" align="center" gap={6}>
                    <BrandLogo width="60px" height="auto" />
                    <Text textAlign="center" fontSize="xl" fontWeight="semibold">
                        {messages.passwordResetSuccess}
                    </Text>
                    <Stack gap={6} pt={4}>
                        <Text textAlign="center" fontSize="sm">
                            {messages.emailSentMessage}
                        </Text>

                        <Button onClick={clickSignIn}>{messages.backToSignInButton}</Button>
                    </Stack>
                </Stack>
            )}
        </Fragment>
    )
}

ResetPasswordForm.propTypes = {
    submitForm: PropTypes.func,
    clickSignIn: PropTypes.func,
    form: PropTypes.object
}

export default ResetPasswordForm
