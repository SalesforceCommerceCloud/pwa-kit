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
import {isAddressEmpty} from '@salesforce/retail-react-app/app/utils/address-utils'

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
import {useAddressManagement} from '@salesforce/retail-react-app/app/hooks/use-address-management'
import {useAddressForm} from '@salesforce/retail-react-app/app/hooks/use-address-form'
import AddressSelectionCard from '@salesforce/retail-react-app/app/components/address-selection-card'

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
        removeEmptyShipments,
        areAddressesEqual
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

    // Use the address management hook
    const {
        availableAddresses,
        selectedAddresses,
        setAddressesForItems,
        addGuestAddress,
        isGuest: isGuestUser
    } = useAddressManagement(basket, deliveryItems)

    // Use the address form hook
    const {
        form: addressForm,
        showForm: showAddAddressForm,
        isSubmitting: isFormSubmitting,
        openForm,
        closeForm,
        handleCreateAddress,
        isAddressFormOpen,
        formErrors
    } = useAddressForm(addGuestAddress, isGuestUser, setAddressesForItems, availableAddresses, deliveryItems)

    // Local state for overall form submission
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Address management logic is now handled by useAddressManagement hook






    // guest addresses for guests & customer addresses for registered users
    const finalAddresses = availableAddresses

    // Unified loading state - for guests, only check products loading since they may n't have addresses
    const isLoading = (isGuestUser ? false : customerLoading) || productsLoading

    // Check if all product items have an address selected
    const allShipmentsHaveAddress = (deliveryItems ?? []).every((item) => 
        selectedAddresses[item.itemId]
    )

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
                        defaultMessage: 'Something went wrong while loading products.'
                    })}
                </AlertTitle>
                <AlertDescription>
                    {formatMessage({
                        id: 'shipping_multi_address.error.message',
                        defaultMessage: 'Something went wrong while loading products. Try again.'
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








    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Based on the shopper's selected addresses, create a map of unique addressIds and their associated items
            const addressToItemsMap = {}
            let basketAfterItemMoves = null

            deliveryItems.forEach((item) => {
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
                    defaultMessage: 'Something went wrong while setting up shipments. Try again.',
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
                                <AddressSelectionCard
                                    key={addressKey}
                                    item={item}
                                    variant={variant}
                                    productDetail={productDetail}
                                    imageUrl={imageUrl}
                                    addressKey={addressKey}
                                    selectedAddressId={selectedAddresses[addressKey]}
                                    availableAddresses={finalAddresses}
                                    isGuestUser={isGuestUser}
                                    customerLoading={customerLoading}
                                    onAddressSelect={setAddressesForItems}
                                    onAddNewAddress={openForm}
                                    getPriceData={getPriceData}
                                    currency={currency}
                                    deliveryAddressLabel={deliveryAddressLabel}
                                    addNewAddressLabel={addNewAddressLabel}
                                    showAddAddressForm={showAddAddressForm}
                                    addressForm={addressForm}
                                    handleCreateAddress={handleCreateAddress}
                                    closeForm={closeForm}
                                />
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
                    isLoading={addressForm.formState.isSubmitting || isFormSubmitting}
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
    deliveryAddressLabel: PropTypes.object.isRequired
}

export default ShippingMultiAddress
