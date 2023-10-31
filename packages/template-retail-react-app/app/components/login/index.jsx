/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Alert,
    Box,
    Button,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AlertIcon, BrandLogo} from '@salesforce/retail-react-app/app/components/icons'
import LoginFields from '@salesforce/retail-react-app/app/components/forms/login-fields'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

const LoginForm = ({submitForm, clickForgotPassword = noop, clickCreateAccount = noop, form}) => {
    return (
        <Fragment>
            <Stack justify="center" align="center" spacing={8} marginBottom={8}>
                <BrandLogo width="60px" height="auto" />
                <Text align="center" fontSize="xl" fontWeight="semibold">
                    <FormattedMessage
                        defaultMessage="Welcome Back"
                        id="login_form.message.welcome_back"
                    />
                </Text>
            </Stack>
            <form
                id="login-form"
                onSubmit={form.handleSubmit(submitForm)}
                data-testid="sf-auth-modal-form"
            >
                <Stack spacing={8} paddingLeft={4} paddingRight={4}>
                    {form.formState.errors?.global && (
                        <Alert status="error">
                            <AlertIcon color="red.500" boxSize={4} />
                            <Text fontSize="sm" ml={3}>
                                {form.formState.errors.global.message}
                            </Text>
                        </Alert>
                    )}
                    <Stack>
                        <LoginFields form={form} />

                        <Box>
                            <Button variant="link" size="sm" onClick={clickForgotPassword}>
                                <FormattedMessage
                                    defaultMessage="Forgot password?"
                                    id="login_form.link.forgot_password"
                                />
                            </Button>
                        </Box>
                    </Stack>
                    <Stack spacing={6}>
                        <Button
                            type="submit"
                            onClick={() => {
                                form.clearErrors('global')
                            }}
                            isLoading={form.formState.isSubmitting}
                        >
                            <FormattedMessage
                                defaultMessage="Sign In"
                                id="login_form.button.sign_in"
                            />
                        </Button>

                        <Stack direction="row" spacing={1} justify="center">
                            <Text fontSize="sm">
                                <FormattedMessage
                                    defaultMessage="Don't have an account?"
                                    id="login_form.message.dont_have_account"
                                />
                            </Text>
                            <Button variant="link" size="sm" onClick={clickCreateAccount}>
                                <FormattedMessage
                                    defaultMessage="Create account"
                                    id="login_form.action.create_account"
                                />
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </form>
        </Fragment>
    )
}

LoginForm.propTypes = {
    submitForm: PropTypes.func,
    clickForgotPassword: PropTypes.func,
    clickCreateAccount: PropTypes.func,
    form: PropTypes.object
}

export default LoginForm
