/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Alert,
    Box,
    Container,
    Heading,
    SimpleGrid,
    Skeleton as ChakraSkeleton,
    Stack,
    Text,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import ProfileFields from '@salesforce/retail-react-app/app/components/forms/profile-fields'
import UpdatePasswordFields from '@salesforce/retail-react-app/app/components/forms/update-password-fields'
import FormActionButtons from '@salesforce/retail-react-app/app/components/forms/form-action-buttons'
import {
    useShopperCustomersMutation,
    useAuthHelper,
    AuthHelpers
} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

/**
 * This is a specialized Skeleton component that which uses the customers authtype as the
 * `isLoaded` state. It also will revert it's provided size (height, width) when the loaded
 * state changes. This allows you to have skeletons of a specific size, but onece loaded
 * the bounding element will affect the contents size.
 */
// eslint-disable-next-line react/prop-types
const Skeleton = ({children, height, width, ...rest}) => {
    const {data: customer} = useCurrentCustomer()
    const {isRegistered} = customer
    const size = !isRegistered
        ? {
              height,
              width
          }
        : {}
    return (
        <ChakraSkeleton isLoaded={!customer.isLoading} {...rest} {...size}>
            {children}
        </ChakraSkeleton>
    )
}

const ProfileCard = () => {
    const {formatMessage} = useIntl()

    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerId} = customer

    const updateCustomerMutation = useShopperCustomersMutation('updateCustomer')

    const toast = useToast()
    const [isEditing, setIsEditing] = useState(false)

    const form = useForm({
        defaultValues: {
            firstName: customer?.firstName,
            lastName: customer?.lastName,
            email: customer?.email,
            phone: customer?.phoneHome
        }
    })

    useEffect(() => {
        form.reset({
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phoneHome
        })
    }, [customer?.firstName, customer?.lastName, customer?.email, customer?.phoneHome])

    const submit = async (values) => {
        try {
            form.clearErrors()
            updateCustomerMutation.mutate(
                {
                    parameters: {customerId},
                    body: {
                        firstName: values.firstName,
                        lastName: values.lastName,
                        phoneHome: values.phone,
                        // NOTE/ISSUE
                        // The sdk is allowing you to change your email to an already-existing email.
                        // I would expect an error. We also want to keep the email and login the same
                        // for the customer, but the sdk isn't changing the login when we submit an
                        // updated email. This will lead to issues where you change your email but end
                        // up not being able to login since 'login' will no longer match the email.
                        email: values.email,
                        login: values.email
                    }
                },
                {
                    onSuccess: () => {
                        setIsEditing(false)
                        toast({
                            title: formatMessage({
                                defaultMessage: 'Profile updated',
                                id: 'profile_card.info.profile_updated'
                            }),
                            status: 'success',
                            isClosable: true
                        })
                    }
                }
            )
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    return (
        <ToggleCard
            id="my-profile"
            title={
                <Skeleton height="30px" width="120px">
                    {formatMessage({
                        defaultMessage: 'My Profile',
                        id: 'profile_card.title.my_profile'
                    })}
                </Skeleton>
            }
            editing={isEditing}
            isLoading={form.formState.isSubmitting}
            onEdit={isRegistered ? () => setIsEditing(true) : undefined}
            layerStyle="cardBordered"
        >
            <ToggleCardEdit>
                <Container variant="form">
                    <form onSubmit={form.handleSubmit(submit)}>
                        <Stack spacing={6}>
                            {form.formState.errors?.global && (
                                <Alert status="error">
                                    <AlertIcon color="red.500" boxSize={4} />
                                    <Text fontSize="sm" ml={3}>
                                        {form.formState.errors.global.message}
                                    </Text>
                                </Alert>
                            )}
                            <ProfileFields form={form} />
                            <FormActionButtons onCancel={() => setIsEditing(false)} />
                        </Stack>
                    </form>
                </Container>
            </ToggleCardEdit>
            <ToggleCardSummary>
                <SimpleGrid columns={{base: 1, lg: 3}} spacing={4}>
                    <Box>
                        <Skeleton height="21px" width="84px" marginBottom={2}>
                            <Text fontSize="sm" fontWeight="bold">
                                <FormattedMessage
                                    defaultMessage="Full Name"
                                    id="profile_card.label.full_name"
                                />
                            </Text>
                        </Skeleton>

                        <Skeleton height="21px" width="140px">
                            <Text fontSize="sm">
                                {customer?.firstName} {customer?.lastName}
                            </Text>
                        </Skeleton>
                    </Box>
                    <Box>
                        <Skeleton height="21px" width="120px" marginBottom={2}>
                            <Text fontSize="sm" fontWeight="bold">
                                <FormattedMessage
                                    defaultMessage="Email"
                                    id="profile_card.label.email"
                                />
                            </Text>
                        </Skeleton>

                        <Skeleton height="21px" width="64px">
                            <Text fontSize="sm">{customer?.email}</Text>
                        </Skeleton>
                    </Box>
                    <Box>
                        <Skeleton height="21px" width="80px" marginBottom={2}>
                            <Text fontSize="sm" fontWeight="bold">
                                <FormattedMessage
                                    defaultMessage="Phone Number"
                                    id="profile_card.label.phone"
                                />
                            </Text>
                        </Skeleton>

                        <Skeleton height="21px" width="120px">
                            <Text fontSize="sm">
                                {customer?.phoneHome || (
                                    <FormattedMessage
                                        defaultMessage="Not provided"
                                        id="profile_card.message.not_provided"
                                    />
                                )}
                            </Text>
                        </Skeleton>
                    </Box>
                </SimpleGrid>
            </ToggleCardSummary>
        </ToggleCard>
    )
}

const PasswordCard = () => {
    const {formatMessage} = useIntl()

    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerId} = customer

    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)

    const updateCustomerPassword = useShopperCustomersMutation('updateCustomerPassword')
    const toast = useToast()
    const [isEditing, setIsEditing] = useState(false)

    const form = useForm()

    const submit = async (values) => {
        try {
            form.clearErrors()
            updateCustomerPassword.mutate(
                {
                    parameters: {customerId},
                    body: {
                        password: values.password,
                        currentPassword: values.currentPassword
                    }
                },
                {
                    onSuccess: () => {
                        setIsEditing(false)
                        toast({
                            title: formatMessage({
                                defaultMessage: 'Password updated',
                                id: 'password_card.info.password_updated'
                            }),
                            status: 'success',
                            isClosable: true
                        })
                        login.mutate({
                            email: values.email,
                            password: values.password
                        })
                    }
                }
            )
            setIsEditing(false)
            toast({
                title: formatMessage({
                    defaultMessage: 'Password updated',
                    id: 'password_card.info.password_updated'
                }),
                status: 'success',
                isClosable: true
            })
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    return (
        <ToggleCard
            id="password"
            title={
                <Skeleton height="30px" width="120px">
                    {formatMessage({
                        defaultMessage: 'Password',
                        id: 'password_card.title.password'
                    })}
                </Skeleton>
            }
            editing={isEditing}
            isLoading={form.formState.isSubmitting}
            onEdit={isRegistered ? () => setIsEditing(true) : undefined}
            layerStyle="cardBordered"
        >
            <ToggleCardEdit>
                <Container variant="form">
                    <form onSubmit={form.handleSubmit(submit)}>
                        <Stack spacing={6}>
                            {form.formState.errors?.global && (
                                <Alert status="error">
                                    <AlertIcon color="red.500" boxSize={4} />
                                    <Text fontSize="sm" ml={3}>
                                        {form.formState.errors.global.message}
                                    </Text>
                                </Alert>
                            )}
                            <UpdatePasswordFields form={form} />
                            <FormActionButtons onCancel={() => setIsEditing(false)} />
                        </Stack>
                    </form>
                </Container>
            </ToggleCardEdit>
            <ToggleCardSummary>
                <SimpleGrid columns={{base: 1, lg: 3}} spacing={4}>
                    <Box>
                        <Skeleton height="21px" width="84px" marginBottom={2}>
                            <Text fontSize="sm" fontWeight="bold">
                                <FormattedMessage
                                    defaultMessage="Password"
                                    id="password_card.label.password"
                                />
                            </Text>
                        </Skeleton>

                        <Skeleton height="21px" width="140px">
                            <Text fontSize="sm">
                                &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
                            </Text>
                        </Skeleton>
                    </Box>
                </SimpleGrid>
            </ToggleCardSummary>
        </ToggleCard>
    )
}

const AccountDetail = () => {
    return (
        <Stack data-testid="account-detail-page" spacing={6}>
            <Heading as="h1" fontSize="24px">
                <FormattedMessage
                    defaultMessage="Account Details"
                    id="account_detail.title.account_details"
                />
            </Heading>

            <Stack spacing={4}>
                <ProfileCard />
                <PasswordCard />
            </Stack>
        </Stack>
    )
}

AccountDetail.getTemplateName = () => 'account-detail'

export default AccountDetail
