/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Button, Separator, Stack, Text} from '@chakra-ui/react'
import LoginFields from '../forms/login-fields'
import StandardLogin from '../standard-login'
import SocialLogin from '../social-login'

const PasswordlessLogin = ({
    form,
    handleForgotPasswordClick,
    isSocialEnabled = false,
    idps = []
}) => {
    const intl = useIntl()
    const {formatMessage} = intl
    const [showPasswordView, setShowPasswordView] = useState(false)

    const messages = useMemo(
        () => ({
            continueSecurely: formatMessage({
                id: 'login_form.button.continue_securely',
                defaultMessage: 'Continue Securely'
            }),
            orLoginWith: formatMessage({
                id: 'login_form.message.or_login_with',
                defaultMessage: 'Or Login With'
            }),
            password: formatMessage({
                id: 'login_form.button.password',
                defaultMessage: 'Password'
            })
        }),
        [intl]
    )

    const handlePasswordButton = async (e) => {
        const isValid = await form.trigger()
        // Manually trigger the browser native form validations
        const domForm = e.target.closest('form')
        if (isValid && domForm.checkValidity()) {
            setShowPasswordView(true)
        } else {
            domForm.reportValidity()
        }
    }

    return (
        <>
            {((!form.formState.isSubmitSuccessful && !showPasswordView) ||
                form.formState.errors.email) && (
                <Stack gap={6} paddingLeft={4} paddingRight={4}>
                    <LoginFields
                        form={form}
                        hidePassword={true}
                        handleForgotPasswordClick={handleForgotPasswordClick}
                    />
                    <Button
                        type="submit"
                        onClick={() => {
                            form.clearErrors('global')
                        }}
                        isLoading={form.formState.isSubmitting}
                    >
                        {messages.continueSecurely}
                    </Button>
                    <Separator />
                    <Text textAlign="center" fontSize="sm">
                        {messages.orLoginWith}
                    </Text>
                    <Stack gap={4}>
                        <Button
                            onClick={handlePasswordButton}
                            borderColor="gray.500"
                            color="blue.600"
                            variant="outline"
                        >
                            {messages.password}
                        </Button>
                        {isSocialEnabled && <SocialLogin form={form} idps={idps} />}
                    </Stack>
                </Stack>
            )}
            {!form.formState.isSubmitSuccessful &&
                showPasswordView &&
                !form.formState.errors.email && (
                    <StandardLogin
                        form={form}
                        handleForgotPasswordClick={handleForgotPasswordClick}
                        setShowPasswordView={setShowPasswordView}
                        hideEmail={true}
                    />
                )}
        </>
    )
}

PasswordlessLogin.propTypes = {
    form: PropTypes.object,
    handleForgotPasswordClick: PropTypes.func,
    isSocialEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string),
    hideEmail: PropTypes.bool
}

export default PasswordlessLogin
