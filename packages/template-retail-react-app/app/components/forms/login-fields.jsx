/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import useLoginFields from '@salesforce/retail-react-app/app/components/forms/useLoginFields'
import Field from '@salesforce/retail-react-app/app/components/field'

const LoginFields = ({form, prefix = ''}) => {
    const fields = useLoginFields({form, prefix})
    return (
        <Stack spacing={5}>
            <Field {...fields.email} />
            <Field {...fields.password} />
        </Stack>
    )
}

LoginFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default LoginFields
