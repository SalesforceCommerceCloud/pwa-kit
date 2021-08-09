import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Container, Heading, SimpleGrid, Stack, Text} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {shallowEquals} from '../../../utils/utils'
import {useCheckout} from '../util/checkout-context'
import {RadioCard, RadioCardGroup} from '../../../components/radio-card'
import {PlusIcon} from '../../../components/icons'
import AddressFields from '../../../components/forms/address-fields'

const ShippingAddressSelection = ({
    form,
    selectedAddress,
    submitButtonLabel = 'Submit',
    hideSubmitButton = false,
    onSubmit = async () => null
}) => {
    const {customer, removeSavedAddress} = useCheckout()

    const hasSavedAddresses = customer.addresses && customer.addresses.length > 0

    const [isEditingAddress, setIsEditingAddress] = useState(!hasSavedAddresses)

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
            // eslint-disable-next-line no-unused-vars
            const {addressId, creationDate, lastModified, preferred, ...address} = savedAddress
            // eslint-disable-next-line no-unused-vars
            const {id, _type, ...selectedAddr} = selectedAddress
            return shallowEquals(address, selectedAddr)
        })

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

        if (!matchedAddress && selectedAddress) {
            setIsEditingAddress(true)
        }
    }, [matchedAddress])

    const submitForm = async (address) => {
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

    // Opens/closes the 'add address' form. Notice that when toggling either state,
    // we reset the form so as to remove any address selection.
    const toggleAddressEdit = () => {
        if (!isEditingAddress) {
            form.reset({addressId: ''})
        }
        setIsEditingAddress(!isEditingAddress)
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
                                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                                    {customer.addresses?.map((address) => (
                                        <RadioCard
                                            key={address.addressId}
                                            value={address.addressId}
                                        >
                                            <Stack spacing={4}>
                                                <Box>
                                                    <Text fontWeight="bold" mb={1}>
                                                        {address.fullName}
                                                    </Text>
                                                    <Text>{address.address1}</Text>
                                                    <Text>
                                                        {address.city}, {address.territory}{' '}
                                                        {address.postalCode}
                                                    </Text>
                                                    <Text>{address.countryCode}</Text>
                                                </Box>
                                                <Stack direction="row" spacing={4}>
                                                    <Button variant="link" size="sm">
                                                        <FormattedMessage defaultMessage="Edit" />
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        colorScheme="red"
                                                        onClick={() =>
                                                            removeSavedAddress(address.addressId)
                                                        }
                                                    >
                                                        <FormattedMessage defaultMessage="Remove" />
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </RadioCard>
                                    ))}

                                    {!isEditingAddress && (
                                        <Button
                                            variant="outline"
                                            border="1px dashed"
                                            borderColor="gray.200"
                                            color="blue.600"
                                            h={['44px', '44px', '167px']}
                                            rounded="base"
                                            fontWeight="medium"
                                            leftIcon={<PlusIcon boxSize={'15px'} />}
                                            onClick={toggleAddressEdit}
                                        >
                                            <FormattedMessage defaultMessage="Add New Address" />
                                        </Button>
                                    )}
                                </SimpleGrid>
                            </RadioCardGroup>
                        )}
                    />
                )}

                {isEditingAddress && (
                    <Box
                        {...(hasSavedAddresses && {
                            px: [4, 4, 6],
                            py: 6,
                            rounded: 'base',
                            border: '1px solid',
                            borderColor: 'blue.600'
                        })}
                    >
                        <Stack spacing={6}>
                            {hasSavedAddresses && (
                                <Heading as="h3" size="sm">
                                    <FormattedMessage defaultMessage="Add New Address" />
                                </Heading>
                            )}

                            <Stack spacing={6}>
                                <AddressFields
                                    form={form}
                                    isGuest={customer.authType === 'guest'}
                                />

                                {!hideSubmitButton && (
                                    <Box>
                                        <Container variant="form">
                                            <Button
                                                type="submit"
                                                w="full"
                                                disabled={form.formState.isSubmitting}
                                            >
                                                {submitButtonLabel}
                                            </Button>
                                        </Container>
                                    </Box>
                                )}
                            </Stack>
                        </Stack>
                    </Box>
                )}
                {!isEditingAddress && !hideSubmitButton && (
                    <Box pt={2}>
                        <Container variant="form">
                            <Button
                                type="submit"
                                w="full"
                                disabled={!form.formState.isValid || form.formState.isSubmitting}
                            >
                                {submitButtonLabel}
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
    submitButtonLabel: PropTypes.string,

    /** Show or hide the submit button (for controlling the form from outside component) */
    hideSubmitButton: PropTypes.bool,

    /** Callback for form submit */
    onSubmit: PropTypes.func
}

export default ShippingAddressSelection
