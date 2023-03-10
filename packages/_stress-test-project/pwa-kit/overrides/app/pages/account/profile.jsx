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
} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {AlertIcon} from '../../components/icons'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../components/toggle-card'
import ProfileFields from '../../components/forms/profile-fields'
import UpdatePasswordFields from '../../components/forms/update-password-fields'
import FormActionButtons from '../../components/forms/form-action-buttons'

/**
 * This is a specialized Skeleton component that which uses the customers authtype as the
 * `isLoaded` state. It also will revert it's provided size (height, width) when the loaded
 * state changes. This allows you to have skeletons of a specific size, but onece loaded
 * the bounding element will affect the contents size.
 */
// eslint-disable-next-line react/prop-types
const Skeleton = ({children, height, width, ...rest}) => {
    const {isRegistered} = useCustomer()
    const size = !isRegistered
        ? {
              height,
              width
          }
        : {}

    return (
        <ChakraSkeleton isLoaded={isRegistered} {...rest} {...size}>
            {children}
        </ChakraSkeleton>
    )
}

const ProfileCard = () => {
    const {formatMessage} = useIntl()
    const customer = useCustomer()
    const toast = useToast()
    const [isEditing, setIsEditing] = useState(false)

    const form = useForm({
        defaultValues: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phoneHome
        }
    })

    useEffect(() => {
        form.reset({
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phoneHome
        })
    }, [customer])

    const submit = async (values) => {
        try {
            form.clearErrors()
            await customer.updateCustomer(values)
            setIsEditing(false)
            toast({
                title: formatMessage({
                    defaultMessage: 'Profile updated',
                    id: 'profile_card.info.profile_updated'
                }),
                status: 'success',
                isClosable: true
            })
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const {isRegistered} = customer

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
                            {form.errors?.global && (
                                <Alert status="error">
                                    <AlertIcon color="red.500" boxSize={4} />
                                    <Text fontSize="sm" ml={3}>
                                        {form.errors.global.message}
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
                                {customer.firstName} {customer.lastName}
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
                            <Text fontSize="sm">{customer.email}</Text>
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
                                {customer.phoneHome || (
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
    const customer = useCustomer()
    const toast = useToast()
    const [isEditing, setIsEditing] = useState(false)

    const form = useForm()

    const submit = async (values) => {
        try {
            form.clearErrors()
            await customer.updatePassword(values, customer.email)
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

    const {isRegistered} = customer

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
                            {form.errors?.global && (
                                <Alert status="error">
                                    <AlertIcon color="red.500" boxSize={4} />
                                    <Text fontSize="sm" ml={3}>
                                        {form.errors.global.message}
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
