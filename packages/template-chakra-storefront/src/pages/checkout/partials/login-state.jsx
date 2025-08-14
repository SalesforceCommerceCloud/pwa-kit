/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo} from 'react'
import PropTypes from 'prop-types'
import {Button, Separator, Text} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import SocialLogin from '../../../components/social-login'

const LoginState = ({
    form,
    handlePasswordlessLoginClick,
    isPasswordlessEnabled,
    showPasswordField,
    togglePasswordField,
    //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
    idps = []
}) => {
    const intl = useIntl()
    const {formatMessage} = intl
    const [showLoginButtons, setShowLoginButtons] = useState(true)

    const messages = useMemo(
        () => ({
            orLoginWith: formatMessage({
                id: 'contact_info.message.or_login_with',
                defaultMessage: 'Or Login With'
            }),
            secureLink: formatMessage({
                id: 'contact_info.button.secure_link',
                defaultMessage: 'Secure Link'
            }),
            password: formatMessage({
                id: 'contact_info.button.password',
                defaultMessage: 'Password'
            }),
            backToSignInOptions: formatMessage({
                id: 'contact_info.button.back_to_sign_in_options',
                defaultMessage: 'Back to Sign In Options'
            }),
            alreadyHaveAccount: formatMessage({
                id: 'contact_info.button.already_have_account',
                defaultMessage: 'Already have an account? Log in'
            }),
            checkoutAsGuest: formatMessage({
                id: 'contact_info.button.checkout_as_guest',
                defaultMessage: 'Checkout as Guest'
            })
        }),
        [intl]
    )

    // when passwordless enabled, social login buttons will be in the same screen with pwless login
    // when pwless is disabled, the social login buttons will stay in the same screen with standard login
    if (isPasswordlessEnabled) {
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
                {/* @sfdc-extension-block-start SFDC_EXT_SOCIAL_LOGIN */}
                {/* Social Login */}
                {idps.length > 0 && <SocialLogin form={form} idps={idps} />}
                {/* @sfdc-extension-block-end SFDC_EXT_SOCIAL_LOGIN */}
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
            <>
                <Button variant="outline" borderColor="gray.500" onClick={togglePasswordField}>
                    {!showPasswordField ? messages.alreadyHaveAccount : messages.checkoutAsGuest}
                </Button>
                {/* @sfdc-extension-block-start SFDC_EXT_SOCIAL_LOGIN */}
                <Separator />
                <Text textAlign="center" fontSize="sm" marginTop={2} marginBottom={2}>
                    {messages.orLoginWith}
                </Text>
                {/* Social Login */}
                {idps.length > 0 && <SocialLogin form={form} idps={idps} />}
                {/* @sfdc-extension-block-end SFDC_EXT_SOCIAL_LOGIN */}
            </>
        )
    }
}

LoginState.propTypes = {
    form: PropTypes.object,
    handlePasswordlessLoginClick: PropTypes.func,
    isPasswordlessEnabled: PropTypes.bool,
    //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
    idps: PropTypes.arrayOf(PropTypes.string),
    showPasswordField: PropTypes.bool,
    togglePasswordField: PropTypes.func
}

export default LoginState
