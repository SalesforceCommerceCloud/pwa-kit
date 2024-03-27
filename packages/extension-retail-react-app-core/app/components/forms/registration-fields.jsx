/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import useRegistrationFields from '@salesforce/retail-react-app/app/components/forms/useRegistrationFields'
import Field from '@salesforce/retail-react-app/app/components/field'
import PasswordRequirements from '@salesforce/retail-react-app/app/components/forms/password-requirements'

const RegistrationFields = ({form, prefix = ''}) => {
    const fields = useRegistrationFields({form, prefix})
    const password = form.watch('password')

    return (
        <Stack spacing={5}>
            <Field {...fields.firstName} />
            <Field {...fields.lastName} />
            <Field {...fields.email} />

            <Stack spacing={3} pb={2}>
                <Field {...fields.password} />
                <PasswordRequirements value={password} />
            </Stack>

            <Field {...fields.acceptsMarketing} inputProps={{alignItems: 'flex-start'}} />
        </Stack>
    )
}

RegistrationFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default RegistrationFields
