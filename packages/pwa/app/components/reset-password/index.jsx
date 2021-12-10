/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Alert, Button, Stack, Text} from '@chakra-ui/react'
import {AlertIcon, BrandLogo} from '../icons'
import {noop} from '../../utils/utils'
import ResetPasswordFields from '../forms/reset-password-fields'

const ResetPasswordForm = ({submitForm, clickSignIn = noop, form}) => {
    return (
        <Fragment>
            <Stack justify="center" align="center" spacing={8}>
                <BrandLogo width="60px" height="auto" />
                <Stack spacing={2}>
                    <Text align="center" fontSize="xl" fontWeight="semibold">
                        <FormattedMessage
                            defaultMessage="Reset Password"
                            id="reset_password_form.title.reset_password"
                        />
                    </Text>
                    <Text fontSize="sm" align="center" color="gray.700">
                        <FormattedMessage
                            defaultMessage="Enter your email to receive instructions on how to reset your password"
                            id="reset_password_form.message.enter_your_email"
                        />
                    </Text>
                </Stack>
            </Stack>
            <form onSubmit={form.handleSubmit(submitForm)} data-testid="sf-auth-modal-form">
                <Stack paddingTop={8} spacing={8} paddingLeft={4} paddingRight={4}>
                    {form.errors?.global && (
                        <Alert status="error">
                            <AlertIcon color="red.500" boxSize={4} />
                            <Text fontSize="sm" ml={3}>
                                {form.errors.global.message}
                            </Text>
                        </Alert>
                    )}
                    <ResetPasswordFields form={form} />
                    <Stack spacing={6}>
                        <Button
                            type="submit"
                            onClick={() => form.clearErrors('global')}
                            isLoading={form.formState.isSubmitting}
                        >
                            <FormattedMessage
                                defaultMessage="Reset Password"
                                id="reset_password_form.button.reset_password"
                            />
                        </Button>

                        <Stack direction="row" spacing={1} justify="center">
                            <Text fontSize="sm">
                                <FormattedMessage
                                    defaultMessage="Or return to"
                                    id="reset_password_form.message.return_to_sign_in"
                                    description="Precedes link to return to sign in"
                                />
                            </Text>
                            <Button variant="link" size="sm" onClick={clickSignIn}>
                                <FormattedMessage
                                    defaultMessage="Sign in"
                                    id="reset_password_form.action.sign_in"
                                />
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </form>
        </Fragment>
    )
}

ResetPasswordForm.propTypes = {
    submitForm: PropTypes.func,
    clickSignIn: PropTypes.func,
    form: PropTypes.object
}

export default ResetPasswordForm
