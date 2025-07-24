/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useForm} from 'react-hook-form'
import {FormattedMessage} from 'react-intl'
import {Button, Text, Stack, Box, Link} from '@salesforce/retail-react-app/app/components/shared/ui'
import Field from '@salesforce/retail-react-app/app/components/field'
import useOrderLookupFields from '@salesforce/retail-react-app/app/components/forms/use-order-lookup-fields'

const OrderLookupForm = ({onSubmit}) => {
    const form = useForm({
        mode: 'onChange',
        defaultValues: {
            orderNumber: '',
            email: ''
        }
    })

    const {handleSubmit} = form
    const fields = useOrderLookupFields({form})

    const onSubmitForm = (data) => {
        if (onSubmit) {
            onSubmit(data)
        }
    }

    return (
        <Box
            bg="white"
            borderRadius="md"
            boxShadow="md"
            p={{base: 6, md: 8}}
            maxW="md"
            width="100%"
            mx="auto"
        >
            <Stack spacing={6}>
                <Box textAlign="center">
                    <Text fontSize="lg" fontWeight="medium">
                        <FormattedMessage
                            defaultMessage="Look it up with your order number"
                            id="order_lookup.heading.look_up_with_order_number"
                        />
                    </Text>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                        <FormattedMessage
                            defaultMessage="Find an individual order"
                            id="order_lookup.subheading.find_individual_order"
                        />
                    </Text>
                </Box>

                <form onSubmit={handleSubmit(onSubmitForm)}>
                    <Stack spacing={4}>
                        <Field {...fields.orderNumber} />
                        <Field {...fields.email} />

                        <Button type="submit" colorScheme="blue" size="lg" width="100%" mt={2}>
                            <FormattedMessage
                                defaultMessage="Continue"
                                id="order_lookup.button.continue"
                            />
                        </Button>
                    </Stack>
                </form>

                <Box textAlign="center">
                    {/* TODO: Add a link to the order retrieval help page */}
                    <Link color="blue.600" fontSize="sm" textDecoration="underline">
                        <FormattedMessage
                            defaultMessage="Need help finding your order number?"
                            id="order_lookup.link.help_to_find_order_number"
                        />
                    </Link>
                </Box>
            </Stack>
        </Box>
    )
}

OrderLookupForm.propTypes = {
    onSubmit: PropTypes.func
}

export default OrderLookupForm
