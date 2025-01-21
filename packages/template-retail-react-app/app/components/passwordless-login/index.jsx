/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Divider, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoginFields from '@salesforce/retail-react-app/app/components/forms/login-fields'
import StandardLogin from '@salesforce/retail-react-app/app/components/standard-login'
import SocialLogin from '@salesforce/retail-react-app/app/components/social-login'
import {LOGIN_TYPES} from '@salesforce/retail-react-app/app/constants'

const PasswordlessLogin = ({
    form,
    handleForgotPasswordClick,
    handlePasswordlessLoginClick,
    isSocialEnabled = false,
    idps = [],
    setLoginType
}) => {
    const [showPasswordView, setShowPasswordView] = useState(false)

    const handlePasswordButton = async (e) => {
        setLoginType(LOGIN_TYPES.PASSWORD)
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
                <Stack spacing={6} paddingLeft={4} paddingRight={4}>
                    <LoginFields
                        form={form}
                        hidePassword={true}
                        handleForgotPasswordClick={handleForgotPasswordClick}
                    />
                    <Button
                        type="submit"
                        onClick={() => {
                            handlePasswordlessLoginClick()
                            form.clearErrors('global')
                        }}
                        isLoading={form.formState.isSubmitting}
                    >
                        <FormattedMessage
                            defaultMessage="Continue Securely"
                            id="login_form.button.continue_securely"
                        />
                    </Button>
                    <Divider />
                    <Text align="center" fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Or Login With"
                            id="login_form.message.or_login_with"
                        />
                    </Text>
                    <Stack spacing={4}>
                        <Button
                            onClick={handlePasswordButton}
                            borderColor="gray.500"
                            color="blue.600"
                            variant="outline"
                        >
                            <FormattedMessage
                                defaultMessage="Password"
                                id="login_form.button.password"
                            />
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
    handlePasswordlessLoginClick: PropTypes.func,
    isSocialEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string),
    hideEmail: PropTypes.bool,
    setLoginType: PropTypes.func
}

export default PasswordlessLogin
