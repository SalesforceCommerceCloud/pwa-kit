/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Divider, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoginFields from '@salesforce/retail-react-app/app/components/forms/login-fields'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import StandardLogin from '../standard-login/index'
import SocialLogin from '@salesforce/retail-react-app/app/components/social-login'

const PasswordlessLogin = ({form, idps, clickForgotPassword = noop}) => {
    const [showPasswordView, setShowPasswordView] = useState(false)

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
                <Stack spacing={6} paddingLeft={4} paddingRight={4}>
                    <LoginFields
                        form={form}
                        hidePassword={true}
                        clickForgotPassword={clickForgotPassword}
                    />
                    <Button
                        type="submit"
                        onClick={() => {
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
                        <SocialLogin idps={idps} />
                    </Stack>
                </Stack>
            )}
            {!form.formState.isSubmitSuccessful &&
                showPasswordView &&
                !form.formState.errors.email && (
                    <StandardLogin
                        form={form}
                        clickForgotPassword={clickForgotPassword}
                        hideEmail={true}
                    />
                )}
        </>
    )
}

PasswordlessLogin.propTypes = {
    form: PropTypes.object,
    idps: PropTypes.arrayOf[PropTypes.string],
    clickForgotPassword: PropTypes.func
}

export default PasswordlessLogin
