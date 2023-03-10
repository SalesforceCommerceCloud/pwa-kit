/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'

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

const ShippingAddressForm = ({form, hasAddresses, selectedAddressId, toggleEdit, submitForm}) => {
    return (
        <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="base"
            position="relative"
            {...(hasAddresses && {
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
                    {selectedAddressId ? (
                        <FormattedMessage
                            defaultMessage="Edit Address"
                            id="shipping_address_form.heading.edit_address"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Add New Address"
                            id="shipping_address_form.heading.new_address"
                        />
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
    )
}

ShippingAddressForm.propTypes = {
    form: PropTypes.object,
    hasAddresses: PropTypes.bool,
    selectedAddressId: PropTypes.string,
    toggleEdit: PropTypes.func,
    submitForm: PropTypes.func
}

const AccountAddresses = () => {
    const {formatMessage} = useIntl()
    const {isRegistered, addresses, addSavedAddress, updateSavedAddress, removeSavedAddress} =
        useCustomer()
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
                    ? formatMessage({
                          defaultMessage: 'Address updated',
                          id: 'account_addresses.info.address_updated'
                      })
                    : formatMessage({
                          defaultMessage: 'New address saved',
                          id: 'account_addresses.info.new_address_saved'
                      }),
                status: 'success',
                isClosable: true
            })
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const removeAddress = async (addressId) => {
        try {
            if (addressId === selectedAddressId) {
                setSelectedAddressId(undefined)
                setIsEditing(false)
                form.reset({addressId: ''})
            }
            await removeSavedAddress(addressId)
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const toggleEdit = (address) => {
        form.reset({...address})

        if (address?.addressId) {
            setSelectedAddressId(address.addressId)
            setIsEditing(true)
        } else {
            setSelectedAddressId(undefined)
            setIsEditing(!isEditing)
        }
    }

    return (
        <Stack spacing={4} data-testid="account-addresses-page">
            <Heading as="h1" fontSize="2xl">
                <FormattedMessage
                    defaultMessage="Addresses"
                    id="account_addresses.title.addresses"
                />
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

            {hasAddresses && (
                <SimpleGrid columns={[1, 2, 2, 2, 3]} spacing={4} gridAutoFlow="row dense">
                    {
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
                                defaultMessage="Add Address"
                                id="account_addresses.button.add_address"
                            />
                            {isEditing && !selectedAddressId && <BoxArrow />}
                        </Button>
                    }

                    {isEditing && !selectedAddressId && (
                        <ShippingAddressForm
                            form={form}
                            hasAddresses={hasAddresses}
                            submitForm={submitForm}
                            selectedAddressId={selectedAddressId}
                            toggleEdit={toggleEdit}
                        />
                    )}

                    {addresses.map((address) => (
                        <React.Fragment key={address.addressId}>
                            <ActionCard
                                borderColor="gray.200"
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
                                        <FormattedMessage
                                            defaultMessage="Default"
                                            id="account_addresses.badge.default"
                                        />
                                    </Badge>
                                )}
                                <AddressDisplay address={address} />
                                {isEditing && address.addressId === selectedAddressId && (
                                    <BoxArrow />
                                )}
                            </ActionCard>

                            {isEditing && address.addressId === selectedAddressId && (
                                <ShippingAddressForm
                                    form={form}
                                    hasAddresses={hasAddresses}
                                    submitForm={submitForm}
                                    selectedAddressId={selectedAddressId}
                                    toggleEdit={toggleEdit}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </SimpleGrid>
            )}

            {!hasAddresses && (
                <>
                    {!isEditing && isRegistered && (
                        <PageActionPlaceHolder
                            icon={<LocationIcon boxSize={8} />}
                            heading={formatMessage({
                                defaultMessage: 'No Saved Addresses',
                                id: 'account_addresses.page_action_placeholder.heading.no_saved_addresses'
                            })}
                            text={formatMessage({
                                defaultMessage: 'Add a new address method for faster checkout.',
                                id: 'account_addresses.page_action_placeholder.message.add_new_address'
                            })}
                            buttonText={formatMessage({
                                defaultMessage: 'Add Address',
                                id: 'account_addresses.page_action_placeholder.button.add_address'
                            })}
                            onButtonClick={toggleEdit}
                        />
                    )}
                    {isEditing && !selectedAddressId && (
                        <ShippingAddressForm
                            form={form}
                            hasAddresses={hasAddresses}
                            submitForm={submitForm}
                            selectedAddressId={selectedAddressId}
                            toggleEdit={toggleEdit}
                        />
                    )}
                </>
            )}
        </Stack>
    )
}

AccountAddresses.getTemplateName = () => 'account-addresses'

export default AccountAddresses
