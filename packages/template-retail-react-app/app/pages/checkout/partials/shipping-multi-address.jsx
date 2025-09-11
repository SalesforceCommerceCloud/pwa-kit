/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useMemo} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {
    Text,
    Button,
    Box,
    VStack,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Center
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useProductAddressAssignment} from '@salesforce/retail-react-app/app/hooks/use-product-address-assignment'
import {useAddressForm} from '@salesforce/retail-react-app/app/hooks/use-address-form'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import ProductShippingAddressCard from '@salesforce/retail-react-app/app/pages/checkout/partials/product-shipping-address-card.jsx'

const ShippingMultiAddress = ({
    basket,
    submitButtonLabel,
    noItemsInBasketMessage,
    onUnsavedGuestAddressesToggleWarning
}) => {
    const {formatMessage} = useIntl()
    const {STEPS, goToStep} = useCheckout()
    const showToast = useToast()
    const productAddressAssignment = useProductAddressAssignment(basket)
    const productIds = productAddressAssignment.deliveryItems
        .map((item) => item.productId)
        .join(',')

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
    const {data: customer, isLoading: customerLoading} = useCurrentCustomer()

    const {
        form: addressForm,
        formStateByItemId: showAddAddressForm,
        isSubmitting: isFormSubmitting,
        openForm,
        closeForm,
        handleCreateAddress,
        isAddressFormOpen
    } = useAddressForm(
        productAddressAssignment.addGuestAddress,
        customer?.isGuest,
        productAddressAssignment.setAddressesForItems,
        productAddressAssignment.availableAddresses,
        productAddressAssignment.deliveryItems
    )

    const {orchestrateShipmentOperations} = useMultiship(basket)

    const addresses = productAddressAssignment.availableAddresses
    const [isSubmitting, setIsSubmitting] = useState(false)

    // guests only products loading since they may not have addresses yet
    const isLoading = (customer?.isGuest ? false : customerLoading) || productsLoading

    const allShipmentsHaveAddress = productAddressAssignment.allItemsHaveAddresses

    const hasUnpersistedGuestAddresses = useMemo(() => {
        if (!customer?.isGuest || !addresses?.length) return false

        const persistedAddresses =
            basket?.shipments
                ?.filter((shipment) => !isPickupShipment(shipment))
                ?.map((shipment) => shipment.shippingAddress)
                ?.filter(Boolean) || []

        return addresses.length > persistedAddresses.length
    }, [customer?.isGuest, addresses, basket?.shipments])

    // inform parent of unpersisted local guest addresses
    useEffect(() => {
        onUnsavedGuestAddressesToggleWarning?.(hasUnpersistedGuestAddresses)
    }, [hasUnpersistedGuestAddresses, onUnsavedGuestAddressesToggleWarning])

    if (!productAddressAssignment.deliveryItems.length) {
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
            await orchestrateShipmentOperations(
                productAddressAssignment.deliveryItems,
                productAddressAssignment.selectedAddresses,
                addresses,
                productsMap
            )

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
                        {productAddressAssignment.deliveryItems.map((item) => {
                            const productDetail = productsMap?.[item.productId] || {}
                            const variant = {...item, ...productDetail}
                            const image = findImageGroupBy(productDetail.imageGroups, {
                                viewType: 'small',
                                selectedVariationAttributes: variant.variationValues
                            })?.images?.[0]
                            const imageUrl = image?.disBaseLink || image?.link || ''
                            const addressKey = item.itemId

                            return (
                                <ProductShippingAddressCard
                                    key={addressKey}
                                    item={item}
                                    variant={variant}
                                    imageUrl={imageUrl}
                                    addressKey={addressKey}
                                    selectedAddressId={
                                        productAddressAssignment.selectedAddresses[addressKey]
                                    }
                                    availableAddresses={addresses}
                                    isGuestUser={customer?.isGuest}
                                    customerLoading={customerLoading}
                                    onAddressSelect={productAddressAssignment.setAddressesForItems}
                                    onAddNewAddress={openForm}
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
                    isLoading={
                        addressForm.formState.isSubmitting || isFormSubmitting || isSubmitting
                    }
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
    noItemsInBasketMessage: PropTypes.object.isRequired,
    onUnsavedGuestAddressesToggleWarning: PropTypes.func
}

export default ShippingMultiAddress
