/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoginFields from '@salesforce/retail-react-app/app/components/forms/login-fields'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

const StandardLogin = ({form, clickForgotPassword = noop, hideEmail = false}) => {
    return (
        <Stack spacing={8} paddingLeft={4} paddingRight={4}>
            <Stack>
                <LoginFields
                    form={form}
                    hideEmail={hideEmail}
                    clickForgotPassword={clickForgotPassword}
                />
            </Stack>
            <Stack spacing={6}>
                <Button
                    type="submit"
                    onClick={() => {
                        form.clearErrors('global')
                    }}
                    isLoading={form.formState.isSubmitting}
                >
                    <FormattedMessage defaultMessage="Sign In" id="login_form.button.sign_in" />
                </Button>
            </Stack>
        </Stack>
    )
}

StandardLogin.propTypes = {
    clickForgotPassword: PropTypes.func,
    form: PropTypes.object,
    hideEmail: PropTypes.bool
}

export default StandardLogin
