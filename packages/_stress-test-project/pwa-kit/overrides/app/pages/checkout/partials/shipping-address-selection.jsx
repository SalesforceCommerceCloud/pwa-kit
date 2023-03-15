/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import {Box, Button, Container, Heading, SimpleGrid, Stack} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {shallowEquals} from '../../../utils/utils'
import {useCheckout} from '../util/checkout-context'
import {RadioCard, RadioCardGroup} from '../../../components/radio-card'
import ActionCard from '../../../components/action-card'
import {PlusIcon} from '../../../components/icons'
import AddressDisplay from '../../../components/address-display'
import AddressFields from '../../../components/forms/address-fields'
import FormActionButtons from '../../../components/forms/form-action-buttons'
import {MESSAGE_PROPTYPE} from '../../../utils/locale'

const saveButtonMessage = defineMessage({
    defaultMessage: 'Save & Continue to Shipping Method',
    id: 'shipping_address_edit_form.button.save_and_continue'
})

const ShippingAddressEditForm = ({
    title,
    hasSavedAddresses,
    toggleAddressEdit,
    hideSubmitButton,
    form,
    submitButtonLabel
}) => {
    const {formatMessage} = useIntl()

    return (
        <Box
            {...(hasSavedAddresses && {
                gridColumn: [1, 1, 'span 2'],
                paddingX: [4, 4, 6],
                paddingY: 6,
                rounded: 'base',
                border: '1px solid',
                borderColor: 'blue.600'
            })}
            data-testid="sf-shipping-address-edit-form"
        >
            <Stack spacing={6}>
                {hasSavedAddresses && (
                    <Heading as="h3" size="sm">
                        {title}
                    </Heading>
                )}

                <Stack spacing={6}>
                    <AddressFields form={form} />

                    {hasSavedAddresses && !hideSubmitButton ? (
                        <FormActionButtons
                            saveButtonLabel={saveButtonMessage}
                            onCancel={toggleAddressEdit}
                        />
                    ) : (
                        !hideSubmitButton && (
                            <Box>
                                <Container variant="form">
                                    <Button
                                        type="submit"
                                        width="full"
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {formatMessage(submitButtonLabel)}
                                    </Button>
                                </Container>
                            </Box>
                        )
                    )}
                </Stack>
            </Stack>
        </Box>
    )
}

ShippingAddressEditForm.propTypes = {
    title: PropTypes.string,
    hasSavedAddresses: PropTypes.bool,
    toggleAddressEdit: PropTypes.func,
    hideSubmitButton: PropTypes.bool,
    form: PropTypes.object,
    submitButtonLabel: MESSAGE_PROPTYPE
}

const submitButtonMessage = defineMessage({
    defaultMessage: 'Submit',
    id: 'shipping_address_selection.button.submit'
})

const ShippingAddressSelection = ({
    form,
    selectedAddress,
    submitButtonLabel = submitButtonMessage,
    hideSubmitButton = false,
    onSubmit = async () => null
}) => {
    const {formatMessage} = useIntl()
    const {customer} = useCheckout()
    const hasSavedAddresses = customer.addresses && customer.addresses.length > 0
    const [isEditingAddress, setIsEditingAddress] = useState(!hasSavedAddresses)
    const [selectedAddressId, setSelectedAddressId] = useState(false)

    form =
        form ||
        useForm({
            mode: 'onChange',
            shouldUnregister: false,
            defaultValues: {
                ...selectedAddress
            }
        })

    const matchedAddress =
        hasSavedAddresses &&
        selectedAddress &&
        customer.addresses.find((savedAddress) => {
            const {addressId, creationDate, lastModified, preferred, ...address} = savedAddress
            const {id, _type, ...selectedAddr} = selectedAddress
            return shallowEquals(address, selectedAddr)
        })

    useEffect(() => {
        // Automatically select the customer's default/preferred shipping address
        if (customer.addresses) {
            const address = customer.addresses.find((addr) => addr.preferred === true)
            if (address) {
                form.reset({...address})
            }
        }
    }, [])

    useEffect(() => {
        // If the customer deletes all their saved addresses during checkout,
        // we need to make sure to display the address form.
        if (!customer?.addresses && !isEditingAddress) {
            setIsEditingAddress(true)
        }
    }, [customer])

    useEffect(() => {
        if (matchedAddress) {
            form.reset({
                addressId: matchedAddress.addressId,
                ...matchedAddress
            })
        }

        if (!matchedAddress && selectedAddressId) {
            setIsEditingAddress(true)
        }
    }, [matchedAddress])

    // Updates the selected customer address if we've an address selected
    // else saves a new customer address
    const submitForm = async (address) => {
        if (selectedAddressId) {
            address = {...address, addressId: selectedAddressId}
        }

        setIsEditingAddress(false)
        form.reset({addressId: ''})

        await onSubmit(address)
    }

    // Acts as our `onChange` handler for addressId radio group. We do this
    // manually here so we can toggle off the 'add address' form as needed.
    const handleAddressIdSelection = (addressId) => {
        if (addressId && isEditingAddress) {
            setIsEditingAddress(false)
        }

        const address = customer.addresses.find((addr) => addr.addressId === addressId)

        form.reset({...address})
    }

    const removeSavedAddress = async (addressId) => {
        if (addressId === selectedAddressId) {
            setSelectedAddressId(undefined)
            setIsEditingAddress(false)
            form.reset({addressId: ''})
        }

        await customer.removeSavedAddress(addressId)
    }

    // Opens/closes the 'add address' form. Notice that when toggling either state,
    // we reset the form so as to remove any address selection.
    const toggleAddressEdit = (address = undefined) => {
        if (address?.addressId) {
            setSelectedAddressId(address.addressId)
            form.reset({...address})
            setIsEditingAddress(true)
        } else {
            setSelectedAddressId(undefined)
            form.reset({addressId: ''})
            setIsEditingAddress(!isEditingAddress)
        }

        form.trigger()
    }

    return (
        <form onSubmit={form.handleSubmit(submitForm)}>
            <Stack spacing={4}>
                {hasSavedAddresses && (
                    <Controller
                        name="addressId"
                        defaultValue=""
                        control={form.control}
                        rules={{required: !isEditingAddress}}
                        render={({value}) => (
                            <RadioCardGroup value={value} onChange={handleAddressIdSelection}>
                                <SimpleGrid
                                    columns={[1, 1, 2]}
                                    spacing={4}
                                    gridAutoFlow="row dense"
                                >
                                    {customer.addresses?.map((address, index) => (
                                        <React.Fragment key={address.addressId}>
                                            <RadioCard value={address.addressId}>
                                                <ActionCard
                                                    padding={0}
                                                    border="none"
                                                    onRemove={() =>
                                                        removeSavedAddress(address.addressId)
                                                    }
                                                    onEdit={() => toggleAddressEdit(address)}
                                                    data-testid={`sf-checkout-shipping-address-${index}`}
                                                >
                                                    <AddressDisplay address={address} />
                                                </ActionCard>
                                                {/*Arrow up icon pointing to the address that is being edited*/}
                                                {isEditingAddress &&
                                                    address.addressId === selectedAddressId && (
                                                        <Box
                                                            width={3}
                                                            height={3}
                                                            borderLeft="1px solid"
                                                            borderTop="1px solid"
                                                            borderColor="blue.600"
                                                            position="absolute"
                                                            left="50%"
                                                            bottom="-23px"
                                                            background="white"
                                                            transform="rotate(45deg)"
                                                        />
                                                    )}
                                            </RadioCard>
                                            {isEditingAddress &&
                                                address.addressId === selectedAddressId && (
                                                    <ShippingAddressEditForm
                                                        title={formatMessage({
                                                            defaultMessage: 'Edit Shipping Address',
                                                            id: 'shipping_address_selection.title.edit_shipping'
                                                        })}
                                                        hasSavedAddresses={hasSavedAddresses}
                                                        toggleAddressEdit={toggleAddressEdit}
                                                        hideSubmitButton={hideSubmitButton}
                                                        form={form}
                                                        submitButtonLabel={submitButtonLabel}
                                                    />
                                                )}
                                        </React.Fragment>
                                    ))}

                                    <Button
                                        variant="outline"
                                        border="1px dashed"
                                        borderColor="gray.200"
                                        color="blue.600"
                                        height={['44px', '44px', '167px']}
                                        rounded="base"
                                        fontWeight="medium"
                                        leftIcon={<PlusIcon boxSize={'15px'} />}
                                        onClick={toggleAddressEdit}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Add New Address"
                                            id="shipping_address_selection.button.add_address"
                                        />
                                        {/*Arrow up icon pointing to the new address that is being added*/}
                                        {isEditingAddress && !selectedAddressId && (
                                            <Box
                                                width={3}
                                                height={3}
                                                borderLeft="1px solid"
                                                borderTop="1px solid"
                                                borderColor="blue.600"
                                                position="absolute"
                                                left="50%"
                                                bottom="-23px"
                                                background="white"
                                                transform="rotate(45deg)"
                                            />
                                        )}
                                    </Button>
                                </SimpleGrid>
                            </RadioCardGroup>
                        )}
                    />
                )}

                {isEditingAddress && !selectedAddressId && (
                    <ShippingAddressEditForm
                        title={formatMessage({
                            defaultMessage: 'Add New Address',
                            id: 'shipping_address_selection.title.add_address'
                        })}
                        hasSavedAddresses={hasSavedAddresses}
                        toggleAddressEdit={toggleAddressEdit}
                        hideSubmitButton={hideSubmitButton}
                        form={form}
                        submitButtonLabel={submitButtonLabel}
                    />
                )}

                {!isEditingAddress && !hideSubmitButton && (
                    <Box pt={2}>
                        <Container variant="form">
                            <Button
                                type="submit"
                                width="full"
                                disabled={!form.formState.isValid || form.formState.isSubmitting}
                            >
                                {formatMessage(submitButtonLabel)}
                            </Button>
                        </Container>
                    </Box>
                )}
            </Stack>
        </form>
    )
}

ShippingAddressSelection.propTypes = {
    /** The form object returnd from `useForm` */
    form: PropTypes.object,

    /** Optional address to use as default selection */
    selectedAddress: PropTypes.object,

    /** Override the submit button label */
    submitButtonLabel: MESSAGE_PROPTYPE,

    /** Show or hide the submit button (for controlling the form from outside component) */
    hideSubmitButton: PropTypes.bool,

    /** Callback for form submit */
    onSubmit: PropTypes.func
}

export default ShippingAddressSelection
