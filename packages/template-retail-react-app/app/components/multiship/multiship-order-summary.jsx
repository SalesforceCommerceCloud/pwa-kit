/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import {defineMessages, FormattedMessage} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Stack,
    Text,
    Flex,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {groupShipmentsByDeliveryOption} from '@salesforce/retail-react-app/app/utils/shipment-utils'

const MultiShipOrderSummary = ({order, productItemsMap, currency}) => {
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    // Group shipments by type (pickup vs delivery)
    const {pickupShipments, deliveryShipments} = useMemo(() => {
        return storeLocatorEnabled
            ? groupShipmentsByDeliveryOption(order)
            : {pickupShipments: [], deliveryShipments: order?.shipments || []}
    }, [order?.shipments, storeLocatorEnabled])

    const messages = defineMessages({
        pickupItems: {
            id: 'order_summary.label.pickup_items',
            defaultMessage: 'Pickup Items'
        },
        deliveryItems: {
            id: 'order_summary.label.delivery_items',
            defaultMessage: 'Delivery Items'
        }
    })

    // Group product items by shipment
    const getItemsForShipment = (shipmentId) => {
        return order.productItems.filter((item) => item.shipmentId === shipmentId)
    }

    const renderItemGroup = (shipments, title) => {
        if (shipments.length === 0) return null

        return (
            <Box key={title.id}>
                <Text fontSize="sm" fontWeight="semibold" mb={3}>
                    <FormattedMessage {...title} />
                </Text>
                <Stack spacing={4}>
                    {shipments.map((shipment) => {
                        const items = getItemsForShipment(shipment.shipmentId)

                        return (
                            <Box key={shipment.shipmentId}>
                                <Stack
                                    spacing={3}
                                    align="flex-start"
                                    width="full"
                                    divider={<Divider />}
                                >
                                    {items.map((product, idx) => {
                                        const productDetail =
                                            productItemsMap?.[product.productId] || {}
                                        const variant = {
                                            ...product,
                                            ...productDetail,
                                            price: product.price
                                        }

                                        return (
                                            <ItemVariantProvider
                                                key={product.productId}
                                                index={idx}
                                                variant={variant}
                                            >
                                                <Flex width="full" alignItems="flex-start">
                                                    <CartItemVariantImage width="80px" mr={2} />
                                                    <Stack spacing={1} marginTop="-3px" flex={1}>
                                                        <CartItemVariantName />
                                                        <Flex
                                                            width="full"
                                                            justifyContent="space-between"
                                                            alignItems="flex-end"
                                                        >
                                                            <CartItemVariantAttributes
                                                                includeQuantity
                                                            />
                                                            <CartItemVariantPrice
                                                                currency={currency}
                                                            />
                                                        </Flex>
                                                    </Stack>
                                                </Flex>
                                            </ItemVariantProvider>
                                        )
                                    })}
                                </Stack>
                            </Box>
                        )
                    })}
                </Stack>
            </Box>
        )
    }

    return (
        <Stack spacing={6} width="full">
            {renderItemGroup(pickupShipments, messages.pickupItems)}
            {renderItemGroup(deliveryShipments, messages.deliveryItems)}
        </Stack>
    )
}

MultiShipOrderSummary.propTypes = {
    order: PropTypes.object.isRequired,
    productItemsMap: PropTypes.object.isRequired,
    currency: PropTypes.string.isRequired
}

export default MultiShipOrderSummary
