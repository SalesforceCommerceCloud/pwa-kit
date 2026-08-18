/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Container,
    Heading,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCustomerType, useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {Redirect, useHistory, useLocation} from 'react-router-dom'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import Field from '@salesforce/retail-react-app/app/components/field'

const GuestOrderLookupRequest = () => {
    const {formatMessage} = useIntl()
    const {isRegistered} = useCustomerType()
    const history = useHistory()
    const location = useLocation()

    const {mutateAsync: requestOrderAccessCode, isLoading} =
        useShopperOrdersMutation('requestOrderAccessCode')

    const orderNumberRegex =
        getConfig()?.app?.guestOrderLookup?.orderNumberRegex ?? '^[a-zA-Z0-9-]{6,32}$'

    // Prefill orderNo from query param (?order=) — used by the expired-session redirect
    // from order.jsx so the user doesn't have to retype their order number.
    const searchParams = new URLSearchParams(location.search)
    const prefillOrderNo = searchParams.get('order') || ''
    const isSessionExpired = searchParams.get('expired') === '1'

    const {
        control,
        handleSubmit,
        formState: {errors}
    } = useForm({defaultValues: {orderNo: prefillOrderNo, email: ''}})

    if (isRegistered) return <Redirect to="/account/orders" />

    const onSubmit = async ({orderNo, email}) => {
        try {
            await requestOrderAccessCode({
                parameters: {orderNo},
                body: {email}
            })
        } catch (err) {
            // Route to verify regardless (anti-enumeration — never leak order existence).
            if (err?.response?.status === 400) {
                history.push(`/order-lookup/verify/${encodeURIComponent(orderNo)}`, {email})
                return
            }
        }
        history.push(`/order-lookup/verify/${encodeURIComponent(orderNo)}`, {email})
    }

    return (
        <Container maxW="lg" py={12}>
            <Stack spacing={8}>
                {isSessionExpired && (
                    <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        {formatMessage({
                            id: 'guestOrderLookup.request.sessionExpired',
                            defaultMessage:
                                'Your session has expired. Please look up your order again.'
                        })}
                    </Alert>
                )}
                <Box textAlign="center">
                    <Heading as="h1" fontSize="3xl" fontWeight="bold" mb={2}>
                        {formatMessage({
                            id: 'guestOrderLookup.request.heading',
                            defaultMessage: 'Look Up Your Order'
                        })}
                    </Heading>
                    <Text color="gray.600">
                        {formatMessage({
                            id: 'guestOrderLookup.request.subtext',
                            defaultMessage:
                                'Enter your order details to track your order or view your receipt.'
                        })}
                    </Text>
                </Box>

                <Box
                    as="form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    borderWidth="1px"
                    borderRadius="lg"
                    p={8}
                >
                    <Stack spacing={6}>
                        <Field
                            name="orderNo"
                            label={formatMessage({
                                id: 'guestOrderLookup.request.label.orderNumber',
                                defaultMessage: 'Order number'
                            })}
                            type="text"
                            control={control}
                            defaultValue=""
                            rules={{
                                required: formatMessage({
                                    id: 'guestOrderLookup.request.error.orderNumberRequired',
                                    defaultMessage: 'Order number is required'
                                }),
                                pattern: {
                                    value: new RegExp(orderNumberRegex),
                                    message: formatMessage({
                                        id: 'guestOrderLookup.request.error.orderNumberInvalid',
                                        defaultMessage: 'Enter a valid order number'
                                    })
                                }
                            }}
                            error={errors.orderNo}
                            autoComplete="off"
                        />
                        <Field
                            name="email"
                            label={formatMessage({
                                id: 'guestOrderLookup.request.label.email',
                                defaultMessage: 'Email address'
                            })}
                            type="email"
                            control={control}
                            defaultValue=""
                            rules={{
                                required: formatMessage({
                                    id: 'guestOrderLookup.request.error.emailRequired',
                                    defaultMessage: 'Email address is required'
                                }),
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: formatMessage({
                                        id: 'guestOrderLookup.request.error.emailInvalid',
                                        defaultMessage: 'Enter a valid email address'
                                    })
                                }
                            }}
                            error={errors.email}
                            autoComplete="email"
                        />
                        <Button
                            type="submit"
                            colorScheme="blue"
                            isLoading={isLoading}
                            isDisabled={isLoading}
                            width="full"
                            size="lg"
                        >
                            {formatMessage({
                                id: 'guestOrderLookup.request.button.submit',
                                defaultMessage: 'Find My Order'
                            })}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    )
}

export default GuestOrderLookupRequest
