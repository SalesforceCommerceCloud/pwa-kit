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
import {AlertIcon, BrandLogo} from '../../components/icons'
import StandardLogin from '../../components/standard-login'
import PasswordlessLogin from '../../components/passwordless-login'
import {noop} from '../../utils/utils'

const LoginForm = ({
    submitForm,
    handleForgotPasswordClick,
    handlePasswordlessLoginClick,
    clickCreateAccount = noop,
    form,
    isPasswordlessEnabled = false,
    isSocialEnabled = false,
    idps = [],
    setLoginType
}) => {
    return (
        <Fragment>
            <Stack
                justifyContent="center"
                alignItems="center"
                gap={8}
                marginTop={8}
                marginBottom={8}
            >
                <BrandLogo width="60px" height="auto" />
                <Text textAlign="center" fontSize="xl" fontWeight="semibold">
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
                {form.formState.errors?.global && (
                    <Alert.Root status="error" marginBottom={8}>
                        <Alert.Indicator>
                            <AlertIcon color="red.500" boxSize={4} />
                        </Alert.Indicator>
                        <Alert.Description fontSize="sm">
                            {form.formState.errors.global.message}
                        </Alert.Description>
                    </Alert.Root>
                )}
                <Stack gap={6}>
                    {isPasswordlessEnabled ? (
                        <PasswordlessLogin
                            form={form}
                            handleForgotPasswordClick={handleForgotPasswordClick}
                            handlePasswordlessLoginClick={handlePasswordlessLoginClick}
                            isSocialEnabled={isSocialEnabled}
                            idps={idps}
                            setLoginType={setLoginType}
                        />
                    ) : (
                        <StandardLogin
                            form={form}
                            handleForgotPasswordClick={handleForgotPasswordClick}
                            isSocialEnabled={isSocialEnabled}
                            idps={idps}
                        />
                    )}

                    <Stack direction="row" gap={1} justifyContent="center">
                        <Text fontSize="sm">
                            <FormattedMessage
                                defaultMessage="Don't have an account?"
                                id="login_form.message.dont_have_account"
                            />
                        </Text>
                        <Button
                            variant="link-blue"
                            size="sm"
                            lineHeight="1"
                            onClick={clickCreateAccount}
                        >
                            <FormattedMessage
                                defaultMessage="Create account"
                                id="login_form.action.create_account"
                            />
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Fragment>
    )
}

LoginForm.propTypes = {
    submitForm: PropTypes.func,
    handleForgotPasswordClick: PropTypes.func,
    clickCreateAccount: PropTypes.func,
    handlePasswordlessLoginClick: PropTypes.func,
    form: PropTypes.object,
    isPasswordlessEnabled: PropTypes.bool,
    isSocialEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string),
    setLoginType: PropTypes.func
}

export default LoginForm
