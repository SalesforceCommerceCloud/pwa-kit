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

const PasswordlessLogin = ({form, clickForgotPassword = noop}) => {
    const [showPasswordView, setShowPasswordView] = useState(false)

    return !showPasswordView ? (
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
                    // TODO: Translations
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
            <Button
                onClick={() => {
                    form.clearErrors('global')
                    setShowPasswordView(true)
                }}
                borderColor="gray.500"
                color="blue.600"
                variant="outline"
            >
                <FormattedMessage
                    defaultMessage="Password"
                    // TODO: Translations
                    id="login_form.button.password"
                />
            </Button>
        </Stack>
    ) : (
        <StandardLogin form={form} clickForgotPassword={clickForgotPassword} hideEmail={true} />
    )
}

PasswordlessLogin.propTypes = {
    clickForgotPassword: PropTypes.func,
    form: PropTypes.object
}

export default PasswordlessLogin
