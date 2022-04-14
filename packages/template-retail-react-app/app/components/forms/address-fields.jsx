/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Grid, GridItem, SimpleGrid, Stack} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useAddressFields from './useAddressFields'
import Field from '../field'

const AddressFields = ({form, prefix = ''}) => {
    const customer = useCustomer()
    const fields = useAddressFields({form, prefix})

    return (
        <Stack spacing={5}>
            <SimpleGrid columns={[1, 1, 2]} gap={5}>
                <Field {...fields.firstName} />
                <Field {...fields.lastName} />
            </SimpleGrid>
            <Field {...fields.phone} />
            <Field {...fields.countryCode} />
            <Field {...fields.address1} />
            <Field {...fields.city} />
            <Grid templateColumns="repeat(8, 1fr)" gap={5}>
                <GridItem colSpan={[4, 4, 4]}>
                    <Field {...fields.stateCode} />
                </GridItem>
                <GridItem colSpan={[4, 4, 4]}>
                    <Field {...fields.postalCode} />
                </GridItem>
            </Grid>
            {customer.isRegistered && <Field {...fields.preferred} />}
        </Stack>
    )
}

AddressFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string
}

export default AddressFields
