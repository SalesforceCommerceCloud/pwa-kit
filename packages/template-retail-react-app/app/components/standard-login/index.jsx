/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Divider, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoginFields from '@salesforce/retail-react-app/app/components/forms/login-fields'
import SocialLogin from '@salesforce/retail-react-app/app/components/social-login'

const StandardLogin = ({
    form,
    handleForgotPasswordClick,
    hideEmail = false,
    isSocialEnabled = false,
    setShowPasswordView,
    idps = []
}) => {
    return (
        <Stack spacing={8} paddingLeft={4} paddingRight={4}>
            <Stack>
                <LoginFields
                    form={form}
                    hideEmail={hideEmail}
                    handleForgotPasswordClick={handleForgotPasswordClick}
                />
            </Stack>
            <Stack spacing={4}>
                <Button
                    type="submit"
                    onClick={() => {
                        form.clearErrors('global')
                    }}
                    isLoading={form.formState.isSubmitting}
                >
                    <FormattedMessage defaultMessage="Sign In" id="login_form.button.sign_in" />
                </Button>
                {isSocialEnabled && idps.length > 0 && (
                    <>
                        <Stack spacing={6} paddingTop={2} paddingBottom={2}>
                            <Divider />
                            <Text align="center" fontSize="sm">
                                <FormattedMessage
                                    defaultMessage="Or Login With"
                                    id="login_form.message.or_login_with"
                                />
                            </Text>
                        </Stack>
                        <SocialLogin form={form} idps={idps} />
                    </>
                )}
                {hideEmail && (
                    <Button
                        onClick={() => setShowPasswordView(false)}
                        borderColor="gray.500"
                        color="blue.600"
                        variant="outline"
                    >
                        <FormattedMessage
                            defaultMessage="Back to Sign In Options"
                            id="login_form.button.back"
                        />
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
    isSocialEnabled: PropTypes.bool,
    setShowPasswordView: PropTypes.func,
    idps: PropTypes.arrayOf(PropTypes.string)
}

export default StandardLogin
