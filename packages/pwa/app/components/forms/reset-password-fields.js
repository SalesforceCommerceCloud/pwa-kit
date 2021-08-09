/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@chakra-ui/react'
import useResetPasswordFields from './useResetPasswordFields'
import Field from '../field'

const ResetPasswordFields = ({form, prefix = ''}) => {
    const fields = useResetPasswordFields({form, prefix})

    return (
        <Box>
            <Field {...fields.email} />
        </Box>
    )
}

ResetPasswordFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default ResetPasswordFields
