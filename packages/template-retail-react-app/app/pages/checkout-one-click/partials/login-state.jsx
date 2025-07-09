/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Button, Divider, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage} from 'react-intl'
import SocialLogin from '@salesforce/retail-react-app/app/components/social-login'

const LoginState = ({
    form,
    handlePasswordlessLoginClick,
    isSocialEnabled,
    isPasswordlessEnabled,
    idps,
    showPasswordField,
    togglePasswordField
}) => {
    const [showLoginButtons, setShowLoginButtons] = useState(true)

    if (isSocialEnabled || isPasswordlessEnabled) {
        return showLoginButtons ? (
            <>
                <Divider />
                <Text align="center" fontSize="sm" marginTop={2} marginBottom={2}>
                    <FormattedMessage
                        defaultMessage="Or Login With"
                        id="contact_info.message.or_login_with"
                    />
                </Text>

                {/* Passwordless Login */}
                {isPasswordlessEnabled && (
                    <Button
                        variant="outline"
                        borderColor="gray.500"
                        type="submit"
                        onClick={() => {
                            handlePasswordlessLoginClick()
                        }}
                        isLoading={form.formState.isSubmitting}
                    >
                        <FormattedMessage
                            defaultMessage="Secure Link"
                            id="contact_info.button.secure_link"
                        />
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
                        <FormattedMessage
                            defaultMessage="Password"
                            id="contact_info.button.password"
                        />
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
                <FormattedMessage
                    defaultMessage="Back to Sign In Options"
                    id="contact_info.button.back_to_sign_in_options"
                />
            </Button>
        )
    } else {
        return (
            <Button variant="outline" borderColor="gray.500" onClick={togglePasswordField}>
                {!showPasswordField ? (
                    <FormattedMessage
                        defaultMessage="Already have an account? Log in"
                        id="contact_info.button.already_have_account"
                    />
                ) : (
                    <FormattedMessage
                        defaultMessage="Checkout as Guest"
                        id="contact_info.button.checkout_as_guest"
                    />
                )}
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
