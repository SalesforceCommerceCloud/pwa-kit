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

const GuestOrderAccessRequest = () => {
    const {formatMessage} = useIntl()
    const {isRegistered} = useCustomerType()
    const history = useHistory()
    const location = useLocation()
    const isExpired = new URLSearchParams(location.search).get('expired') === '1'

    // @ts-expect-error SDK 26.8 pending — requestOrderAccessCode is not yet in commerce-sdk-isomorphic 5.4.0
    const {mutateAsync: requestOrderAccessCode, isLoading} =
        useShopperOrdersMutation('requestOrderAccessCode')

    const orderNumberRegex =
        getConfig()?.app?.guestOrderAccess?.orderNumberRegex ?? '^[A-Za-z0-9]{6,20}$'

    const form = useForm({
        defaultValues: {orderNo: '', email: ''}
    })

    const {
        control,
        handleSubmit,
        formState: {errors}
    } = form

    if (isRegistered) return <Redirect to="/account/orders" />

    const onSubmit = async ({orderNo, email}) => {
        try {
            await requestOrderAccessCode({
                parameters: {orderNo},
                body: {email}
            })
        } catch (err) {
            // Non-400 errors: route to verify anyway (anti-enumeration).
            // 400 errors are also routed to verify — the server rejects
            // malformed payloads, but the UI must never leak order existence.
            if (err?.response?.status === 400) {
                history.push('/order-access/verify', {orderNo, email})
                return
            }
        }
        history.push('/order-access/verify', {orderNo, email})
    }

    return (
        <Container maxW="md" py={12}>
            <Stack spacing={8}>
                {isExpired && (
                    <Alert status="warning" borderRadius="md" role="alert">
                        <AlertIcon />
                        {formatMessage({
                            id: 'guestOrderAccess.request.alert.sessionExpired',
                            defaultMessage:
                                'Your session has expired. Please request a new access code.'
                        })}
                    </Alert>
                )}
                <Box>
                    <Heading as="h1" fontSize="2xl" mb={2}>
                        {formatMessage({
                            id: 'guestOrderAccess.request.heading',
                            defaultMessage: 'Find Your Order'
                        })}
                    </Heading>
                    <Text color="gray.600">
                        {formatMessage({
                            id: 'guestOrderAccess.request.subtext',
                            defaultMessage:
                                'Enter your order number and email address to receive a one-time access code.'
                        })}
                    </Text>
                </Box>
                <Box as="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Stack spacing={5}>
                        <Field
                            name="orderNo"
                            label={formatMessage({
                                id: 'guestOrderAccess.request.label.orderNumber',
                                defaultMessage: 'Order Number'
                            })}
                            type="text"
                            control={control}
                            defaultValue=""
                            rules={{
                                required: formatMessage({
                                    id: 'guestOrderAccess.request.error.orderNumberRequired',
                                    defaultMessage: 'Order number is required'
                                }),
                                pattern: {
                                    value: new RegExp(orderNumberRegex),
                                    message: formatMessage({
                                        id: 'guestOrderAccess.request.error.orderNumberInvalid',
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
                                id: 'guestOrderAccess.request.label.email',
                                defaultMessage: 'Email Address'
                            })}
                            type="email"
                            control={control}
                            defaultValue=""
                            rules={{
                                required: formatMessage({
                                    id: 'guestOrderAccess.request.error.emailRequired',
                                    defaultMessage: 'Email address is required'
                                }),
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: formatMessage({
                                        id: 'guestOrderAccess.request.error.emailInvalid',
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
                        >
                            {formatMessage({
                                id: 'guestOrderAccess.request.button.submit',
                                defaultMessage: 'Send Access Code'
                            })}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    )
}

export default GuestOrderAccessRequest
