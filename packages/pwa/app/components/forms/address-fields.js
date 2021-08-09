import React from 'react'
import PropTypes from 'prop-types'
import {Grid, GridItem, SimpleGrid, Stack} from '@chakra-ui/react'
import useAddressFields from './useAddressFields'
import Field from '../field'

// TODO: use isGuest to toggle a new checkbox input for saving as preferred address
// eslint-disable-next-line no-unused-vars
const AddressFields = ({form, prefix = '', isGuest}) => {
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
            <Grid templateColumns="repeat(6, 1fr)" gap={5}>
                <GridItem colSpan={[6, 6, 3]}>
                    <Field {...fields.city} />
                </GridItem>
                <GridItem colSpan={[2, 2, 1]}>
                    <Field {...fields.stateCode} />
                </GridItem>
                <GridItem colSpan={[4, 4, 2]}>
                    <Field {...fields.postalCode} />
                </GridItem>
            </Grid>
        </Stack>
    )
}

AddressFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string,

    /** Indicates if user is guest or not */
    isGuest: PropTypes.bool
}

export default AddressFields
