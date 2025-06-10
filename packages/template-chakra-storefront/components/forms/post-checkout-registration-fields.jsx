/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack, Box} from '@chakra-ui/react'
import useRegistrationFields from './useRegistrationFields'
import PasswordRequirements from './password-requirements'
import Field from '../field'

const PostCheckoutRegistrationFields = ({form, prefix = ''}) => {
    const fields = useRegistrationFields({form, prefix})
    const password = form.watch(`${prefix}password`)

    return (
        <Box>
            <Stack spacing={5}>
                <Field {...fields.email} />

                <Stack spacing={3} paddingBottom={2}>
                    <Field {...fields.password} />
                    <PasswordRequirements value={password} />
                </Stack>
            </Stack>

            <Field {...fields.firstName} type="hidden" />
            <Field {...fields.lastName} type="hidden" />
        </Box>
    )
}

PostCheckoutRegistrationFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default PostCheckoutRegistrationFields
