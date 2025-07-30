/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState, useMemo} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'

import {
    Alert,
    Badge,
    Box,
    Button,
    Container,
    Heading,
    SimpleGrid,
    Skeleton,
    Stack,
    Text
} from '@chakra-ui/react'
import FormActionButtons from '../../components/forms/form-action-buttons'
import {useForm} from 'react-hook-form'
import useToast from '../../hooks/use-toast'

import LoadingSpinner from '../../components/loading-spinner'
import {LocationIcon, PlusIcon} from '../../components/icons'
import ActionCard from '../../components/action-card'
import AddressFields from '../../components/forms/address-fields'
import AddressDisplay from '../../components/address-display'
import PageActionPlaceHolder from '../../components/page-action-placeholder'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {nanoid} from 'nanoid'
import {useErrorHandler} from '../../hooks/use-errors'

const DEFAULT_SKELETON_COUNT = 3

const BoxArrow = () => {
    return (
        <Box
            width={4}
            height={4}
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
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(() => ({
        editAddress: formatMessage({
            id: 'shipping_address_form.heading.edit_address',
            defaultMessage: 'Edit Address'
        }),
        newAddress: formatMessage({
            id: 'shipping_address_form.heading.new_address',
            defaultMessage: 'Add New Address'
        })
    }), [intl])

    return (
        <Box
            border="1px solid"
            borderColor="gray.200"
            rounded="md"
            position="relative"
            {...(hasAddresses && {
                gridColumn: [1, 'span 2', 'span 2', 'span 2', 'span 3'],
                px: [4, 4, 6],
                py: 6,
                rounded: 'md',
                border: '1px solid',
                borderColor: 'blue.600'
            })}
        >
            {form.formState.isSubmitting && <LoadingSpinner />}
            <Stack gap={6} p={6}>
                <Heading as="h3" size="sm">
                    {selectedAddressId ? messages.editAddress : messages.newAddress}
                </Heading>
                <Box>
                    <Container variant="form">
                        <form onSubmit={form.handleSubmit(submitForm)}>
                            <Stack gap={6}>
                                {form.formState.errors?.global && (
                                    <Alert.Root colorPalette="red">
                                        <Alert.Indicator />
                                        <Alert.Content>
                                            <Text fontSize="sm">
                                                {form.formState.errors.global.message}
                                            </Text>
                                        </Alert.Content>
                                    </Alert.Root>
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
    const intl = useIntl()
    const {formatMessage} = intl
    const {data: customer, isLoading} = useCurrentCustomer()
    const {isRegistered, addresses, customerId} = customer

    const messages = useMemo(() => ({
        addresses: formatMessage({
            id: 'account_addresses.title.addresses',
            defaultMessage: 'Addresses'
        }),
        addAddress: formatMessage({
            id: 'account_addresses.button.add_address',
            defaultMessage: 'Add Address'
        }),
        default: formatMessage({
            id: 'account_addresses.badge.default',
            defaultMessage: 'Default'
        }),
        noSavedAddresses: formatMessage({
            id: 'account_addresses.page_action_placeholder.heading.no_saved_addresses',
            defaultMessage: 'No Saved Addresses'
        }),
        addNewAddressMessage: formatMessage({
            id: 'account_addresses.page_action_placeholder.message.add_new_address',
            defaultMessage: 'Add a new address method for faster checkout.'
        }),
        addAddressButton: formatMessage({
            id: 'account_addresses.page_action_placeholder.button.add_address',
            defaultMessage: 'Add Address'
        }),
        successfullyAddedAddress: formatMessage({
            id: 'account_addresses.info.new_address_saved',
            defaultMessage: 'New address saved'
        }),
        successfullyUpdatedAddress: formatMessage({
            id: 'account_addresses.info.address_updated',
            defaultMessage: 'Address updated'
        }),
        successfullyRemovedAddress: formatMessage({
            id: 'account_addresses.info.address_removed',
            defaultMessage: 'Address removed'
        }),
        editButtonLabel: (address) => formatMessage(
            {
                id: 'shipping_address.label.edit_button',
                defaultMessage: 'Edit {address}'
            },
            {address}
        ),
        removeButtonLabel: (address) => formatMessage(
            {
                id: 'shipping_address.label.remove_button',
                defaultMessage: 'Remove {address}'
            },
            {address}
        )
    }), [intl])

    const addCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateSavedAddress = useShopperCustomersMutation('updateCustomerAddress')
    const removeCustomerAddress = useShopperCustomersMutation('removeCustomerAddress')

    const [isEditing, setIsEditing] = useState(false)
    const [selectedAddressId, setSelectedAddressId] = useState(false)
    const toast = useToast()
    const form = useForm()
    const showError = useErrorHandler()

    const headingRef = useRef()
    useEffect(() => {
        // Focus the 'Addresses' header when the component mounts for accessibility
        headingRef?.current?.focus()
    }, [])

    // keep track of the edit buttons so we can focus on them later for accessibility
    const [editBtnRefs, setEditBtnRefs] = useState({})
    useEffect(() => {
        const currentRefs = {}
        addresses?.forEach(({addressId}) => {
            currentRefs[addressId] = React.createRef()
        })
        setEditBtnRefs(currentRefs)
    }, [addresses])

    const hasAddresses = addresses?.length > 0
    const submitForm = async (address) => {
        try {
            let data
            form.clearErrors()
            if (selectedAddressId) {
                const body = {
                    ...address,
                    addressId: selectedAddressId
                }
                data = await updateSavedAddress.mutateAsync({
                    body,
                    parameters: {
                        customerId,
                        addressName: selectedAddressId
                    }
                })
            } else {
                const body = {
                    addressId: nanoid(),
                    ...address
                }
                data = await addCustomerAddress.mutateAsync({
                    body,
                    parameters: {customerId: customer.customerId}
                })
            }
            if (data) {
                toggleEdit()
                toast({
                    title: selectedAddressId
                        ? messages.successfullyUpdatedAddress
                        : messages.successfullyAddedAddress,
                    type: 'success'
                })
            }
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
            await removeCustomerAddress.mutateAsync(
                {
                    parameters: {
                        customerId,
                        addressName: addressId
                    }
                },
                {
                    onSuccess: () => {
                        toast({
                            title: messages.successfullyRemovedAddress,
                            type: 'success'
                        })
                        // Move focus to header after we successfully remove address
                        headingRef?.current?.focus()
                    }
                }
            )
        } catch (error) {
            showError()
            throw error
        }
    }

    const toggleEdit = (address) => {
        form.reset({...address})

        if (address?.addressId) {
            setSelectedAddressId(address.addressId)
            setIsEditing(true)
        } else {
            // Focus on the edit button that opened the form when the form closes
            // otherwise focus on the heading if we can't find the button
            const focusAfterClose = editBtnRefs[selectedAddressId]?.current ?? headingRef?.current
            focusAfterClose?.focus()
            setSelectedAddressId(undefined)
            setIsEditing(!isEditing)
        }
    }

    return (
        <Stack gap={4} data-testid="account-addresses-page">
            <Heading as="h1" fontSize="2xl" tabIndex="0" ref={headingRef}>
                {messages.addresses}
            </Heading>

            {isLoading && (
                <SimpleGrid columns={[1, 2, 2, 2, 3]} gap={4}>
                    {new Array(DEFAULT_SKELETON_COUNT).fill().map((_, index) => {
                        return (
                            <ActionCard key={index}>
                                <Stack gap={2} mb={7}>
                                    <Skeleton height={6} width={30} />

                                    <Skeleton height={6} width={21} />

                                    <Skeleton height={6} width={26} />
                                </Stack>
                            </ActionCard>
                        )
                    })}
                </SimpleGrid>
            )}

            {hasAddresses && (
                <SimpleGrid columns={[1, 2, 2, 2, 3]} gap={4} gridAutoFlow="row dense">
                    {
                        <Button
                            variant="outline"
                            border="1px dashed"
                            borderColor="gray.200"
                            color="blue.600"
                            height={{lg: 'full'}}
                            minHeight={11}
                            rounded="md"
                            fontWeight="medium"
                            leftIcon={<PlusIcon display="block" boxSize={4} />}
                            onClick={() => toggleEdit()}
                        >
                            {messages.addAddress}
                            {isEditing && !selectedAddressId && <BoxArrow />}
                        </Button>
                    }

                    {isEditing && !selectedAddressId && (
                        <>
                            <ShippingAddressForm
                                form={form}
                                hasAddresses={hasAddresses}
                                submitForm={submitForm}
                                selectedAddressId={selectedAddressId}
                                toggleEdit={toggleEdit}
                            />
                        </>
                    )}

                    {addresses.map((address) => {
                        const editLabel = messages.editButtonLabel(address.address1)
                        const removeLabel = messages.removeButtonLabel(address.address1)

                        return (
                            <React.Fragment key={address.addressId}>
                                <ActionCard
                                    borderColor="gray.200"
                                    key={address.addressId}
                                    editBtnRef={editBtnRefs[address.addressId]}
                                    onRemove={() => removeAddress(address.addressId)}
                                    onEdit={() => toggleEdit(address)}
                                    editBtnLabel={editLabel}
                                    removeBtnLabel={removeLabel}
                                >
                                    {address.preferred && (
                                        <Badge
                                            position="absolute"
                                            right={4}
                                            variant="solid"
                                            bg="gray.100"
                                            color="gray.900"
                                        >
                                            {messages.default}
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
                        )
                    })}
                </SimpleGrid>
            )}

            {!hasAddresses && !isLoading && (
                <>
                    {!isEditing && isRegistered && (
                        <PageActionPlaceHolder
                            icon={<LocationIcon boxSize={8} />}
                            heading={messages.noSavedAddresses}
                            text={messages.addNewAddressMessage}
                            buttonText={messages.addAddressButton}
                            onButtonClick={() => toggleEdit()}
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
