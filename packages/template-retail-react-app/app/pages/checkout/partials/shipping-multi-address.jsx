/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
import {useIntl, defineMessage} from 'react-intl'
import PropTypes from 'prop-types'
import {useForm} from 'react-hook-form'
import {nanoid} from 'nanoid'

import {useProducts, useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

import AddressFields from '@salesforce/retail-react-app/app/components/forms/address-fields'
import FormActionButtons from '@salesforce/retail-react-app/app/components/forms/form-action-buttons'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {
    Text,
    Button,
    Box,
    Flex,
    VStack,
    HStack,
    Image,
    Select,
    List,
    ListItem,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Center,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {usePickupShipment} from '@salesforce/retail-react-app/app/hooks/use-pickup-shipment'

const MultiShippingItemAttributes = ({variant, includeQuantity = true}) => {
    const {formatMessage} = useIntl()
    const variationAttributes = variant?.variationAttributes || []
    const variationValues = variant?.variationValues || {}
    return (
        <List
            spacing={1.5}
            flex={1}
            aria-label={formatMessage({
                id: 'shipping_multi_address.product_attributes.label',
                defaultMessage: 'Product attributes'
            })}
        >
            {variationAttributes &&
                variationAttributes.length > 0 &&
                variationAttributes.map((attr) => {
                    const value = attr.values?.find((v) => v.value === variationValues[attr.id])
                    return (
                        <ListItem key={attr.id}>
                            <Text lineHeight={1} color="gray.700" fontSize="sm">
                                {attr.name || attr.id}: {value?.name || value?.value || ''}
                            </Text>
                        </ListItem>
                    )
                })}
            {includeQuantity && (
                <ListItem>
                    <Text lineHeight={1} color="gray.700" fontSize="sm">
                        {formatMessage({
                            id: 'shipping_multi_address.quantity.label',
                            defaultMessage: 'Quantity'
                        })}
                        : {variant.quantity}
                    </Text>
                </ListItem>
            )}
        </List>
    )
}

MultiShippingItemAttributes.propTypes = {
    variant: PropTypes.object.isRequired,
    includeQuantity: PropTypes.bool
}

const AddressForm = ({item, form, onSubmit, onCancel}) => {
    const saveButtonLabel = defineMessage({
        defaultMessage: 'Save',
        id: 'shipping_address_form.button.save'
    })
    return (
        <Box position="relative" bg="white" padding={6} width="100%">
            {form.formState.isSubmitting && <LoadingSpinner />}
            <form
                data-testid="address-form"
                onSubmit={form.handleSubmit(async (data) => {
                    await onSubmit(data, form, item.itemId)
                })}
            >
                <Stack spacing={6} width="100%">
                    {form.formState.errors?.global && (
                        <Alert status="error">
                            <AlertIcon color="red.600" boxSize={4} />
                            <Text fontSize="sm" ml={3}>
                                {form.formState.errors.global.message}
                            </Text>
                        </Alert>
                    )}
                    <AddressFields form={form} />
                    <FormActionButtons onCancel={onCancel} saveButtonLabel={saveButtonLabel} />
                </Stack>
            </form>
        </Box>
    )
}

AddressForm.propTypes = {
    item: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
}

const ShippingMultiAddress = ({
    basket,
    submitButtonLabel,
    addNewAddressLabel,
    noItemsInBasketMessage,
    deliveryAddressLabel
}) => {
    const {formatMessage} = useIntl()
    const {currency} = useCurrency()
    const {STEPS, goToStep} = useCheckout()
    const showToast = useToast()
    const {isCurrentShippingMethodPickup} = usePickupShipment(basket)
    const {
        findDeliveryShipmentWithSameAddress,
        findUnusedDeliveryShipment,
        createNewDeliveryShipmentWithAddress,
        updateDeliveryAddressForShipment,
        moveItemsToDeliveryShipment,
        removeEmptyShipments
    } = useMultiship(basket)

    // Filter out pickup items - only show delivery items
    const deliveryItems =
        basket?.productItems?.filter((item) => {
            const shipment = basket?.shipments?.find((s) => s.shipmentId === item.shipmentId)
            return !isCurrentShippingMethodPickup(shipment?.shippingMethod)
        }) || []
    const productIds = deliveryItems.map((item) => item.productId).join(',')
    const {
        data: productsMap,
        isLoading: productsLoading,
        error: productsError
    } = useProducts(
        {parameters: {ids: productIds, allImages: true}},
        {
            enabled: Boolean(productIds),
            select: (data) => {
                return (
                    data?.data?.reduce((acc, p) => {
                        acc[p.id] = p
                        return acc
                    }, {}) || {}
                )
            }
        }
    )
    const {
        data: customer,
        refetch: refetchCustomer,
        isLoading: customerLoading
    } = useCurrentCustomer()

    const registeredUserAddresses = customer?.addresses || []
    const [guestAddresses, setGuestAddresses] = useState([])
    const [selectedGuestAddresses, setSelectedGuestAddresses] = useState({})

    // Initialize selected addresses with default addresses
    const [selectedRegisteredUserAddresses, setSelectedRegisteredUserAddresses] = useState({})

    useEffect(() => {
        if (customer && !customer.isGuest && basket?.productItems) {
            const initialSelected = {}

            // If there are existing shipments with addresses, try to match with customer addresses
            const existingShipments =
                basket.shipments?.filter((shipment) => shipment.shippingAddress) || []

            if (existingShipments.length > 0) {
                // Initialize based on existing shipments using item.shipmentId
                basket.productItems.forEach((item) => {
                    const addressKey = item.itemId
                    const shipment = existingShipments.find((s) => s.shipmentId === item.shipmentId)

                    if (shipment && shipment.shippingAddress) {
                        // Try to find a matching customer address
                        const matchingAddress = registeredUserAddresses.find(
                            (addr) =>
                                addr.firstName === shipment.shippingAddress.firstName &&
                                addr.lastName === shipment.shippingAddress.lastName &&
                                addr.address1 === shipment.shippingAddress.address1 &&
                                addr.city === shipment.shippingAddress.city
                        )

                        if (matchingAddress) {
                            initialSelected[addressKey] = matchingAddress.addressId
                        } else if (registeredUserAddresses.length > 0) {
                            // Fall back to first customer address if no match found
                            initialSelected[addressKey] = registeredUserAddresses[0].addressId
                        }
                    } else {
                        // Only set default for items that don't have a shipment assignment
                        if (registeredUserAddresses.length > 0) {
                            const defaultAddress =
                                registeredUserAddresses.find((addr) => addr.preferred) ||
                                registeredUserAddresses[0]
                            if (defaultAddress) {
                                initialSelected[addressKey] = defaultAddress.addressId
                            }
                        }
                    }
                })
            } else if (registeredUserAddresses.length > 0) {
                // Fall back to customer addresses if no existing shipments
                basket.productItems.forEach((item) => {
                    const addressKey = item.itemId
                    // Find preferred address or use first address as default
                    const defaultAddress =
                        registeredUserAddresses.find((addr) => addr.preferred) ||
                        registeredUserAddresses[0]
                    if (defaultAddress) {
                        initialSelected[addressKey] = defaultAddress.addressId
                    }
                })
            }

            // Only update selectedRegisteredUserAddresses if it's empty or if we have new items that aren't selected yet
            setSelectedRegisteredUserAddresses((prev) => {
                const newState = {...prev}
                let hasChanges = false

                basket.productItems.forEach((item) => {
                    const addressKey = item.itemId
                    if (!prev[addressKey] && initialSelected[addressKey]) {
                        newState[addressKey] = initialSelected[addressKey]
                        hasChanges = true
                    }
                })

                return hasChanges ? newState : prev
            })
        }
    }, [
        customer?.customerId,
        basket?.productItems?.length,
        registeredUserAddresses.length,
        basket?.shipments?.length
    ])

    useEffect(() => {
        if (customer && customer.isGuest && basket?.productItems) {
            const existingShipments =
                basket.shipments?.filter((shipment) => shipment.shippingAddress) || []

            if (existingShipments.length > 0) {
                basket.productItems.forEach((item) => {
                    const addressKey = item.itemId
                    const shipment = existingShipments.find((s) => s.shipmentId === item.shipmentId)

                    if (shipment && shipment.shippingAddress) {
                        const addressId = `guest_${shipment.shipmentId}`
                        const address = {
                            addressId,
                            firstName: shipment.shippingAddress.firstName,
                            lastName: shipment.shippingAddress.lastName,
                            address1: shipment.shippingAddress.address1,
                            city: shipment.shippingAddress.city,
                            stateCode: shipment.shippingAddress.stateCode,
                            postalCode: shipment.shippingAddress.postalCode,
                            countryCode: shipment.shippingAddress.countryCode,
                            phone: shipment.shippingAddress.phone,
                            isGuestAddress: true,
                            originalShipmentId: shipment.shipmentId
                        }

                        // add guest address if not present
                        setGuestAddresses((prev) => {
                            const exists = prev.find((addr) => addr.addressId === addressId)
                            return exists ? prev : [...prev, address]
                        })

                        // assign to product
                        setSelectedGuestAddresses((prev) => ({
                            ...prev,
                            [addressKey]: addressId
                        }))
                    }
                })
            }
        }
    }, [customer?.isGuest, basket?.productItems?.length, basket?.shipments?.length])

    const [showAddAddressForm, setShowAddAddressForm] = useState({})

    const addressForm = useForm({
        mode: 'onSubmit',
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            countryCode: 'US',
            address1: '',
            city: '',
            stateCode: '',
            postalCode: '',
            preferred: false
        }
    })

    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isAddressFormOpen =
        Object.keys(showAddAddressForm).filter((key) => showAddAddressForm[key])?.length > 0

    // guest addresses for guests & customer addresses for registered users
    const finalAddresses = customer && customer.isGuest ? guestAddresses : registeredUserAddresses

    // Unified loading state - for guests, only check products loading since they may n't have addresses
    const isLoading = (customer && customer.isGuest ? false : customerLoading) || productsLoading

    // Check if all product items have an address selected
    const allShipmentsHaveAddress = (basket.productItems ?? []).every((item) => {
        if (customer && customer.isGuest) {
            return selectedGuestAddresses[item.itemId]
        } else {
            return selectedRegisteredUserAddresses[item.itemId]
        }
    })

    if (!deliveryItems.length) {
        return (
            <Center
                p={8}
                textAlign="center"
                color="gray.500"
                role="status"
                aria-live="polite"
                aria-label={formatMessage(noItemsInBasketMessage)}
            >
                <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="medium">
                        {formatMessage(noItemsInBasketMessage)}
                    </Text>
                </VStack>
            </Center>
        )
    }

    if (productsError) {
        return (
            <Alert
                status="error"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                height="200px"
                aria-live="assertive"
            >
                <AlertIcon boxSize={5} mr={0} />
                <AlertTitle mr={2}>
                    {formatMessage({
                        id: 'shipping_multi_address.error.label',
                        defaultMessage: 'Error loading products'
                    })}
                </AlertTitle>
                <AlertDescription>
                    {formatMessage({
                        id: 'shipping_multi_address.error.message',
                        defaultMessage: 'Error loading products. Please try again.'
                    })}
                </AlertDescription>
            </Alert>
        )
    }

    // Show loading message when loading
    if (isLoading) {
        return (
            <Center p={8} textAlign="center" color="gray.500">
                <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="medium">
                        {formatMessage({
                            id: 'shipping_multi_address.loading.message',
                            defaultMessage: 'Loading...'
                        })}
                    </Text>
                </VStack>
            </Center>
        )
    }

    const handleCancelAddressForm = (addressKey) => {
        setShowAddAddressForm((prev) => ({
            ...prev,
            [addressKey]: false
        }))
        addressForm.clearErrors()
    }

    const handleCreateAddress = async (addressData, form, itemId) => {
        const addressKey = itemId

        if (customer && customer.isGuest) {
            // store address in component state
            try {
                const newAddress = {
                    ...addressData,
                    addressId: `guest_${nanoid()}`,
                    isGuestAddress: true
                }

                setGuestAddresses((prev) => {
                    const updatedAddresses = [...prev, newAddress]

                    // If this is the first address, apply it to all delivery items
                    if (prev.length === 0) {
                        const initialSelected = {}
                        deliveryItems.forEach((item) => {
                            const itemKey = item.itemId
                            initialSelected[itemKey] = newAddress.addressId
                        })
                        setSelectedGuestAddresses(initialSelected)
                    } else {
                        // For subsequent addresses, only assign to the current item
                        setSelectedGuestAddresses((prev) => ({
                            ...prev,
                            [addressKey]: newAddress.addressId
                        }))
                    }

                    return updatedAddresses
                })

                setShowAddAddressForm((prev) => ({...prev, [addressKey]: false}))
                form.reset()
                form.clearErrors()

                showToast({
                    title: formatMessage({
                        id: 'shipping_multi_address.success.address_saved',
                        defaultMessage: 'Address saved successfully'
                    }),
                    status: 'success'
                })
            } catch (error) {
                showToast({
                    title: formatMessage({
                        id: 'shipping_multi_address.error.save_failed',
                        defaultMessage: 'Failed to save address'
                    }),
                    status: 'error'
                })
            }
        } else {
            // For registered users, save to customer address book
            try {
                const newAddress = {
                    ...addressData,
                    addressId: nanoid()
                }

                const createdAddress = await createCustomerAddress.mutateAsync({
                    body: newAddress,
                    parameters: {customerId: customer.customerId}
                })

                setShowAddAddressForm((prev) => ({...prev, [addressKey]: false}))
                form.reset()
                form.clearErrors()

                await refetchCustomer()

                setSelectedGuestAddresses((prev) => ({
                    ...prev,
                    [addressKey]: createdAddress.addressId
                }))

                showToast({
                    title: formatMessage({
                        id: 'shipping_multi_address.success.address_saved',
                        defaultMessage: 'Address saved successfully'
                    }),
                    status: 'success'
                })
            } catch (error) {
                showToast({
                    title: formatMessage({
                        id: 'shipping_multi_address.error.save_failed',
                        defaultMessage: 'Failed to save address'
                    }),
                    status: 'error'
                })
            }
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Based on the shopper's selected addresses, create a map of unique addressIds and their associated items
            const addressToItemsMap = {}
            let basketAfterItemMoves = null

            deliveryItems.forEach((item) => {
                const selectedAddresses =
                    customer && customer.isGuest
                        ? selectedGuestAddresses
                        : selectedRegisteredUserAddresses

                // Defaults to the first address if no address is selected
                const addressId = selectedAddresses[item.itemId] || finalAddresses[0]?.addressId
                const address = finalAddresses.find((addr) => addr.addressId === addressId)

                // If there is an existing shipment with the same address, use it in the next step
                const shipmentIdWithSameAddress = findDeliveryShipmentWithSameAddress(
                    basket,
                    address
                )

                if (!addressToItemsMap[addressId]) {
                    addressToItemsMap[addressId] = {
                        address: address,
                        items: [],
                        shipmentId: shipmentIdWithSameAddress
                    }
                }
                addressToItemsMap[addressId].items.push(item)
            })

            // For each unique address, if there is no usable existing shipment, create a new one.
            for (const [addressId, data] of Object.entries(addressToItemsMap)) {
                const {address, items, shipmentId: existingShipmentId} = data

                let targetShipmentId = existingShipmentId
                if (!targetShipmentId) {
                    const targetShipment = findUnusedDeliveryShipment(
                        basket,
                        Object.values(addressToItemsMap).map((d) => d.shipmentId)
                    )
                    targetShipmentId = targetShipment?.shipmentId
                    if (targetShipmentId) {
                        await updateDeliveryAddressForShipment(targetShipmentId, address)
                    } else {
                        targetShipmentId = await createNewDeliveryShipmentWithAddress(
                            basket,
                            address
                        )
                    }
                }
                // Set the shipmentId for the unique address
                addressToItemsMap[addressId].shipmentId = targetShipmentId
                // Move items to the new shipment if needed.
                const itemsToMove = items.filter((item) => item.shipmentId !== targetShipmentId)
                if (itemsToMove.length > 0) {
                    basketAfterItemMoves = await moveItemsToDeliveryShipment(
                        itemsToMove,
                        targetShipmentId
                    )
                }
            }
            // Remove any empty shipments.
            await removeEmptyShipments(basketAfterItemMoves || basket)

            goToStep(STEPS.SHIPPING_OPTIONS)
        } catch (error) {
            showToast({
                title: formatMessage({
                    defaultMessage: 'Error setting up shipments. Please try again.',
                    id: 'shipping_multi_address.error.submit_failed'
                }),
                status: 'error'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Box>
            <VStack spacing={0}>
                <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    bg="white"
                    p={2}
                    w="100%"
                >
                    <VStack spacing={2} w="100%" h="100%">
                        {deliveryItems.map((item) => {
                            const productDetail = productsMap?.[item.productId] || {}
                            const variant = {...item, ...productDetail}
                            const image = findImageGroupBy(productDetail.imageGroups, {
                                viewType: 'small',
                                selectedVariationAttributes: variant.variationValues
                            })?.images?.[0]
                            const imageUrl = image?.disBaseLink || image?.link || ''
                            const addressKey = item.itemId

                            return (
                                <Box
                                    key={addressKey}
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    p={4}
                                    data-testid="multi-shipping-card"
                                    w="100%"
                                    flex="1"
                                >
                                    <Flex
                                        direction={{base: 'column', md: 'row'}}
                                        align="flex-start"
                                        w="100%"
                                        h="100%"
                                        gap={{base: 4, md: 6}}
                                    >
                                        <Flex direction="row" align="flex-start" flex={1} minW={0}>
                                            <HStack align="flex-start" spacing={3} w="100%">
                                                <Box
                                                    flexShrink={0}
                                                    borderRadius="md"
                                                    bg="gray.100"
                                                    overflow="hidden"
                                                    position="relative"
                                                    maxW={{base: '60px', md: '80px'}}
                                                    w="100%"
                                                    aspectRatio="1"
                                                >
                                                    <Image
                                                        src={imageUrl}
                                                        alt={formatMessage(
                                                            {
                                                                id: 'shipping_multi_address.image.alt',
                                                                defaultMessage:
                                                                    'Product image for {productName}'
                                                            },
                                                            {
                                                                productName: item.productName
                                                            }
                                                        )}
                                                        objectFit="cover"
                                                        w="100%"
                                                        h="100%"
                                                    />
                                                </Box>
                                                <ItemVariantProvider variant={variant}>
                                                    <VStack
                                                        justify="flex-start"
                                                        minW={0}
                                                        flex={1}
                                                        pt={0}
                                                        align="flex-start"
                                                    >
                                                        <Text
                                                            id={`product-title-${addressKey}`}
                                                            data-testid={`product-title-${addressKey}`}
                                                            fontWeight="medium"
                                                            fontSize={{base: 'sm', md: 'md'}}
                                                            mb={1}
                                                            color="gray.900"
                                                            textAlign="left"
                                                        >
                                                            {item.productName}
                                                        </Text>
                                                        <Box
                                                            id={`product-description-${addressKey}`}
                                                            data-testid={`product-description-${addressKey}`}
                                                        >
                                                            <MultiShippingItemAttributes
                                                                variant={variant}
                                                                includeQuantity
                                                            />
                                                        </Box>
                                                    </VStack>
                                                </ItemVariantProvider>
                                            </HStack>
                                        </Flex>

                                        <VStack
                                            align="flex-start"
                                            w="100%"
                                            flex={{base: 'none', md: '1'}}
                                            minW={{base: '100%', md: '280px'}}
                                            maxW={{base: '100%', md: '400px'}}
                                            pt={0}
                                            spacing={1}
                                            mt={{base: 4, md: 0}}
                                        >
                                            <Text
                                                id={`delivery-address-label-${addressKey}`}
                                                data-testid={`delivery-address-label-${addressKey}`}
                                                fontWeight="medium"
                                                fontSize="sm"
                                                mb={1}
                                            >
                                                {formatMessage(deliveryAddressLabel)}
                                            </Text>

                                            <Box w="100%" mb={6}>
                                                <VStack spacing={3} align="stretch">
                                                    {!customer?.isGuest && customerLoading ? (
                                                        <Box p={4} textAlign="center">
                                                            <Text color="gray.500">
                                                                {formatMessage({
                                                                    id: 'shipping_multi_address.loading_addresses',
                                                                    defaultMessage:
                                                                        'Loading addresses...'
                                                                })}
                                                            </Text>
                                                        </Box>
                                                    ) : (
                                                        <Select
                                                            value={
                                                                selectedGuestAddresses[
                                                                    addressKey
                                                                ] || ''
                                                            }
                                                            onChange={(e) => {
                                                                const value = e.target.value
                                                                // Hide the address form when an existing address is selected
                                                                setShowAddAddressForm((prev) => ({
                                                                    ...prev,
                                                                    [addressKey]: false
                                                                }))
                                                                setSelectedRegisteredUserAddresses(
                                                                    (prev) => {
                                                                        const newState = {...prev}
                                                                        if (value === '') {
                                                                            delete newState[
                                                                                addressKey
                                                                            ]
                                                                        } else {
                                                                            newState[addressKey] =
                                                                                value
                                                                        }
                                                                        return newState
                                                                    }
                                                                )
                                                            }}
                                                            disabled={
                                                                finalAddresses.length === 0 ||
                                                                (!customer?.isGuest &&
                                                                    customerLoading)
                                                            }
                                                            aria-labelledby={`delivery-address-label-${addressKey}`}
                                                            borderColor="gray.300"
                                                            _hover={{borderColor: 'gray.400'}}
                                                            _focus={{
                                                                borderColor: 'blue.500',
                                                                boxShadow:
                                                                    '0 0 0 1px var(--chakra-colors-blue-500)'
                                                            }}
                                                            data-testid={`address-dropdown-${addressKey}`}
                                                        >
                                                            {finalAddresses.length === 0 ? (
                                                                <option value="">
                                                                    {formatMessage({
                                                                        id: 'shipping_multi_address.no_addresses_available',
                                                                        defaultMessage:
                                                                            'No Address Available'
                                                                    })}
                                                                </option>
                                                            ) : (
                                                                finalAddresses.map((addr) => (
                                                                    <option
                                                                        key={addr.addressId}
                                                                        value={addr.addressId}
                                                                        data-testid={`address-option-${addr.addressId}`}
                                                                    >
                                                                        {addr.firstName}{' '}
                                                                        {addr.lastName} -{' '}
                                                                        {addr.address1},{' '}
                                                                        {formatMessage(
                                                                            {
                                                                                id: 'shipping_multi_address.format.address_line_2',
                                                                                defaultMessage:
                                                                                    '{city}, {stateCode} {postalCode}'
                                                                            },
                                                                            {
                                                                                city: addr.city,
                                                                                stateCode:
                                                                                    addr.stateCode ||
                                                                                    '',
                                                                                postalCode:
                                                                                    addr.postalCode
                                                                            }
                                                                        )}
                                                                    </option>
                                                                ))
                                                            )}
                                                        </Select>
                                                    )}
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [addressKey]: true
                                                            }))
                                                        }}
                                                        alignSelf="flex-start"
                                                        aria-label={formatMessage(
                                                            {
                                                                id: 'shipping_multi_address.add_new_address.aria_label',
                                                                defaultMessage:
                                                                    'Add new delivery address for {productName}'
                                                            },
                                                            {
                                                                productName: item.productName
                                                            }
                                                        )}
                                                    >
                                                        {formatMessage(addNewAddressLabel)}
                                                    </Button>
                                                </VStack>
                                            </Box>

                                            <Box
                                                fontWeight="semibold"
                                                fontSize="md"
                                                color="gray.900"
                                                alignSelf="flex-end"
                                                mt="auto"
                                            >
                                                <DisplayPrice
                                                    priceData={getPriceData(variant)}
                                                    currency={currency}
                                                    labelForA11y={variant.productName}
                                                />
                                            </Box>
                                        </VStack>
                                    </Flex>

                                    {/* Add New Address Form - appears inside the product card */}
                                    {showAddAddressForm[addressKey] && (
                                        <Box position="relative" mt={4} width="100%">
                                            <AddressForm
                                                item={item}
                                                form={addressForm}
                                                onSubmit={handleCreateAddress}
                                                onCancel={() => handleCancelAddressForm(addressKey)}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            )
                        })}
                    </VStack>
                </Box>
                <Button
                    type="button"
                    width="full"
                    mt={2}
                    opacity={!allShipmentsHaveAddress || isAddressFormOpen ? 0.8 : 1}
                    cursor={
                        !allShipmentsHaveAddress || isAddressFormOpen ? 'not-allowed' : 'pointer'
                    }
                    isLoading={addressForm.formState.isSubmitting || isSubmitting}
                    isDisabled={!allShipmentsHaveAddress || isAddressFormOpen}
                    data-testid="continue-to-shipping-button"
                    loadingText={formatMessage({
                        id: 'shipping_multi_address.submit.loading',
                        defaultMessage: 'Setting up shipments...'
                    })}
                    aria-label={formatMessage({
                        id: 'shipping_multi_address.submit.description',
                        defaultMessage: 'Continue to next step with selected delivery addresses'
                    })}
                    onClick={() => {
                        if (!isAddressFormOpen && allShipmentsHaveAddress) {
                            handleSubmit()
                        }
                    }}
                >
                    {formatMessage(submitButtonLabel)}
                </Button>
            </VStack>
        </Box>
    )
}

ShippingMultiAddress.propTypes = {
    basket: PropTypes.object.isRequired,
    submitButtonLabel: PropTypes.object.isRequired,
    addNewAddressLabel: PropTypes.object.isRequired,
    noItemsInBasketMessage: PropTypes.object.isRequired,
    deliveryAddressLabel: PropTypes.object.isRequired,
    guestAddresses: PropTypes.array,
    setGuestAddresses: PropTypes.func,
    selectedGuestAddresses: PropTypes.object,
    setSelectedGuestAddresses: PropTypes.func
}

export default ShippingMultiAddress
