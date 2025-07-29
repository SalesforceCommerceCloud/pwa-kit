/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Button, Stack, StackSeparator} from '@chakra-ui/react'
import useUpdatePasswordFields from '../../components/forms/useUpdatePasswordFields'
import Field from '../../components/field'
import PasswordRequirements from '../../components/forms/password-requirements'

const UpdatePasswordFields = ({form, prefix = ''}) => {
    const {formatMessage} = useIntl()
    const fields = useUpdatePasswordFields({form, prefix})
    const password = form.watch('password')

    const messages = {
        forgotPassword: formatMessage({
            id: 'update_password_fields.button.forgot_password',
            defaultMessage: 'Forgot Password?'
        })
    }

    return (
        <Stack gap={5} separator={<StackSeparator borderColor="gray.100" />}>
            <Stack>
                <Field {...fields.currentPassword} />
                <Box>
                    <Button variant="link" size="sm" onClick={() => null}>
                        {messages.forgotPassword}
                    </Button>
                </Box>
            </Stack>

            <Stack gap={3} pb={2}>
                <Field {...fields.password} />
                <Field {...fields.confirmPassword} />
                <PasswordRequirements value={password} />
            </Stack>
        </Stack>
    )
}

UpdatePasswordFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default UpdatePasswordFields
