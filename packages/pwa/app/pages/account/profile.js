/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Alert,
    Box,
    Button,
    Container,
    Heading,
    SimpleGrid,
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
                title: formatMessage({defaultMessage: 'Profile updated'}),
                status: 'success',
                isClosable: true
            })
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    return (
        <ToggleCard
            id="my-profile"
            title={formatMessage({defaultMessage: 'My Profile'})}
            editing={isEditing}
            isLoading={form.formState.isSubmitting}
            onEdit={() => setIsEditing(true)}
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
                        <Text fontSize="sm" fontWeight="bold">
                            <FormattedMessage defaultMessage="Full Name" />
                        </Text>
                        <Text fontSize="sm">
                            {customer.firstName} {customer.lastName}
                        </Text>
                    </Box>
                    <Box>
                        <Text fontSize="sm" fontWeight="bold">
                            <FormattedMessage defaultMessage="Email" />
                        </Text>
                        <Text fontSize="sm">{customer.email}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="sm" fontWeight="bold">
                            <FormattedMessage defaultMessage="Phone Number" />
                        </Text>
                        <Text fontSize="sm">
                            {customer.phoneHome || (
                                <FormattedMessage defaultMessage="Not provided" />
                            )}
                        </Text>
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
            await customer.updatePassword(values)
            setIsEditing(false)
            toast({
                title: formatMessage({defaultMessage: 'Password updated'}),
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
            title={formatMessage({defaultMessage: 'Password'})}
            editing={isEditing}
            isLoading={form.formState.isSubmitting}
            onEdit={() => setIsEditing(true)}
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
                        <Text fontSize="sm" fontWeight="bold">
                            <FormattedMessage defaultMessage="Password" />
                        </Text>
                        <Text fontSize="sm">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</Text>
                    </Box>
                </SimpleGrid>
            </ToggleCardSummary>
        </ToggleCard>
    )
}

const AccountDetail = () => {
    const customer = useCustomer()

    return (
        <Stack data-testid="account-detail-page" spacing={6}>
            <Heading as="h1" fontSize="24px">
                <FormattedMessage defaultMessage="Account Details" />
            </Heading>

            <Stack spacing={4}>
                <ProfileCard />
                <PasswordCard />
            </Stack>

            <Box>
                <Button variant="link" onClick={() => customer.logout()}>
                    <FormattedMessage defaultMessage="Sign out" />
                </Button>
            </Box>
        </Stack>
    )
}

AccountDetail.getTemplateName = () => 'account-detail'

export default AccountDetail
