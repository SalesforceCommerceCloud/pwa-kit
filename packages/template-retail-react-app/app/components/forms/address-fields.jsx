/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Grid,
    GridItem,
    SimpleGrid,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import useAddressFields from '@salesforce/retail-react-app/app/components/forms/useAddressFields'
import Field from '@salesforce/retail-react-app/app/components/field'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const AddressFields = ({form, prefix = '', ariaLabel}) => {
    const {data: customer} = useCurrentCustomer()
    const fields = useAddressFields({form, prefix})
    const intl = useIntl()

    if (!ariaLabel) {
        ariaLabel = intl.formatMessage({
            id: 'use_address_fields.label.address_form',
            defaultMessage: 'Address Form'
        })
    }
    const addressFormRef = useRef()
    useEffect(() => {
        // Focus on the form when the component mounts for accessibility
        addressFormRef?.current?.focus()
    }, [])

    return (
        <Stack spacing={5} aria-label={ariaLabel} tabIndex="0" ref={addressFormRef}>
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
    prefix: PropTypes.string,

    /** Optional aria label to use for the address group */
    ariaLabel: PropTypes.string
}

export default AddressFields
