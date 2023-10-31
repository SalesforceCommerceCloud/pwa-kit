/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {SimpleGrid, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import useProfileFields from '@salesforce/retail-react-app/app/components/forms/useProfileFields'
import Field from '@salesforce/retail-react-app/app/components/field'

const ProfileFields = ({form, prefix = ''}) => {
    const fields = useProfileFields({form, prefix})

    return (
        <Stack spacing={5}>
            <SimpleGrid columns={[1, 1, 1, 2]} spacing={5}>
                <Field {...fields.firstName} />
                <Field {...fields.lastName} />
            </SimpleGrid>
            <Field {...fields.email} />
            <Field {...fields.phone} />
        </Stack>
    )
}

ProfileFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default ProfileFields
