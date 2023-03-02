/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'

import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    Alert,
    AlertIcon,
    Button,
    Box,
    Container,
    Heading,
    SimpleGrid,
    Skeleton,
    Stack,
    Text
} from '@chakra-ui/react'
import {createCreditCardPaymentBodyFromForm, getCreditCardIcon} from '../../utils/cc-utils'
import {useCurrentCustomer} from '../../hooks/use-current-customer'

import FormActionButtons from '../../components/forms/form-action-buttons'
import LoadingSpinner from '../../components/loading-spinner'
import {PlusIcon, PaymentIcon} from '../../components/icons'
import ActionCard from '../../components/action-card'
import CreditCardFields from '../../components/forms/credit-card-fields'
import PageActionPlaceHolder from '../../components/page-action-placeholder'
import {useShopperCustomersMutation} from 'commerce-sdk-react-preview'
import {API_ERROR_MESSAGE} from '../../constants'
import {useToast} from '../../hooks/use-toast'

const DEFAULT_SKELETON_COUNT = 3

const CardPaymentForm = ({hasSavedPayments, form, submitForm, toggleEdit}) => {
    return (
        <Box
            position="relative"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="base"
            {...(hasSavedPayments && {
                gridColumn: [1, 'span 2', 'span 2', 'span 2', 'span 3'],
                paddingX: [4, 4, 6],
                paddingY: 6,
                rounded: 'base',
                border: '1px solid',
                borderColor: 'blue.600'
            })}
        >
            {form.formState.isSubmitting && <LoadingSpinner />}
            <Stack spacing={6} padding={6}>
                <Heading as="h3" size="sm">
                    <FormattedMessage
                        defaultMessage="Add New Payment Method"
                        id="card_payment_form.heading.new_payment_method"
                    />
                </Heading>
                <Box>
                    <Container variant="form">
                        <form onSubmit={form.handleSubmit(submitForm)}>
                            <Stack spacing={6}>
                                {form.errors?.global && (
                                    <Alert status="error">
                                        <AlertIcon color="red.500" boxSize={4} />
                                        <Text fontSize="sm" ml={3}>
                                            {form.errors.global.message}
                                        </Text>
                                    </Alert>
                                )}
                                <CreditCardFields form={form} />
                                <FormActionButtons onCancel={() => toggleEdit()} />
                            </Stack>
                        </form>
                    </Container>
                </Box>
            </Stack>
        </Box>
    )
}

CardPaymentForm.propTypes = {
    form: PropTypes.object,
    hasSavedPayments: PropTypes.bool,
    submitForm: PropTypes.func,
    toggleEdit: PropTypes.func
}

const successfullyAddedMessage = defineMessage({
    defaultMessage: 'New Payment Method Saved',
    id: 'account_payment_methods.info.new_method_saved'
})
const successfullyRemovedMessage = defineMessage({
    defaultMessage: 'Payment Method Removed',
    id: 'account_payment_methods.info.payment_method_removed'
})
const AccountPaymentMethods = () => {
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, paymentInstruments, isLoading} = customer
    const addPaymentInstrumentMutation = useShopperCustomersMutation(
        'createCustomerPaymentInstrument'
    )
    const removePaymentInstrumentMutation = useShopperCustomersMutation(
        'deleteCustomerPaymentInstrument'
    )

    const [isEditing, setIsEditing] = useState(false)
    const form = useForm()
    const showToast = useToast()
    const showError = () => {
        showToast({
            title: formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }

    const hasSavedPayments = paymentInstruments?.length > 0
    const submitForm = async (values) => {
        const paymentInstrument = createCreditCardPaymentBodyFromForm(values)
        const body = {
            bankRoutingNumber: '',
            giftCertificateCode: '',
            ...paymentInstrument,
            paymentCard: {
                ...paymentInstrument.paymentCard,
                securityCode: undefined
            }
        }
        try {
            form.clearErrors()
            const data = await addPaymentInstrumentMutation.mutateAsync({
                body,
                parameters: {
                    customerId: customer.customerId
                }
            })
            if (data) {
                toggleEdit()
                showToast({
                    title: formatMessage(successfullyAddedMessage),
                    status: 'success',
                    isClosable: true
                })
            }
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const removePaymentInstrument = async (paymentInstrumentId) => {
        try {
            await removePaymentInstrumentMutation.mutateAsync(
                {
                    parameters: {
                        customerId: customer.customerId,
                        paymentInstrumentId
                    }
                },
                {
                    onSuccess: () => {
                        showToast({
                            title: formatMessage(successfullyRemovedMessage),
                            status: 'success',
                            isClosable: true
                        })
                    }
                }
            )
        } catch (error) {
            showError()
            throw error
        }
    }

    const toggleEdit = () => {
        form.reset()
        setIsEditing(!isEditing)
    }

    return (
        <Stack spacing={4} data-testid="account-payment-methods-page">
            <Heading as="h1" fontSize="2xl">
                <FormattedMessage
                    defaultMessage="Payment Methods"
                    id="account_payment_methods.title.payment_methods"
                />
            </Heading>

            {isLoading && (
                <SimpleGrid columns={[1, 2, 2, 2, 3]} spacing={4}>
                    {new Array(DEFAULT_SKELETON_COUNT).fill().map((_, index) => {
                        return (
                            <ActionCard key={index}>
                                <Stack spacing={2} marginBottom={3}>
                                    <Skeleton height="23px" width="120px" />

                                    <Skeleton height="23px" width="84px" />

                                    <Skeleton height="23px" width="104px" />
                                </Stack>
                            </ActionCard>
                        )
                    })}
                </SimpleGrid>
            )}

            {hasSavedPayments && (
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
                        onClick={toggleEdit}
                    >
                        <FormattedMessage
                            defaultMessage="Add Payment Method"
                            id="account_payment_methods.button.add_method"
                        />
                        {isEditing && (
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
                        )}
                    </Button>

                    {isEditing && (
                        <CardPaymentForm
                            hasSavedPayments={hasSavedPayments}
                            form={form}
                            toggleEdit={toggleEdit}
                            submitForm={submitForm}
                        />
                    )}

                    {paymentInstruments.map((payment) => {
                        const CardIcon = getCreditCardIcon(payment.paymentCard?.cardType)
                        return (
                            <ActionCard
                                key={payment.paymentInstrumentId}
                                onRemove={() =>
                                    removePaymentInstrument(payment.paymentInstrumentId)
                                }
                            >
                                <Stack direction="row">
                                    {CardIcon && <CardIcon layerStyle="ccIcon" />}
                                    <Stack spacing={4}>
                                        <Stack spacing={1}>
                                            <Text>{payment.paymentCard?.cardType}</Text>
                                            <Stack direction="row">
                                                <Text>
                                                    &bull;&bull;&bull;&bull;{' '}
                                                    {payment.paymentCard?.numberLastDigits}
                                                </Text>
                                                <Text>
                                                    {payment.paymentCard?.expirationMonth}/
                                                    {payment.paymentCard?.expirationYear}
                                                </Text>
                                            </Stack>
                                            <Text>{payment.paymentCard.holder}</Text>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </ActionCard>
                        )
                    })}
                </SimpleGrid>
            )}

            {!hasSavedPayments && !isEditing && isRegistered && !isLoading && (
                <PageActionPlaceHolder
                    icon={<PaymentIcon boxSize={8} />}
                    heading={formatMessage({
                        defaultMessage: 'No Saved Payment Methods',
                        id: 'account_payment_methods.heading.no_saved_methods'
                    })}
                    text={formatMessage({
                        defaultMessage: 'Add a new payment method for faster checkout.',
                        id: 'account_payment_methods.description.add_method_for_faster_checkout'
                    })}
                    buttonText={formatMessage({
                        defaultMessage: 'Add Payment Method',
                        id: 'account_payment_methods.button.add_method'
                    })}
                    onButtonClick={toggleEdit}
                />
            )}

            {isEditing && !hasSavedPayments && (
                <CardPaymentForm
                    hasSavedPayments={hasSavedPayments}
                    form={form}
                    toggleEdit={toggleEdit}
                    submitForm={submitForm}
                />
            )}
        </Stack>
    )
}

AccountPaymentMethods.getTemplateName = () => 'account-payment-methods'

export default AccountPaymentMethods