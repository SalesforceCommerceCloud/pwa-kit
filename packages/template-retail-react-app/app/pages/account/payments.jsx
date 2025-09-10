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
import {PlusIcon} from '@salesforce/retail-react-app/app/components/icons'
import FormActionButtons from '@salesforce/retail-react-app/app/components/forms/form-action-buttons'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'

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
    const [isAdding, setIsAdding] = useState(false)
    const addPaymentForm = useForm()
    const createCustomerPaymentInstrument = useShopperCustomersMutation(
        'createCustomerPaymentInstrument'
    )
    const onAddPaymentSubmit = async (values) => {
        const body = createCreditCardPaymentBodyFromForm(values)
        // Shopper Customers expects 'Credit Card' (not 'CREDIT_CARD')
        body.paymentMethodId = 'Credit Card'
        // Remove fields not supported by CustomerPaymentCardRequest
        if (body.paymentCard?.securityCode !== undefined) {
            const {securityCode, ...rest} = body.paymentCard
            body.paymentCard = rest
        }
        await createCustomerPaymentInstrument.mutateAsync({
            body,
            parameters: {customerId: customer?.customerId}
        })
        setIsAdding(false)
        await refetch()
    }
    const toggleAdd = () => setIsAdding((v) => !v)

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
                    <Box textAlign="center" py={12}>
                        <Text color="gray.600">
                            <FormattedMessage
                                defaultMessage="No saved payment methods found."
                                id="account.payments.message.no_payment_methods"
                            />
                        </Text>
                    </Box>
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
                            <Box
                                key={payment.paymentInstrumentId}
                                p={4}
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                bg="white"
                            >
                                <Stack spacing={3} flex="1">
                                    <Flex align="center" spacing={3}>
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
                            </Box>
                        )
                    })}
                </SimpleGrid>
            </Stack>
        </Container>
    )
}

export default AccountPayments
