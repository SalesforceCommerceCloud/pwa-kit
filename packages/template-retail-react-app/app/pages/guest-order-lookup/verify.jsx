/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useRef, useEffect, useCallback} from 'react'
import {useIntl} from 'react-intl'
import {useQueryClient} from '@tanstack/react-query'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    HStack,
    Heading,
    Input,
    Skeleton,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCustomerType, useAccessToken} from '@salesforce/commerce-sdk-react'
import {Redirect, useHistory, useLocation, useParams} from 'react-router-dom'

const ACCESS_CODE_LENGTH = 6

const GuestOrderLookupVerify = () => {
    const {formatMessage} = useIntl()
    const {isRegistered, customerType} = useCustomerType()
    const history = useHistory()
    const location = useLocation()
    const {orderNo} = useParams()
    const {getTokenWhenReady} = useAccessToken()
    const queryClient = useQueryClient()
    const getTokenWhenReadyRef = useRef(getTokenWhenReady)
    // eslint-disable-next-line use-effect-no-deps/use-effect-no-deps -- intentionally runs every render to keep the ref current
    useEffect(() => {
        getTokenWhenReadyRef.current = getTokenWhenReady
    })

    // email arrives via router state when navigating from request.jsx; absent on hard refresh.
    const email = location.state?.email || ''
    // Auth resolves asynchronously — null means not yet known.
    const authResolved = customerType !== null

    const [digits, setDigits] = useState(Array(ACCESS_CODE_LENGTH).fill(''))
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [serverError, setServerError] = useState(null)
    const inputRefs = useRef([])

    const handleDigitChange = useCallback(
        (index, value) => {
            const cleaned = value.replace(/\D/g, '').slice(-1)
            const next = [...digits]
            next[index] = cleaned
            setDigits(next)
            setServerError(null)
            if (cleaned && index < ACCESS_CODE_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus()
            }
        },
        [digits]
    )

    const handleKeyDown = useCallback(
        (index, e) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus()
            }
        },
        [digits]
    )

    const handlePaste = useCallback((e) => {
        e.preventDefault()
        const pasted = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, ACCESS_CODE_LENGTH)
        if (!pasted) return
        const next = Array(ACCESS_CODE_LENGTH).fill('')
        for (let i = 0; i < pasted.length; i++) {
            next[i] = pasted[i]
        }
        setDigits(next)
        inputRefs.current[Math.min(pasted.length, ACCESS_CODE_LENGTH - 1)]?.focus()
    }, [])

    // All hooks declared above — early returns must come after all hook calls
    if (authResolved && isRegistered) return <Redirect to="/account/orders" />
    if (!orderNo) return <Redirect to="/order-lookup" />

    const enteredCode = digits.join('')
    const isComplete = enteredCode.length === ACCESS_CODE_LENGTH

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!isComplete || isSubmitting) return
        setServerError(null)
        setIsSubmitting(true)
        try {
            const token = await getTokenWhenReadyRef.current()
            const res = await fetch('/api/order-lookup/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({orderNo, email, accessCode: enteredCode})
            })
            if (res.ok) {
                try {
                    const orderData = await res.json()
                    queryClient.setQueryData(['guestOrderLookup', 'order', orderNo], orderData)
                } catch {
                    // Best-effort cache prime — navigation proceeds regardless
                }
                history.push(`/order-lookup/order/${encodeURIComponent(orderNo)}`)
                return
            }
            if (res.status === 404) {
                setServerError(
                    formatMessage({
                        id: 'guestOrderLookup.verify.error.invalidCode',
                        defaultMessage:
                            'The code you entered is invalid or has expired. Please try again.'
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
            inputRefs.current[0]?.focus()
        } catch {
            setServerError(
                formatMessage({
                    id: 'guestOrderLookup.verify.error.generic',
                    defaultMessage: 'Something went wrong. Please try again.'
                })
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Container maxW="lg" py={12}>
            <Stack spacing={8}>
                <Box textAlign="center">
                    <Heading as="h1" fontSize="3xl" fontWeight="bold" mb={2}>
                        {formatMessage({
                            id: 'guestOrderLookup.verify.heading',
                            defaultMessage: 'Verify Your Email'
                        })}
                    </Heading>
                    {email ? (
                        <Text color="gray.600">
                            {formatMessage(
                                {
                                    id: 'guestOrderLookup.verify.subtext',
                                    defaultMessage:
                                        "We've sent a verification code to {email}. Please enter it below."
                                },
                                {email}
                            )}
                        </Text>
                    ) : (
                        <Stack spacing={2} alignItems="center">
                            <Skeleton height="20px" width="88%" />
                            <Skeleton height="20px" width="55%" />
                        </Stack>
                    )}
                </Box>

                <Box
                    as="form"
                    onSubmit={onSubmit}
                    noValidate
                    borderWidth="1px"
                    borderRadius="lg"
                    p={8}
                >
                    <Stack spacing={6}>
                        {serverError && (
                            <Alert id="access-code-error" status="error" borderRadius="md">
                                <AlertIcon />
                                {serverError}
                            </Alert>
                        )}

                        <FormControl isInvalid={!!serverError}>
                            <FormLabel htmlFor="access-code-input-0" textAlign="center">
                                {formatMessage({
                                    id: 'guestOrderLookup.verify.label.code',
                                    defaultMessage: 'Verification code'
                                })}
                            </FormLabel>
                            <HStack spacing={3} justify="center">
                                {Array.from({length: ACCESS_CODE_LENGTH}, (_, i) => (
                                    <Input
                                        key={i}
                                        id={i === 0 ? 'access-code-input-0' : undefined}
                                        ref={(el) => {
                                            inputRefs.current[i] = el
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digits[i]}
                                        onChange={(e) => handleDigitChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        onPaste={handlePaste}
                                        isDisabled={isSubmitting}
                                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                        textAlign="center"
                                        fontSize="xl"
                                        fontWeight="bold"
                                        w="12"
                                        h="14"
                                        borderWidth="2px"
                                        aria-label={formatMessage(
                                            {
                                                id: 'guestOrderLookup.verify.label.digitN',
                                                defaultMessage: 'Digit {n} of {total}'
                                            },
                                            {n: i + 1, total: ACCESS_CODE_LENGTH}
                                        )}
                                        aria-invalid={!!serverError || undefined}
                                        aria-describedby={
                                            serverError ? 'access-code-error' : undefined
                                        }
                                    />
                                ))}
                            </HStack>
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="blue"
                            isLoading={isSubmitting}
                            isDisabled={!isComplete || isSubmitting}
                            width="full"
                            size="lg"
                        >
                            {formatMessage({
                                id: 'guestOrderLookup.verify.button.submit',
                                defaultMessage: 'Verify Code'
                            })}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    )
}

export default GuestOrderLookupVerify
