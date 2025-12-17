/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo} from 'react'
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
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import {useProductAddressAssignment} from '@salesforce/retail-react-app/app/hooks/use-product-address-assignment'
import {useAddressForm} from '@salesforce/retail-react-app/app/hooks/use-address-form'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import ProductShippingAddressCard from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-product-shipping-address-card.jsx'

const OneClickShippingMultiAddress = ({
    basket,
    submitButtonLabel,
    onUnsavedGuestAddressesToggleWarning
}) => {
    const {formatMessage} = useIntl()
    const {STEPS, goToStep} = useCheckout()
    const showToast = useToast()
    const productAddressAssignment = useProductAddressAssignment(basket)

    const productIds = productAddressAssignment.deliveryItems
        .map((item) => item.productId)
        .join(',')

    const {data: productsMap, isLoading: productsLoading} = useProducts(
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

    const isLoading = (customer?.isGuest ? false : customerLoading) || productsLoading
    const allShipmentsHaveAddress = productAddressAssignment.allItemsHaveAddresses

    const hasUnpersistedGuestAddresses = useMemo(() => {
        if (!customer?.isGuest) return false
        return isAddressFormOpen
    }, [customer?.isGuest, isAddressFormOpen])

    const hasDeliveryItems = productAddressAssignment.deliveryItems.length > 0
    const hasPickupItems = basket?.shipments?.some((s) => isPickupShipment(s))

    if (!hasDeliveryItems) {
        return (
            <Center py={8} px={4}>
                <Text>
                    {formatMessage({
                        defaultMessage: 'There are no items to deliver. All items are pickup.',
                        id: 'shipping_multi_address.message.no_delivery_items'
                    })}
                </Text>
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
        } catch (_e) {
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
            {hasPickupItems && (
                <Alert status="info" mb={4}>
                    <AlertIcon />
                    <AlertTitle>
                        {formatMessage({
                            defaultMessage: 'Note',
                            id: 'shipping_multi_address.label.note'
                        })}
                    </AlertTitle>
                    <AlertDescription>
                        {formatMessage({
                            defaultMessage:
                                'Some items are set for pickup and are not shown here. Only delivery items can be assigned to addresses.',
                            id: 'shipping_multi_address.message.pickup_items'
                        })}
                    </AlertDescription>
                </Alert>
            )}

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

                {hasUnpersistedGuestAddresses && onUnsavedGuestAddressesToggleWarning && (
                    <Alert status="warning" mt={4}>
                        <AlertIcon />
                        <AlertDescription>{onUnsavedGuestAddressesToggleWarning}</AlertDescription>
                    </Alert>
                )}

                <Box pt={4} w="100%">
                    <Button
                        w="full"
                        onClick={handleSubmit}
                        isLoading={isSubmitting || isFormSubmitting || isLoading}
                        isDisabled={!allShipmentsHaveAddress || isLoading}
                    >
                        {submitButtonLabel ||
                            formatMessage({
                                defaultMessage: 'Continue to Shipping Method',
                                id: 'shipping_address.button.continue_to_shipping'
                            })}
                    </Button>
                </Box>
            </VStack>
        </Box>
    )
}

OneClickShippingMultiAddress.propTypes = {
    basket: PropTypes.object.isRequired,
    submitButtonLabel: PropTypes.object,
    onUnsavedGuestAddressesToggleWarning: PropTypes.node
}

export default OneClickShippingMultiAddress
