/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useRef, useEffect} from 'react'
import {useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    Box,
    Button,
    Container,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    Input,
    Link,
    Stack,
    Text,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    useCustomerType,
    useShopperOrdersMutation,
    useAccessToken
} from '@salesforce/commerce-sdk-react'
import {Redirect, useHistory, useLocation} from 'react-router-dom'

const GuestOrderLookupVerify = () => {
    const {formatMessage} = useIntl()
    const {isRegistered} = useCustomerType()
    const history = useHistory()
    const location = useLocation()
    const toast = useToast()
    const {getTokenWhenReady} = useAccessToken()

    const [serverError, setServerError] = useState(null)
    const [resendDisabled, setResendDisabled] = useState(false)
    const resendTimerRef = useRef(null)

    useEffect(() => {
        return () => {
            if (resendTimerRef.current) clearTimeout(resendTimerRef.current)
        }
    }, [])

    // @ts-expect-error SDK 26.8 pending — requestOrderAccessCode is not yet in commerce-sdk-isomorphic 5.4.0
    const {mutateAsync: requestOrderAccessCode} = useShopperOrdersMutation('requestOrderAccessCode')

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting}
    } = useForm({defaultValues: {accessCode: ''}})

    if (isRegistered) return <Redirect to="/account/orders" />

    const routeState = location.state
    if (!routeState?.orderNo || !routeState?.email) {
        return <Redirect to="/order-lookup" />
    }

    const {orderNo, email} = routeState

    const onSubmit = async ({accessCode}) => {
        setServerError(null)
        try {
            const token = await getTokenWhenReady()
            const res = await fetch('/api/order-lookup/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({orderNo, email, accessCode})
            })
            if (res.ok) {
                history.push('/order-lookup/order', {orderNo})
                return
            }
            if (res.status === 404) {
                setServerError(
                    formatMessage({
                        id: 'guestOrderLookup.verify.error.invalidCode',
                        defaultMessage:
                            'Code invalid or expired. Please try again or request a new code.'
                    })
                )
            } else if (res.status === 429) {
                setServerError(
                    formatMessage({
                        id: 'guestOrderLookup.verify.error.tooManyAttempts',
                        defaultMessage: 'Too many attempts. Please wait a moment and try again.'
                    })
                )
            } else {
                setServerError(
                    formatMessage({
                        id: 'guestOrderLookup.verify.error.generic',
                        defaultMessage: 'Something went wrong. Please try again.'
                    })
                )
            }
        } catch {
            setServerError(
                formatMessage({
                    id: 'guestOrderLookup.verify.error.generic',
                    defaultMessage: 'Something went wrong. Please try again.'
                })
            )
        }
    }

    const handleResend = async () => {
        setResendDisabled(true)
        try {
            await requestOrderAccessCode({
                parameters: {orderNo},
                body: {email}
            })
        } catch {
            // Server-side throttle means resend may be a silent no-op; show confirmation anyway.
        }
        toast({
            title: formatMessage({
                id: 'guestOrderLookup.verify.toast.resent',
                defaultMessage: 'Check your inbox — it may take a moment.'
            }),
            status: 'info',
            duration: 5000,
            isClosable: true
        })
        resendTimerRef.current = setTimeout(() => setResendDisabled(false), 2000)
    }

    return (
        <Container maxW="md" py={12}>
            <Stack spacing={8}>
                <Box>
                    <Heading as="h1" fontSize="2xl" mb={2}>
                        {formatMessage({
                            id: 'guestOrderLookup.verify.heading',
                            defaultMessage: 'Enter Your Access Code'
                        })}
                    </Heading>
                    <Text color="gray.600">
                        {formatMessage(
                            {
                                id: 'guestOrderLookup.verify.subtext',
                                defaultMessage:
                                    "We've sent a 6-digit code to {email}. It may take a moment to arrive."
                            },
                            {email}
                        )}
                    </Text>
                </Box>
                <Box as="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Stack spacing={5}>
                        <FormControl isInvalid={!!errors.accessCode || !!serverError}>
                            <FormLabel htmlFor="accessCode">
                                {formatMessage({
                                    id: 'guestOrderLookup.verify.label.code',
                                    defaultMessage: 'Access Code'
                                })}
                            </FormLabel>
                            <Input
                                id="accessCode"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                autoComplete="one-time-code"
                                {...register('accessCode', {
                                    required: formatMessage({
                                        id: 'guestOrderLookup.verify.error.codeRequired',
                                        defaultMessage: 'Access code is required'
                                    }),
                                    pattern: {
                                        value: /^[0-9]{6}$/,
                                        message: formatMessage({
                                            id: 'guestOrderLookup.verify.error.codeInvalid',
                                            defaultMessage: 'Enter the 6-digit code from your email'
                                        })
                                    }
                                })}
                            />
                            {errors.accessCode && (
                                <FormErrorMessage>{errors.accessCode.message}</FormErrorMessage>
                            )}
                            {serverError && !errors.accessCode && (
                                <FormErrorMessage>{serverError}</FormErrorMessage>
                            )}
                        </FormControl>
                        <Button
                            type="submit"
                            colorScheme="blue"
                            isLoading={isSubmitting}
                            isDisabled={isSubmitting}
                            width="full"
                        >
                            {formatMessage({
                                id: 'guestOrderLookup.verify.button.submit',
                                defaultMessage: 'Verify Code'
                            })}
                        </Button>
                        <Text fontSize="sm" textAlign="center">
                            {formatMessage({
                                id: 'guestOrderLookup.verify.resend.prompt',
                                defaultMessage: "Didn't receive a code?"
                            })}{' '}
                            <Link
                                as="button"
                                type="button"
                                color="blue.500"
                                onClick={handleResend}
                                isDisabled={resendDisabled}
                                aria-disabled={resendDisabled}
                                opacity={resendDisabled ? 0.5 : 1}
                                pointerEvents={resendDisabled ? 'none' : 'auto'}
                            >
                                {formatMessage({
                                    id: 'guestOrderLookup.verify.resend.link',
                                    defaultMessage: 'Resend code'
                                })}
                            </Link>
                        </Text>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    )
}

export default GuestOrderLookupVerify
