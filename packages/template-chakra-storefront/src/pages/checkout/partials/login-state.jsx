/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Button, Separator, Text} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import SocialLogin from '../../../components/social-login'

const LoginState = ({
    form,
    handlePasswordlessLoginClick,
    isSocialEnabled,
    isPasswordlessEnabled,
    idps,
    showPasswordField,
    togglePasswordField
}) => {
    const {formatMessage} = useIntl()
    const [showLoginButtons, setShowLoginButtons] = useState(true)

    const messages = {
        orLoginWith: formatMessage({
            id: "contact_info.message.or_login_with",
            defaultMessage: "Or Login With"
        }),
        secureLink: formatMessage({
            id: "contact_info.button.secure_link",
            defaultMessage: "Secure Link"
        }),
        password: formatMessage({
            id: "contact_info.button.password",
            defaultMessage: "Password"
        }),
        backToSignInOptions: formatMessage({
            id: "contact_info.button.back_to_sign_in_options",
            defaultMessage: "Back to Sign In Options"
        }),
        alreadyHaveAccount: formatMessage({
            id: "contact_info.button.already_have_account",
            defaultMessage: "Already have an account? Log in"
        }),
        checkoutAsGuest: formatMessage({
            id: "contact_info.button.checkout_as_guest",
            defaultMessage: "Checkout as Guest"
        })
    }

    if (isSocialEnabled || isPasswordlessEnabled) {
        return showLoginButtons ? (
            <>
                <Separator />
                <Text textAlign="center" fontSize="sm" marginTop={2} marginBottom={2}>
                    {messages.orLoginWith}
                </Text>

                {/* Passwordless Login */}
                {isPasswordlessEnabled && (
                    <Button
                        variant="outline"
                        borderColor="gray.500"
                        type="button"
                        onClick={(e) => {
                            handlePasswordlessLoginClick(e)
                        }}
                        isLoading={form.formState.isSubmitting}
                    >
                        {messages.secureLink}
                    </Button>
                )}

                {/* Standard Password Login */}
                {!showPasswordField && (
                    <Button
                        variant="outline"
                        borderColor="gray.500"
                        onClick={() => {
                            togglePasswordField()
                            setShowLoginButtons(!showLoginButtons)
                        }}
                    >
                        {messages.password}
                    </Button>
                )}
                {/* Social Login */}
                {isSocialEnabled && idps && <SocialLogin form={form} idps={idps} />}
            </>
        ) : (
            <Button
                variant="outline"
                borderColor="gray.500"
                onClick={() => {
                    togglePasswordField()
                    setShowLoginButtons(!showLoginButtons)
                }}
            >
                {messages.backToSignInOptions}
            </Button>
        )
    } else {
        return (
            <Button variant="outline" borderColor="gray.500" onClick={togglePasswordField}>
                {!showPasswordField ? messages.alreadyHaveAccount : messages.checkoutAsGuest}
            </Button>
        )
    }
}

LoginState.propTypes = {
    form: PropTypes.object,
    handlePasswordlessLoginClick: PropTypes.func,
    isSocialEnabled: PropTypes.bool,
    isPasswordlessEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string),
    showPasswordField: PropTypes.bool,
    togglePasswordField: PropTypes.func
}

export default LoginState
