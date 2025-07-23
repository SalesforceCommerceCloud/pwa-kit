/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useForm} from 'react-hook-form'
import {Button, Text, Stack, Box, Link} from '@salesforce/retail-react-app/app/components/shared/ui'
import Field from '@salesforce/retail-react-app/app/components/field'

const OrderLookupForm = ({onSubmit}) => {
    const form = useForm({
        mode: 'onChange',
        defaultValues: {
            orderNumber: '',
            email: ''
        }
    })

    const {
        handleSubmit,
        formState: {errors}
    } = form

    const fields = {
        orderNumber: {
            name: 'orderNumber',
            label: 'Order Number',
            placeholder: 'Enter order number',
            type: 'text',
            defaultValue: '',
            rules: {
                required: 'Please enter your order number.'
            },
            error: errors.orderNumber,
            control: form.control
        },
        email: {
            name: 'email',
            label: 'Email',
            placeholder: 'you@email.com',
            type: 'email',
            autoComplete: 'email',
            defaultValue: '',
            rules: {
                required: 'Please enter your email address.'
            },
            error: errors.email,
            control: form.control
        }
    }

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
                        Look it up with your order number
                    </Text>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                        Find an individual order
                    </Text>
                </Box>

                <form onSubmit={handleSubmit(onSubmitForm)}>
                    <Stack spacing={4}>
                        <Field {...fields.orderNumber} />
                        <Field {...fields.email} />

                        <Button type="submit" colorScheme="blue" size="lg" width="100%" mt={2}>
                            Continue
                        </Button>
                    </Stack>
                </form>

                <Box textAlign="center">
                    {/* TODO: Add a link to the order retrieval help page */}
                    <Link color="blue.600" fontSize="sm" textDecoration="underline">
                        Can&apos;t find? How to find your order number
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
