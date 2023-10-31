/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Stack,
    StackDivider
} from '@salesforce/retail-react-app/app/components/shared/ui'
import useUpdatePasswordFields from '@salesforce/retail-react-app/app/components/forms/useUpdatePasswordFields'
import Field from '@salesforce/retail-react-app/app/components/field'
import PasswordRequirements from '@salesforce/retail-react-app/app/components/forms/password-requirements'

const UpdatePasswordFields = ({form, prefix = ''}) => {
    const fields = useUpdatePasswordFields({form, prefix})
    const password = form.watch('password')

    return (
        <Stack spacing={5} divider={<StackDivider borderColor="gray.100" />}>
            <Stack>
                <Field {...fields.currentPassword} />
                <Box>
                    <Button variant="link" size="sm" onClick={() => null}>
                        <FormattedMessage
                            defaultMessage="Forgot Password?"
                            id="update_password_fields.button.forgot_password"
                        />
                    </Button>
                </Box>
            </Stack>

            <Stack spacing={3} pb={2}>
                <Field {...fields.password} />
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
