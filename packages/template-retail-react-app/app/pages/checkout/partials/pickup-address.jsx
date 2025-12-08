/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {
    Box,
    Button,
    Container,
    Text,
    Stack,
    Divider,
    Flex
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    ToggleCard,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'

import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'

// Hooks
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {useStores, useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import PropTypes from 'prop-types'

const ProductList = ({products, productsByItemId, currency, title}) => {
    if (!products || products.length === 0) {
        return null
    }

    return (
        <Stack spacing={4}>
            {title && (
                <Box mt={3} mb={2}>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">
                        {title}
                    </Text>
                </Box>
            )}
            {products.map((productItem) => {
                const product = {
                    ...productItem,
                    ...(productsByItemId && productsByItemId[productItem.itemId])
                }
                return (
                    <ItemVariantProvider key={productItem.itemId} variant={product}>
                        <Box
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={3}
                            bg="white"
                        >
                            <Flex width="full" alignItems="flex-start">
                                <CartItemVariantImage width={['88px', '136px']} mr={4} />
                                <Stack spacing={1} marginTop="-3px" flex={1}>
                                    <CartItemVariantName />
                                    <CartItemVariantAttributes
                                        includeQuantity={false}
                                        hideAttributeLabels={true}
                                    />
                                    <Flex
                                        width="full"
                                        justifyContent="space-between"
                                        alignItems="flex-end"
                                    >
                                        <Text fontSize="sm" color="gray.700">
                                            <FormattedMessage
                                                defaultMessage="Qty: {quantity}"
                                                values={{quantity: productItem.quantity}}
                                                id="item_attributes.label.quantity_abbreviated"
                                            />
                                        </Text>
                                        <CartItemVariantPrice currency={currency} />
                                    </Flex>
                                </Stack>
                            </Flex>
                        </Box>
                    </ItemVariantProvider>
                )
            })}
        </Stack>
    )
}

const PickupAddress = () => {
    const {formatMessage} = useIntl()
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket, derivedData} = useCurrentBasket()
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    const {currency} = useCurrency()

    const hasPickupShipments = derivedData?.totalPickupShipments > 0
    const hasDeliveryShipments = derivedData?.totalDeliveryShipments > 0
    const allStoreIds = derivedData?.pickupStoreIds?.join(',') ?? ''

    // Get selected store inventory ID for product data
    const {selectedStore} = useSelectedStore()
    const selectedInventoryId = selectedStore?.inventoryId || null

    // Get product data for display
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: products} = useProducts(
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
            enabled: storeLocatorEnabled && !!allStoreIds
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
            const isPickupOrder = storeLocatorEnabled && isPickupShipment(shipment)

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

    const hasMultiplePickups = pickupShipmentItems.length > 1
    const shouldShowCartItems = hasMultiplePickups || hasDeliveryShipments

    if (!hasPickupShipments) {
        return null
    }

    const isPickupDataReady = pickupShipmentItems.length > 0 && !isStoreDataLoading

    return (
        <ToggleCard
            id="step-1"
            title={formatMessage({
                defaultMessage: 'Pickup Address & Information',
                id: 'pickup_address.title.pickup_address'
            })}
            editing={step === STEPS.PICKUP_ADDRESS}
            disabled={step === STEPS.CONTACT_INFO}
            onEdit={() => goToStep(STEPS.PICKUP_ADDRESS)}
            editLabel={formatMessage({
                defaultMessage: 'Show Products',
                id: 'pickup_address.button.show_products'
            })}
        >
            {step === STEPS.PICKUP_ADDRESS && (
                <>
                    {pickupShipmentItems.length > 0 && !isStoreDataLoading && (
                        <>
                            {/* Pickups/mixed basket */}
                            <Stack spacing={6}>
                                {pickupShipmentItems.map((shipmentInfo, index) => (
                                    <Box
                                        key={`pickup-${shipmentInfo.shipment?.shipmentId}-${
                                            shipmentInfo.store?.id || index
                                        }`}
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
                                                    showDistance={true}
                                                    showStoreHours={true}
                                                    showPhone={true}
                                                    showEmail={true}
                                                    nameStyle={{
                                                        fontSize: 'sm',
                                                        fontWeight: 'normal'
                                                    }}
                                                    textSize="sm"
                                                />
                                            </Box>
                                        )}

                                        {/* Regular Products */}
                                        <ProductList
                                            products={shipmentInfo.regularProducts}
                                            productsByItemId={productsByItemId}
                                            currency={currency}
                                        />

                                        {/* Bonus Products */}
                                        <ProductList
                                            products={shipmentInfo.bonusProducts}
                                            productsByItemId={productsByItemId}
                                            currency={currency}
                                            title={
                                                <FormattedMessage
                                                    defaultMessage="Bonus Items"
                                                    id="pickup_address.bonus_products.title"
                                                />
                                            }
                                        />
                                    </Box>
                                ))}
                            </Stack>
                        </>
                    )}

                    <Box pt={3}>
                        <Container variant="form">
                            <Button w="full" onClick={() => goToNextStep()}>
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
                    {pickupShipmentItems.length > 0 && pickupShipmentItems[0].store && (
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
                                    <StoreDisplay
                                        store={pickupShipmentItems[0].store}
                                        showDistance={true}
                                        showStoreHours={true}
                                        showPhone={true}
                                        showEmail={true}
                                        nameStyle={{
                                            fontSize: 'sm',
                                            fontWeight: 'normal'
                                        }}
                                        textSize="sm"
                                    />
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

ProductList.propTypes = {
    products: PropTypes.arrayOf(
        PropTypes.shape({
            itemId: PropTypes.string.isRequired,
            productId: PropTypes.string.isRequired,
            productName: PropTypes.string.isRequired,
            quantity: PropTypes.number.isRequired,
            priceAfterItemDiscount: PropTypes.number.isRequired,
            variationValues: PropTypes.object
        })
    ),
    productsByItemId: PropTypes.object,
    currency: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
}

export default PickupAddress
