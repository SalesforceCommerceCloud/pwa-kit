/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Stack, StackDivider} from '@chakra-ui/react'
import useUpdatePasswordFields from './useUpdatePasswordFields'
import Field from '../field'
import PasswordRequirements from './password-requirements'

const UpdatePasswordFields = ({form, prefix = ''}) => {
    const fields = useUpdatePasswordFields({form, prefix})
    const password = form.watch('password')

    return (
        <Stack spacing={5} divider={<StackDivider borderColor="gray.100" />}>
            <Stack>
                <Field {...fields.currentPassword} />
                <Box>
                    <Button variant="link" size="sm" onClick={() => null}>
                        <FormattedMessage defaultMessage="Forgot password?" />
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
