/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {Box, Button, Container, Text, Stack, Divider, Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    ToggleCard,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import CheckoutProductItemList from '@salesforce/retail-react-app/app/components/product-item-list/checkout-product-item-list'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'

// Hooks
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useShopperBasketsMutation, useStores, useProducts} from '@salesforce/commerce-sdk-react'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'

const PickupAddress = () => {
    const {formatMessage} = useIntl()
    const [isLoading, setIsLoading] = useState()
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const {step, STEPS, goToStep} = useCheckout()
    const {data: basket} = useCurrentBasket()

    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city

    // Get product data for display
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: products, isLoading: isProductsLoading} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true,
                perPricebook: true
            }
        },
        {
            enabled: Boolean(productIds),
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    // Get all unique store IDs from pickup shipments
    const allStoreIds = useMemo(() => {
        if (!basket?.shipments) return ''
        
        return basket.shipments
            .filter(shipment => shipment?.shippingMethod?.c_storePickupEnabled === true)
            .map(shipment => shipment.c_fromStoreId)
            .filter(Boolean)
            .filter((id, index, array) => array.indexOf(id) === index) // Remove duplicates
            .join(',')
    }, [basket?.shipments])

    const {data: storeData} = useStores(
        {
            parameters: {
                ids: allStoreIds
            }
        },
        {
            enabled: !!allStoreIds && STORE_LOCATOR_IS_ENABLED
        }
    )

    // Create productsByItemId mapping
    const productsByItemId = useMemo(() => {
        const updateProductsByItemId = {}
        basket?.productItems?.forEach((productItem) => {
            const currentProduct = products?.[productItem?.productId]
            updateProductsByItemId[productItem.itemId] = currentProduct
        })
        return updateProductsByItemId
    }, [basket, products])

    // Get pickup shipment items grouped by store
    const pickupShipmentItems = useMemo(() => {
        if (!basket?.shipments || !basket?.productItems) return []

        const pickupShipments = []
        
        basket.shipments.forEach((shipment) => {
            const isPickupOrder = STORE_LOCATOR_IS_ENABLED
                ? shipment?.shippingMethod?.c_storePickupEnabled === true
                : false
            
            if (isPickupOrder) {
                const storeId = shipment?.c_fromStoreId
                const store = storeData?.data?.find((store) => store.id === storeId)

                // Filter products for this shipment
                const shipmentProducts =
                    basket.productItems?.filter(
                        (productItem) => productItem.shipmentId === shipment.shipmentId
                    ) || []

                // Categorize products into regular and bonus for this shipment
                const categorizedProducts = shipmentProducts.reduce(
                    (acc, productItem) => {
                        if (productItem.bonusProductLineItem) {
                            acc.bonusProducts.push(productItem)
                        } else {
                            acc.regularProducts.push(productItem)
                        }
                        return acc
                    },
                    {regularProducts: [], bonusProducts: []}
                )

                pickupShipments.push({
                    shipment,
                    store,
                    categorizedProducts,
                    itemsInShipment:
                        categorizedProducts.regularProducts.length +
                        categorizedProducts.bonusProducts.length
                })
            }
        })

        return pickupShipments
    }, [basket?.shipments, basket?.productItems, storeData])
    const store = storeData?.data?.[0]
    const pickupAddress = {
        address1: store?.address1,
        city: store?.city,
        countryCode: store?.countryCode,
        postalCode: store?.postalCode,
        stateCode: store?.stateCode,
        firstName: store?.name,
        lastName: 'Pickup',
        phone: store?.phone
    }

    const submitAndContinue = async (address) => {
        setIsLoading(true)
        const {address1, city, countryCode, firstName, lastName, phone, postalCode, stateCode} =
            address
        await updateShippingAddressForShipment.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                shipmentId: 'me',
                useAsBilling: false
            },
            body: {
                address1,
                city,
                countryCode,
                firstName,
                lastName,
                phone,
                postalCode,
                stateCode
            }
        })
        setIsLoading(false)
        goToStep(STEPS.PAYMENT)
    }

    return (
        <ToggleCard
            id="step-1"
            title={formatMessage({
                defaultMessage: 'Pickup Address & Information',
                id: 'pickup_address.title.pickup_address'
            })}
            editing={step === STEPS.PICKUP_ADDRESS}
            disabled={step === STEPS.CONTACT_INFO}
            isLoading={isLoading}
        >
            {step === STEPS.PICKUP_ADDRESS && (
                <>
                    {/* Display pickup stores and items */}
                    {pickupShipmentItems.length > 0 && (
                        <>
                            {/* Single pickup - use original behavior */}
                            {pickupShipmentItems.length === 1 && (
                                <>
                                    <Text fontWeight="bold" fontSize="md" mb={2}>
                                        <FormattedMessage
                                            defaultMessage="Store Information"
                                            id="pickup_address.title.store_information"
                                        />
                                    </Text>
                                    <AddressDisplay address={pickupAddress} />
                                </>
                            )}
                            
                            {/* Multiple pickups - use new grouped behavior */}
                            {pickupShipmentItems.length > 1 && (
                                <Stack spacing={6}>
                                    {pickupShipmentItems.map((shipmentInfo, index) => (
                                        <Box 
                                            key={shipmentInfo.shipment?.shipmentId}
                                            border="1px solid"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                            p={4}
                                            mb={4}
                                        >
                                            {/* Store Information */}
                                            <Box 
                                                border="1px solid"
                                                borderColor="gray.300"
                                                borderRadius="sm"
                                                p={3}
                                                mb={4}
                                            >
                                                <Text fontWeight="bold" fontSize="md" mb={2}>
                                                    <FormattedMessage
                                                        defaultMessage="Store Information"
                                                        id="pickup_address.title.store_information"
                                                    />
                                                </Text>
                                                {shipmentInfo.store && (
                                                    <Box>
                                                        <Text>
                                                            {shipmentInfo.store.name}
                                                        </Text>
                                                        <Text>
                                                            {shipmentInfo.store.address1}
                                                        </Text>
                                                        <Text>
                                                            {shipmentInfo.store.city}, {shipmentInfo.store.stateCode} {shipmentInfo.store.postalCode}
                                                        </Text>
                                                        <Text>
                                                            {shipmentInfo.store.countryCode}
                                                        </Text>
                                                    </Box>
                                                )}
                                            </Box>
                                            
                                            {/* Cart Items for this store */}
                                            <Box mt={4} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                                                {/* Regular Products */}
                                                {shipmentInfo.categorizedProducts.regularProducts.length > 0 && (
                                                    <CheckoutProductItemList
                                                        productItems={shipmentInfo.categorizedProducts.regularProducts}
                                                        productsByItemId={productsByItemId}
                                                        isProductsLoading={isProductsLoading}
                                                    />
                                                )}

                                                {/* Bonus Products */}
                                                {shipmentInfo.categorizedProducts.bonusProducts.length > 0 && (
                                                    <>
                                                        <Box mt={3} mb={2}>
                                                            <Text fontWeight="bold" fontSize="sm" color="gray.600">
                                                                <FormattedMessage
                                                                    defaultMessage="Bonus Items"
                                                                    id="pickup_address.bonus_products.title"
                                                                />
                                                            </Text>
                                                        </Box>
                                                        <CheckoutProductItemList
                                                            productItems={shipmentInfo.categorizedProducts.bonusProducts}
                                                            productsByItemId={productsByItemId}
                                                            isProductsLoading={isProductsLoading}
                                                        />
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </>
                    )}
                    
                    <Box pt={3}>
                        <Container variant="form">
                            <Button w="full" onClick={() => submitAndContinue(pickupAddress)}>
                                <FormattedMessage
                                    defaultMessage="Continue to Payment"
                                    id="pickup_address.button.continue_to_payment"
                                />
                            </Button>
                        </Container>
                    </Box>
                </>
            )}
            {isAddressFilled && (
                <ToggleCardSummary>
                    {/* Display pickup stores and items in summary */}
                    {pickupShipmentItems.length > 0 && (
                        <>
                            {/* Single pickup - use original behavior */}
                            {pickupShipmentItems.length === 1 && (
                                <>
                                    <Text fontWeight="bold" fontSize="md" mb={2}>
                                        <FormattedMessage
                                            defaultMessage="Store Information"
                                            id="pickup_address.title.store_information"
                                        />
                                    </Text>
                                    <AddressDisplay address={selectedShippingAddress} />
                                </>
                            )}
                            
                            {/* Multiple pickups - use new grouped behavior */}
                            {pickupShipmentItems.length > 1 && (
                                <Stack spacing={6}>
                                    {pickupShipmentItems.map((shipmentInfo, index) => (
                                        <Box 
                                            key={shipmentInfo.shipment?.shipmentId}
                                            border="1px solid"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                            p={4}
                                            mb={4}
                                        >
                                            {/* Store Information */}
                                            <Box 
                                                border="1px solid"
                                                borderColor="gray.300"
                                                borderRadius="sm"
                                                p={3}
                                                mb={4}
                                            >
                                                <Text fontWeight="bold" fontSize="md" mb={2}>
                                                    <FormattedMessage
                                                        defaultMessage="Store Information"
                                                        id="pickup_address.title.store_information"
                                                    />
                                                </Text>
                                                {shipmentInfo.store && (
                                                    <Box>
                                                        <Text>
                                                            {shipmentInfo.store.name}
                                                        </Text>
                                                        <Text>
                                                            {shipmentInfo.store.address1}
                                                        </Text>
                                                        <Text>
                                                            {shipmentInfo.store.city}, {shipmentInfo.store.stateCode} {shipmentInfo.store.postalCode}
                                                        </Text>
                                                        <Text>
                                                            {shipmentInfo.store.countryCode}
                                                        </Text>
                                                    </Box>
                                                )}
                                            </Box>
                                            
                                            {/* Cart Items for this store */}
                                            <Box mt={4} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                                                {/* Regular Products */}
                                                {shipmentInfo.categorizedProducts.regularProducts.length > 0 && (
                                                    <CheckoutProductItemList
                                                        productItems={shipmentInfo.categorizedProducts.regularProducts}
                                                        productsByItemId={productsByItemId}
                                                        isProductsLoading={isProductsLoading}
                                                    />
                                                )}

                                                {/* Bonus Products */}
                                                {shipmentInfo.categorizedProducts.bonusProducts.length > 0 && (
                                                    <>
                                                        <Box mt={3} mb={2}>
                                                            <Text fontWeight="bold" fontSize="sm" color="gray.600">
                                                                <FormattedMessage
                                                                    defaultMessage="Bonus Items"
                                                                    id="pickup_address.bonus_products.title"
                                                                />
                                                            </Text>
                                                        </Box>
                                                        <CheckoutProductItemList
                                                            productItems={shipmentInfo.categorizedProducts.bonusProducts}
                                                            productsByItemId={productsByItemId}
                                                            isProductsLoading={isProductsLoading}
                                                        />
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </>
                    )}
                </ToggleCardSummary>
            )}
        </ToggleCard>
    )
}

export default PickupAddress
