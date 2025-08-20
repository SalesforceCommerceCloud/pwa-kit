/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Stack, Flex, Button} from '@chakra-ui/react'
import {useLoginFields} from '../../components/forms/useLoginFields'
import Field from '../../components/field'

const LoginFields = ({
    form,
    handleForgotPasswordClick,
    prefix = '',
    hideEmail = false,
    hidePassword = false
}) => {
    const intl = useIntl()
    const fields = useLoginFields({form, prefix})

    const messages = useMemo(
        () => ({
            forgotPassword: intl.formatMessage({
                id: 'login_form.link.forgot_password',
                defaultMessage: 'Forgot password?'
            })
        }),
        [intl]
    )

    return (
        <Stack gap={5}>
            {!hideEmail && <Field {...fields.email} />}
            {!hidePassword && (
                <Stack>
                    <Field {...fields.password} />
                    {handleForgotPasswordClick && (
                        <Flex>
                            <Button
                                variant="link-blue"
                                size="sm"
                                onClick={handleForgotPasswordClick}
                            >
                                {messages.forgotPassword}
                            </Button>
                        </Flex>
                    )}
                </Stack>
            )}
        </Stack>
    )
}

LoginFields.propTypes = {
    handleForgotPasswordClick: PropTypes.func,

    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string,

    /** Optional configurations */
    hideEmail: PropTypes.bool,
    hidePassword: PropTypes.bool
}

export default LoginFields
