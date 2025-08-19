/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
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
import {getCreditCardIcon} from '@salesforce/retail-react-app/app/utils/cc-utils'

const AccountPayments = () => {
    const {formatMessage} = useIntl()
    const {data: customer, isLoading, error, refetch} = useCurrentCustomer()

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

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
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
