/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {
    Box,
    Button,
    Container,
    Text,
    Stack,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'
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
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {useShopperBasketsMutation, useStores, useProducts} from '@salesforce/commerce-sdk-react'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'

const PickupAddress = () => {
    const {formatMessage} = useIntl()
    const [isLoading, setIsLoading] = useState()
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()

    const shipmentData = useMemo(() => {
        if (!basket?.shipments) {
            return {
                hasPickupShipments: false,
                hasDeliveryShipments: false,
                pickupShipments: [],
                allStoreIds: '',
                pickupShipmentItems: []
            }
        }

        const pickupShipments = []
        const storeIds = new Set()
        let hasPickupShipments = false
        let hasDeliveryShipments = false

        basket.shipments.forEach((shipment) => {
            const isPickupOrder = STORE_LOCATOR_IS_ENABLED
                ? shipment?.shippingMethod?.c_storePickupEnabled === true
                : false

            if (isPickupOrder) {
                hasPickupShipments = true
                pickupShipments.push(shipment)
                if (shipment.c_fromStoreId) {
                    storeIds.add(shipment.c_fromStoreId)
                }
            } else {
                hasDeliveryShipments = true
            }
        })

        return {
            hasPickupShipments,
            hasDeliveryShipments,
            pickupShipments,
            allStoreIds: Array.from(storeIds).join(',')
        }
    }, [basket?.shipments])

    const {hasPickupShipments, hasDeliveryShipments, pickupShipments, allStoreIds} = shipmentData

    // Get selected store inventory ID for product data
    const {selectedStore} = useSelectedStore()
    const selectedInventoryId = selectedStore?.inventoryId || null

    // Get product data for display
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: products, isLoading: isProductsLoading} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true,
                perPricebook: true,
                ...(selectedInventoryId ? {inventoryIds: selectedInventoryId} : {})
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

    const {data: storeData, isLoading: isStoreDataLoading} = useStores(
        {
            parameters: {
                ids: allStoreIds
            }
        },
        {
            enabled: STORE_LOCATOR_IS_ENABLED && !!allStoreIds
        }
    )

    const productsByItemId = useMemo(() => {
        const updateProductsByItemId = {}
        basket?.productItems?.forEach((productItem) => {
            const currentProduct = products?.[productItem?.productId]
            updateProductsByItemId[productItem.itemId] = currentProduct
        })
        return updateProductsByItemId
    }, [basket, products])

    // pickup shipment items grouped by store
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
                    regularProducts: categorizedProducts.regularProducts,
                    bonusProducts: categorizedProducts.bonusProducts
                })
            }
        })

        return pickupShipments
    }, [basket?.shipments, basket?.productItems, storeData?.data])

    const hasMultiplePickups = pickupShipments.length > 1
    const shouldShowCartItems = hasMultiplePickups || hasDeliveryShipments

    if (!hasPickupShipments) {
        return null
    }

    const isPickupDataReady = pickupShipmentItems.length > 0 && !isStoreDataLoading

    // For single pickup, use the first store
    const singlePickupStore =
        pickupShipmentItems.length === 1 ? pickupShipmentItems[0]?.store : storeData?.data?.[0]

    const singlePickupAddress = {
        address1: singlePickupStore?.address1,
        city: singlePickupStore?.city,
        countryCode: singlePickupStore?.countryCode,
        postalCode: singlePickupStore?.postalCode,
        stateCode: singlePickupStore?.stateCode,
        firstName: singlePickupStore?.name,
        lastName: 'Pickup',
        phone: singlePickupStore?.phone
    }
    const submitAndContinue = async () => {
        setIsLoading(true)
        try {
            const updatePromises = pickupShipmentItems.map((shipmentInfo) => {
                const store = shipmentInfo.store
                const shipmentAddress = {
                    address1: store?.address1,
                    city: store?.city,
                    countryCode: store?.countryCode,
                    postalCode: store?.postalCode,
                    stateCode: store?.stateCode,
                    firstName: store?.name,
                    lastName: 'pickup',
                    phone: store?.phone
                }

                return updateShippingAddressForShipment.mutateAsync({
                    parameters: {
                        basketId: basket.basketId,
                        shipmentId: shipmentInfo.shipment.shipmentId,
                        useAsBilling: false
                    },
                    body: shipmentAddress
                })
            })
            await Promise.all(updatePromises)
            setIsLoading(false)
            goToNextStep()
        } catch (error) {
            setIsLoading(false)
            console.error(error)
        }
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
            onEdit={() => goToStep(STEPS.PICKUP_ADDRESS)}
        >
            {step === STEPS.PICKUP_ADDRESS && (
                <>
                    {(() => {
                        return (
                            pickupShipmentItems.length > 0 &&
                            !isStoreDataLoading && (
                                <>
                                    {/* Single pickup */}
                                    {pickupShipmentItems.length === 1 && !shouldShowCartItems && (
                                        <>
                                            <Text fontWeight="bold" fontSize="md" mb={2}>
                                                <FormattedMessage
                                                    defaultMessage="Store Information"
                                                    id="pickup_address.title.store_information"
                                                />
                                            </Text>
                                            {singlePickupStore && (
                                                <StoreDisplay
                                                    store={singlePickupStore}
                                                    showDistance={false}
                                                    showStoreHours={false}
                                                    showPhone={false}
                                                    showEmail={false}
                                                    nameStyle={{
                                                        fontSize: 'sm',
                                                        fontWeight: 'normal'
                                                    }}
                                                    textSize="sm"
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Multiple pickups/mixed basket */}
                                    {shouldShowCartItems && (
                                        <Stack spacing={6}>
                                            {pickupShipmentItems.map((shipmentInfo, index) => (
                                                <Box
                                                    key={`pickup-${
                                                        shipmentInfo.shipment?.shipmentId
                                                    }-${shipmentInfo.store?.id || index}`}
                                                    border="1px solid"
                                                    borderColor="gray.200"
                                                    borderRadius="md"
                                                    p={4}
                                                    mb={4}
                                                >
                                                    <Text fontWeight="bold" fontSize="md" mb={2}>
                                                        <FormattedMessage
                                                            defaultMessage="Store Information"
                                                            id="pickup_address.title.store_information"
                                                        />
                                                    </Text>
                                                    {shipmentInfo.store && (
                                                        <Box mb={4}>
                                                            <StoreDisplay
                                                                store={shipmentInfo.store}
                                                                showDistance={false}
                                                                showStoreHours={false}
                                                                showPhone={false}
                                                                showEmail={false}
                                                                nameStyle={{
                                                                    fontSize: 'sm',
                                                                    fontWeight: 'normal'
                                                                }}
                                                                textSize="sm"
                                                            />
                                                        </Box>
                                                    )}

                                                    {/* Regular Products */}
                                                    {shipmentInfo.regularProducts.length > 0 && (
                                                        <CheckoutProductItemList
                                                            productItems={
                                                                shipmentInfo.regularProducts
                                                            }
                                                            productsByItemId={productsByItemId}
                                                            isProductsLoading={isProductsLoading}
                                                        />
                                                    )}

                                                    {/* Bonus Products */}
                                                    {shipmentInfo.bonusProducts.length > 0 && (
                                                        <>
                                                            <Box mt={3} mb={2}>
                                                                <Text
                                                                    fontWeight="bold"
                                                                    fontSize="sm"
                                                                    color="gray.600"
                                                                >
                                                                    <FormattedMessage
                                                                        defaultMessage="Bonus Items"
                                                                        id="pickup_address.bonus_products.title"
                                                                    />
                                                                </Text>
                                                            </Box>
                                                            <CheckoutProductItemList
                                                                productItems={
                                                                    shipmentInfo.bonusProducts
                                                                }
                                                                productsByItemId={productsByItemId}
                                                                isProductsLoading={
                                                                    isProductsLoading
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </>
                            )
                        )
                    })()}

                    <Box pt={3}>
                        <Container variant="form">
                            <Button w="full" onClick={() => submitAndContinue()}>
                                {hasDeliveryShipments ? (
                                    <FormattedMessage
                                        defaultMessage="Continue to Shipping Address"
                                        id="pickup_address.button.continue_to_shipping_address"
                                    />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Continue to Payment"
                                        id="pickup_address.button.continue_to_payment"
                                    />
                                )}
                            </Button>
                        </Container>
                    </Box>
                </>
            )}
            {isPickupDataReady && (
                <ToggleCardSummary>
                    {/* pickup stores summary view */}
                    {pickupShipmentItems.length > 0 && !isStoreDataLoading && (
                        <>
                            {/* Single pickup */}
                            {pickupShipmentItems.length === 1 && !shouldShowCartItems && (
                                <>
                                    <Text fontWeight="bold" fontSize="md" mb={2}>
                                        <FormattedMessage
                                            defaultMessage="Store Information"
                                            id="pickup_address.title.store_information"
                                        />
                                    </Text>
                                    <AddressDisplay address={singlePickupAddress} />
                                </>
                            )}

                            {/* Multiple pickups/mixed basket */}
                            {shouldShowCartItems && (
                                <Stack spacing={4}>
                                    {pickupShipmentItems.map((shipmentInfo, index) => (
                                        <Box
                                            key={`pickup-summary-${
                                                shipmentInfo.shipment?.shipmentId
                                            }-${shipmentInfo.store?.id || index}`}
                                        >
                                            <Text fontWeight="bold" fontSize="md" mb={2}>
                                                <FormattedMessage
                                                    defaultMessage="Store Information"
                                                    id="pickup_address.title.store_information"
                                                />
                                            </Text>
                                            {shipmentInfo.store && (
                                                <StoreDisplay
                                                    store={shipmentInfo.store}
                                                    showDistance={false}
                                                    showStoreHours={false}
                                                    showPhone={false}
                                                    showEmail={false}
                                                    nameStyle={{
                                                        fontSize: 'sm',
                                                        fontWeight: 'normal'
                                                    }}
                                                    textSize="sm"
                                                />
                                            )}
                                            {index < pickupShipmentItems.length - 1 && (
                                                <Divider my={4} />
                                            )}
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
