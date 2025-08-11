/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl, defineMessages} from 'react-intl'
import {Button, Separator, Stack, Text} from '@chakra-ui/react'
import LoginFields from '../../components/forms/login-fields'
import SocialLogin from '../../components/social-login'

const messages = defineMessages({
    signIn: {
        defaultMessage: 'Sign In',
        id: 'login_form.button.sign_in'
    },
    orLoginWith: {
        defaultMessage: 'Or Login With',
        id: 'login_form.message.or_login_with'
    },
    backToSignInOptions: {
        defaultMessage: 'Back to Sign In Options',
        id: 'login_form.button.back'
    }
})

const StandardLogin = ({
    form,
    handleForgotPasswordClick,
    hideEmail = false,
    setShowPasswordView,
    //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
    idps = []
}) => {
    const {formatMessage} = useIntl()
    return (
        <Stack gap={8} paddingLeft={4} paddingRight={4}>
            <Stack>
                <LoginFields
                    form={form}
                    hideEmail={hideEmail}
                    handleForgotPasswordClick={handleForgotPasswordClick}
                />
            </Stack>
            <Stack gap={4}>
                <Button
                    type="submit"
                    onClick={() => {
                        form.clearErrors('global')
                    }}
                    isLoading={form.formState.isSubmitting}
                >
                    {formatMessage(messages.signIn)}
                </Button>
                {/* @sfdc-extension-block-start SFDC_EXT_SOCIAL_LOGIN */}
                {idps.length > 0 && (
                    <>
                        <Stack gap={6} paddingTop={2} paddingBottom={2}>
                            <Separator />
                            <Text align="center" fontSize="sm">
                                {formatMessage(messages.orLoginWith)}
                            </Text>
                        </Stack>
                        <SocialLogin form={form} idps={idps} />
                    </>
                )}
                {/* @sfdc-extension-block-end SFDC_EXT_SOCIAL_LOGIN */}
                {hideEmail && (
                    <Button
                        onClick={() => {
                            form.resetField('password')
                            setShowPasswordView(false)
                        }}
                        borderColor="gray.500"
                        color="blue.600"
                        variant="outline"
                    >
                        {formatMessage(messages.backToSignInOptions)}
                    </Button>
                )}
            </Stack>
        </Stack>
    )
}

StandardLogin.propTypes = {
    form: PropTypes.object,
    handleForgotPasswordClick: PropTypes.func,
    hideEmail: PropTypes.bool,
    setShowPasswordView: PropTypes.func,
    //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
    idps: PropTypes.arrayOf(PropTypes.string)
}

export default StandardLogin
