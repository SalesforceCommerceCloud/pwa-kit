/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Container,
    Heading,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,

    // Hooks
    useToast
} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import FormActionButtons from '../../components/forms/form-action-buttons'
import {useForm} from 'react-hook-form'
import LoadingSpinner from '../../components/loading-spinner'
import {LocationIcon, PlusIcon} from '../../components/icons'
import ActionCard from '../../components/action-card'
import AddressFields from '../../components/forms/address-fields'
import AddressDisplay from '../../components/address-display'
import PageActionPlaceHolder from '../../components/page-action-placeholder'

const DEFAULT_SKELETON_COUNT = 3

const AccountAddresses = () => {
    const {formatMessage} = useIntl()
    const {
        isRegistered,
        addresses,
        addSavedAddress,
        updateSavedAddress,
        removeSavedAddress
    } = useCustomer()
    const [isEditing, setIsEditing] = useState(false)
    const [selectedAddressId, setSelectedAddressId] = useState(false)
    const toast = useToast()
    const form = useForm()

    const hasAddresses = addresses?.length > 0

    const submitForm = async (address) => {
        try {
            form.clearErrors()
            if (selectedAddressId) {
                await updateSavedAddress({...address, addressId: selectedAddressId})
            } else {
                await addSavedAddress(address)
            }
            toggleEdit()
            toast({
                title: selectedAddressId
                    ? formatMessage({defaultMessage: 'Address Updated'})
                    : formatMessage({defaultMessage: 'New Address Saved'}),
                status: 'success',
                isClosable: true
            })
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const removeAddress = async (addressId) => {
        try {
            await removeSavedAddress(addressId)
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const toggleEdit = (address) => {
        form.reset({...address})

        if (address?.addressId) {
            setSelectedAddressId(address.addressId)
        } else {
            setSelectedAddressId(undefined)
        }

        setIsEditing(!isEditing)
    }

    return (
        <Stack spacing={4} data-testid="account-addresses-page">
            <Heading as="h1" fontSize="2xl">
                <FormattedMessage defaultMessage="Addresses" />
            </Heading>

            {!isRegistered && (
                <SimpleGrid columns={[1, 2, 2, 2, 3]} spacing={4}>
                    {new Array(DEFAULT_SKELETON_COUNT).fill().map((_, index) => {
                        return (
                            <ActionCard key={index}>
                                <Stack spacing={2} marginBottom={7}>
                                    <Skeleton height="23px" width="120px" />

                                    <Skeleton height="23px" width="84px" />

                                    <Skeleton height="23px" width="104px" />
                                </Stack>
                            </ActionCard>
                        )
                    })}
                </SimpleGrid>
            )}

            {isEditing && (
                <Box
                    position="relative"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="base"
                >
                    {form.formState.isSubmitting && <LoadingSpinner />}
                    <Stack spacing={6} padding={6}>
                        <Heading as="h3" size="sm">
                            {selectedAddressId ? (
                                <FormattedMessage defaultMessage="Edit Address" />
                            ) : (
                                <FormattedMessage defaultMessage="Add New Address" />
                            )}
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
                                        <AddressFields form={form} />
                                        <FormActionButtons onCancel={toggleEdit} />
                                    </Stack>
                                </form>
                            </Container>
                        </Box>
                    </Stack>
                </Box>
            )}

            {hasAddresses && !isEditing && (
                <SimpleGrid columns={[1, 2, 2, 2, 3]} spacing={4}>
                    {!isEditing && (
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
                            <FormattedMessage defaultMessage="Add Address" />
                        </Button>
                    )}

                    {addresses.map((address) => (
                        <ActionCard
                            key={address.addressId}
                            onRemove={() => removeAddress(address.addressId)}
                            onEdit={() => toggleEdit(address)}
                        >
                            {address.preferred && (
                                <Badge
                                    position="absolute"
                                    fontSize="xs"
                                    right={4}
                                    variant="solid"
                                    bg="gray.100"
                                    color="gray.900"
                                >
                                    <FormattedMessage defaultMessage="Default" />
                                </Badge>
                            )}
                            <AddressDisplay address={address} />
                        </ActionCard>
                    ))}
                </SimpleGrid>
            )}

            {!hasAddresses && !isEditing && isRegistered && (
                <PageActionPlaceHolder
                    icon={<LocationIcon boxSize={8} />}
                    heading={formatMessage({defaultMessage: 'No Saved Addresses'})}
                    text={formatMessage({
                        defaultMessage: 'Add a new address method for faster checkout'
                    })}
                    buttonText={formatMessage({
                        defaultMessage: 'Add Address'
                    })}
                    onButtonClick={toggleEdit}
                />
            )}
        </Stack>
    )
}

AccountAddresses.getTemplateName = () => 'account-addresses'

export default AccountAddresses
