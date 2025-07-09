/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Stack, Box, Button} from '@chakra-ui/react'
import useLoginFields from './useLoginFields'
import Field from '../field'

const LoginFields = ({
    form,
    handleForgotPasswordClick,
    prefix = '',
    hideEmail = false,
    hidePassword = false
}) => {
    const fields = useLoginFields({form, prefix})
    return (
        <Stack spacing={5}>
            {!hideEmail && <Field {...fields.email} />}
            {!hidePassword && (
                <Stack>
                    <Field {...fields.password} />
                    {handleForgotPasswordClick && (
                        <Box>
                            <Button variant="link" size="sm" onClick={handleForgotPasswordClick}>
                                <FormattedMessage
                                    defaultMessage="Forgot password?"
                                    id="login_form.link.forgot_password"
                                />
                            </Button>
                        </Box>
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
