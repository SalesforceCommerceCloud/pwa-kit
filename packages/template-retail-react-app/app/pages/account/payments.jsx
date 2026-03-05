/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Box,
    Button,
    Container,
    Heading,
    Stack,
    Text,
    SimpleGrid,
    Flex,
    Badge,
    Checkbox
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
import {useConfigurations} from '@salesforce/commerce-sdk-react'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal'

export const SALESFORCE_PAYMENTS_ALLOWED = 'SalesforcePaymentsAllowed'

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
    const {formatMessage} = useIntl()
    const {data: customer, isLoading: isLoadingCustomer, error, refetch} = useCurrentCustomer()
    const showToast = useToast()
    const [isAdding, setIsAdding] = useState(false)
    const [formKey, setFormKey] = useState(0)
    const addPaymentForm = useForm()
    const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false)
    const [pendingDefaultPayment, setPendingDefaultPayment] = useState(null)
    const {
        data: configurations,
        isLoading: isLoadingConfigurations,
        error: configurationsError
    } = useConfigurations()
    const createCustomerPaymentInstrument = useShopperCustomersMutation(
        'createCustomerPaymentInstrument'
    )
    const deleteCustomerPaymentInstrument = useShopperCustomersMutation(
        'deleteCustomerPaymentInstrument'
    )
    const updateCustomerPaymentInstrument = useShopperCustomersMutation(
        'updateCustomerPaymentInstrument'
    )

    const isSalesforcePaymentsEnabled = configurations?.configurations?.find(
        (config) => config.id === SALESFORCE_PAYMENTS_ALLOWED
    )?.value

    const onAddPaymentSubmit = async (values) => {
        const body = createCreditCardPaymentBodyFromForm(values)
        body.paymentMethodId = 'CREDIT_CARD'
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
                            title: formatMessage({
                                defaultMessage: 'New payment method was saved.',
                                id: 'account.payments.info.payment_method_saved'
                            }),
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
                title: formatMessage({
                    defaultMessage: "We couldn't save the payment method. Try again.",
                    id: 'account.payments.error.payment_method_save_failed'
                }),
                status: 'error',
                isClosable: true
            })
        }
    }
    const openAdd = () => {
        // Reset all card fields to ensure a blank form
        addPaymentForm.reset({
            number: '',
            cardType: '',
            holder: '',
            expiry: '',
            securityCode: '',
            default: false
        })
        // Force form subtree remount to clear any internal state
        setFormKey((k) => k + 1)
        setIsAdding(true)
    }
    const closeAdd = () => setIsAdding(false)

    const openDefaultModal = (payment) => {
        setPendingDefaultPayment(payment)
        setIsDefaultModalOpen(true)
    }
    const closeDefaultModal = () => {
        setIsDefaultModalOpen(false)
        setPendingDefaultPayment(null)
    }

    const confirmSetDefault = async () => {
        if (!pendingDefaultPayment) return
        try {
            await updateCustomerPaymentInstrument.mutateAsync({
                parameters: {
                    customerId: customer?.customerId,
                    paymentInstrumentId: pendingDefaultPayment.paymentInstrumentId
                },
                body: {default: true}
            })
            showToast({
                title: formatMessage({
                    defaultMessage: 'Payment method was made as default.',
                    id: 'account.payments.info.default_payment_updated'
                }),
                status: 'success',
                isClosable: true
            })
            await refetch()
        } catch (e) {
            showToast({
                title: formatMessage({
                    defaultMessage: 'We couldnt make the payment method as default. Try again.',
                    id: 'account.payments.error.set_default_failed'
                }),
                status: 'error',
                isClosable: true
            })
        } finally {
            closeDefaultModal()
        }
    }

    const removePayment = async (paymentInstrumentId) => {
        try {
            await deleteCustomerPaymentInstrument.mutateAsync(
                {
                    parameters: {customerId: customer?.customerId, paymentInstrumentId}
                },
                {
                    onSuccess: () => {
                        showToast({
                            title: formatMessage({
                                defaultMessage: 'Payment method was removed.',
                                id: 'account.payments.info.payment_method_removed'
                            }),
                            status: 'success',
                            isClosable: true
                        })
                    }
                }
            )
            await refetch()
        } catch (e) {
            showToast({
                title: formatMessage({
                    defaultMessage: "We couldn't remove the payment method. Try again.",
                    id: 'account.payments.error.payment_method_remove_failed'
                }),
                status: 'error',
                isClosable: true
            })
        }
    }

    // Show loading state
    if (isLoadingCustomer || isLoadingConfigurations) {
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
    if (error || configurationsError) {
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
                                    defaultMessage="We couldn't load the payment methods. Try again."
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
                                defaultMessage="No Saved Payment Methods"
                                id="account.payments.placeholder.heading"
                            />
                        </Text>
                        {!isSalesforcePaymentsEnabled && (
                            <div>
                                <Text color="gray.600" mt={1}>
                                    <FormattedMessage
                                        defaultMessage="Add a new payment method to check out faster."
                                        id="account.payments.placeholder.text"
                                    />
                                </Text>
                                <Button
                                    mt={4}
                                    onClick={openAdd}
                                    leftIcon={<PlusIcon boxSize={3} />}
                                >
                                    <FormattedMessage
                                        defaultMessage="Add Payment Method"
                                        id="account_payments.button.add_payment"
                                    />
                                </Button>
                            </div>
                        )}
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
                                    key={formKey}
                                    form={addPaymentForm}
                                    onSubmit={onAddPaymentSubmit}
                                >
                                    <FormActionButtons onCancel={closeAdd} />
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
                <Heading as="h1" fontSize="2xl">
                    <FormattedMessage
                        defaultMessage="Payment Methods"
                        id="account.payments.heading.payment_methods"
                    />
                </Heading>

                <SimpleGrid columns={[1, 2, 2, 2, 3]} spacing={4} gridAutoFlow="row dense">
                    {!isSalesforcePaymentsEnabled && (
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
                            onClick={openAdd}
                        >
                            <FormattedMessage
                                defaultMessage="Add Payment Method"
                                id="account_payments.button.add_payment"
                            />
                            {isAdding && <BoxArrow />}
                        </Button>
                    )}

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
                                        <FormActionButtons onCancel={closeAdd} />
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
                                footerLeft={
                                    !payment.default ? (
                                        <Checkbox
                                            onChange={(e) => {
                                                if (e.target.checked) openDefaultModal(payment)
                                                e.target.checked = false
                                            }}
                                        >
                                            <FormattedMessage
                                                defaultMessage="Make default"
                                                id="account.payments.checkbox.make_default"
                                            />
                                        </Checkbox>
                                    ) : null
                                }
                            >
                                <Stack spacing={3} flex="1">
                                    {payment.default && (
                                        <Badge
                                            position="absolute"
                                            fontSize="xs"
                                            right={4}
                                            variant="solid"
                                            bg="gray.100"
                                            color="gray.900"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Default"
                                                id="account.payments.badge.default"
                                            />
                                        </Badge>
                                    )}
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
                                            <FormattedMessage
                                                defaultMessage="Expires {month}/{year}"
                                                id="account.payments.label.expires"
                                                values={{
                                                    month: payment.paymentCard?.expirationMonth,
                                                    year: payment.paymentCard?.expirationYear
                                                }}
                                            />
                                        </Text>
                                    </Stack>
                                </Stack>
                            </ActionCard>
                        )
                    })}
                </SimpleGrid>
                <ConfirmationModal
                    isOpen={isDefaultModalOpen}
                    onOpen={() => setIsDefaultModalOpen(true)}
                    onClose={closeDefaultModal}
                    dialogTitle={{
                        defaultMessage: 'Set default payment method?',
                        id: 'account.payments.modal.title.set_default'
                    }}
                    confirmationMessage={{
                        defaultMessage: '{brand} ... {last4} will be the default at checkout.',
                        id: 'account.payments.modal.message.set_default'
                    }}
                    confirmationMessageValues={{
                        brand: pendingDefaultPayment?.paymentCard?.cardType || '',
                        last4: pendingDefaultPayment?.paymentCard?.numberLastDigits || ''
                    }}
                    primaryActionLabel={{
                        defaultMessage: 'Set Default',
                        id: 'account.payments.modal.action.set_default'
                    }}
                    alternateActionLabel={{
                        defaultMessage: 'Cancel',
                        id: 'account.payments.modal.action.cancel'
                    }}
                    onPrimaryAction={confirmSetDefault}
                    onAlternateAction={closeDefaultModal}
                />
            </Stack>
        </Container>
    )
}

export default AccountPayments
