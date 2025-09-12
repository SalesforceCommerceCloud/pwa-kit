/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Container,
    Heading,
    Stack,
    Text,
    SimpleGrid,
    Flex
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {
    getCreditCardIcon,
    createCreditCardPaymentBodyFromForm
} from '@salesforce/retail-react-app/app/utils/cc-utils'
import AccountPaymentForm from '@salesforce/retail-react-app/app/pages/account/partials/account-payment-form'
import {useForm} from 'react-hook-form'
import {PlusIcon, CreditCardIcon} from '@salesforce/retail-react-app/app/components/icons'
import FormActionButtons from '@salesforce/retail-react-app/app/components/forms/form-action-buttons'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import ActionCard from '@salesforce/retail-react-app/app/components/action-card'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

const BoxArrow = () => {
    return (
        <Box
            width={3}
            height={3}
            borderLeft="1px solid"
            borderTop="1px solid"
            borderColor="blue.600"
            position="absolute"
            left="50%"
            bottom="-23px"
            zIndex={1}
            background="white"
            transform="rotate(45deg)"
        />
    )
}

const AccountPayments = () => {
    const {data: customer, isLoading, error, refetch} = useCurrentCustomer()
    const showToast = useToast()
    const [isAdding, setIsAdding] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const addPaymentForm = useForm()
    const createCustomerPaymentInstrument = useShopperCustomersMutation(
        'createCustomerPaymentInstrument'
    )
    const deleteCustomerPaymentInstrument = useShopperCustomersMutation(
        'deleteCustomerPaymentInstrument'
    )
    const onAddPaymentSubmit = async (values) => {
        const body = createCreditCardPaymentBodyFromForm(values)
        // Shopper Customers expects 'Credit Card' (not 'CREDIT_CARD')
        body.paymentMethodId = 'Credit Card'
        // Remove fields not supported by CustomerPaymentCardRequest
        if (body.paymentCard && 'securityCode' in body.paymentCard) {
            delete body.paymentCard.securityCode
        }
        try {
            await createCustomerPaymentInstrument.mutateAsync(
                {
                    body,
                    parameters: {customerId: customer?.customerId}
                },
                {
                    onSuccess: () => {
                        showToast({
                            title: (
                                <FormattedMessage
                                    defaultMessage="New payment method saved"
                                    id="account.payments.info.payment_method_saved"
                                />
                            ),
                            status: 'success',
                            isClosable: true
                        })
                    }
                }
            )
            setIsAdding(false)
            await refetch()
        } catch (e) {
            showToast({
                title: (
                    <FormattedMessage
                        defaultMessage="Unable to save payment method"
                        id="account.payments.error.payment_method_save_failed"
                    />
                ),
                status: 'error',
                isClosable: true
            })
        }
    }
    const toggleAdd = () => setIsAdding((v) => !v)

    const removePayment = async (paymentInstrumentId) => {
        setDeletingId(paymentInstrumentId)
        try {
            await deleteCustomerPaymentInstrument.mutateAsync(
                {
                    parameters: {customerId: customer?.customerId, paymentInstrumentId}
                },
                {
                    onSuccess: () => {
                        showToast({
                            title: (
                                <FormattedMessage
                                    defaultMessage="Payment method removed"
                                    id="account.payments.info.payment_method_removed"
                                />
                            ),
                            status: 'success',
                            isClosable: true
                        })
                    }
                }
            )
            await refetch()
        } catch (e) {
            showToast({
                title: (
                    <FormattedMessage
                        defaultMessage="Unable to remove payment method"
                        id="account.payments.error.payment_method_remove_failed"
                    />
                ),
                status: 'error',
                isClosable: true
            })
        } finally {
            setDeletingId(null)
        }
    }

    // Show loading state
    if (isLoading) {
        return (
            <Container layerStyle="page">
                <Stack spacing={6}>
                    <Heading as="h1" fontSize="2xl">
                        <FormattedMessage
                            defaultMessage="Payment Methods"
                            id="account.payments.heading.payment_methods"
                        />
                    </Heading>
                    <Box textAlign="center" py={12}>
                        <Text color="gray.600">
                            <FormattedMessage
                                defaultMessage="Loading payment methods..."
                                id="account.payments.message.loading"
                            />
                        </Text>
                    </Box>
                </Stack>
            </Container>
        )
    }

    // Show error state
    if (error) {
        return (
            <Container layerStyle="page">
                <Stack spacing={6}>
                    <Heading as="h1" fontSize="2xl">
                        <FormattedMessage
                            defaultMessage="Payment Methods"
                            id="account.payments.heading.payment_methods"
                        />
                    </Heading>
                    <Box textAlign="center" py={12}>
                        <Stack spacing={4}>
                            <Text color="red.600">
                                <FormattedMessage
                                    defaultMessage="Error loading payment methods. Please try again."
                                    id="account.payments.message.error"
                                />
                            </Text>
                            <Button onClick={() => refetch()} variant="outline">
                                <FormattedMessage
                                    defaultMessage="Retry"
                                    id="account.payments.action.retry"
                                />
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        )
    }

    if (!customer?.paymentInstruments?.length) {
        return (
            <Container layerStyle="page">
                <Stack spacing={6}>
                    <Heading as="h1" fontSize="2xl">
                        <FormattedMessage
                            defaultMessage="Payment Methods"
                            id="account.payments.heading.payment_methods"
                        />
                    </Heading>
                    <Box bg="gray.50" borderRadius="base" py={12} textAlign="center">
                        <CreditCardIcon boxSize={6} color="gray.700" />
                        <Text mt={4} fontWeight="semibold">
                            <FormattedMessage
                                defaultMessage="No Saved Payments"
                                id="account.payments.placeholder.heading"
                            />
                        </Text>
                        <Text color="gray.600" mt={1}>
                            <FormattedMessage
                                defaultMessage="Add a new payment method for faster checkout."
                                id="account.payments.placeholder.text"
                            />
                        </Text>
                        <Button mt={4} onClick={toggleAdd} leftIcon={<PlusIcon boxSize={3} />}>
                            <FormattedMessage
                                defaultMessage="Add Payment"
                                id="account_payments.button.add_payment"
                            />
                        </Button>
                    </Box>
                    {isAdding && (
                        <Box
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="base"
                            position="relative"
                            paddingX={[4, 4, 6]}
                            paddingY={6}
                            rounded="base"
                            borderWidth="1px"
                            style={{borderColor: 'rgb(33, 109, 236)'}}
                        >
                            <Container variant="form">
                                <AccountPaymentForm
                                    form={addPaymentForm}
                                    onSubmit={onAddPaymentSubmit}
                                >
                                    <FormActionButtons onCancel={toggleAdd} />
                                </AccountPaymentForm>
                            </Container>
                        </Box>
                    )}
                </Stack>
            </Container>
        )
    }

    return (
        <Container layerStyle="page">
            <Stack spacing={6}>
                <Flex justify="space-between" align="center">
                    <Heading as="h1" fontSize="2xl">
                        <FormattedMessage
                            defaultMessage="Payment Methods"
                            id="account.payments.heading.payment_methods"
                        />
                    </Heading>
                    <Button
                        onClick={() => refetch()}
                        isLoading={isLoading}
                        size="sm"
                        variant="outline"
                    >
                        <FormattedMessage
                            defaultMessage="Refresh"
                            id="account.payments.action.refresh"
                        />
                    </Button>
                </Flex>

                <SimpleGrid columns={[1, 2, 2, 2, 3]} spacing={4} gridAutoFlow="row dense">
                    <Button
                        variant="outline"
                        border="1px dashed"
                        borderColor="gray.200"
                        color="blue.600"
                        height={{lg: 'full'}}
                        minHeight={11}
                        rounded="base"
                        fontWeight="medium"
                        leftIcon={<PlusIcon display="block" boxSize={'15px'} />}
                        onClick={toggleAdd}
                    >
                        <FormattedMessage
                            defaultMessage="Add Payment"
                            id="account_payments.button.add_payment"
                        />
                        {isAdding && <BoxArrow />}
                    </Button>

                    {isAdding && (
                        <Box
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="base"
                            position="relative"
                            gridColumn={[1, 'span 2', 'span 2', 'span 2', 'span 3']}
                            paddingX={[4, 4, 6]}
                            paddingY={6}
                            rounded="base"
                            borderWidth="1px"
                            style={{borderColor: 'rgb(33, 109, 236)'}}
                        >
                            <Box>
                                <Container variant="form">
                                    <AccountPaymentForm
                                        form={addPaymentForm}
                                        onSubmit={onAddPaymentSubmit}
                                    >
                                        <FormActionButtons onCancel={toggleAdd} />
                                    </AccountPaymentForm>
                                </Container>
                            </Box>
                        </Box>
                    )}
                    {customer.paymentInstruments?.map((payment) => {
                        const CardIcon = getCreditCardIcon(payment.paymentCard?.cardType)
                        return (
                            <ActionCard
                                key={payment.paymentInstrumentId}
                                onRemove={() => removePayment(payment.paymentInstrumentId)}
                                borderColor="gray.200"
                            >
                                <Stack spacing={3} flex="1">
                                    <Flex align="center" gap={2}>
                                        {CardIcon && <CardIcon layerStyle="ccIcon" />}
                                        <Text fontWeight="semibold">
                                            {payment.paymentCard?.cardType}
                                        </Text>
                                    </Flex>
                                    <Stack spacing={1}>
                                        <Text>
                                            &bull;&bull;&bull;&bull;{' '}
                                            {payment.paymentCard?.numberLastDigits}
                                        </Text>
                                        <Text color="gray.600">{payment.paymentCard?.holder}</Text>
                                        <Text color="gray.600">
                                            Expires {payment.paymentCard?.expirationMonth}/
                                            {payment.paymentCard?.expirationYear}
                                        </Text>
                                    </Stack>
                                </Stack>
                            </ActionCard>
                        )
                    })}
                </SimpleGrid>
            </Stack>
        </Container>
    )
}

export default AccountPayments
