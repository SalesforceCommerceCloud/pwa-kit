/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box, VStack, Flex, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {FormattedMessage} from 'react-intl'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'

// Main ShippingProductCards component
const ShippingProductCards = ({shipment, basket}) => {
    const {currency} = useCurrency()

    // Get all items for this shipment
    const shipmentItems =
        basket?.productItems?.filter((item) => item.shipmentId === shipment.shipmentId) || []

    // Fetch product details using the exact same approach as shipping-multi-address
    const productIds = shipmentItems
        .map((item) => item.productId)
        .filter(Boolean)
        .join(',')
    const {data: productsMap, isLoading: isProductLoading} = useProducts(
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

    if (isProductLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                <LoadingSpinner />
            </Box>
        )
    }

    return (
        <VStack spacing={4} align="stretch">
            {shipmentItems.map((item) => {
                // Merge item data with product details to create a complete product object
                const productDetail = productsMap?.[item.productId] || {}
                const completeProduct = {...item, ...productDetail}

                return (
                    <ItemVariantProvider key={item.itemId} variant={completeProduct}>
                        <Box
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={3}
                            bg="white"
                            mb={2}
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
                                                values={{quantity: item.quantity}}
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
        </VStack>
    )
}

ShippingProductCards.propTypes = {
    shipment: PropTypes.shape({
        shipmentId: PropTypes.string.isRequired
    }).isRequired,
    basket: PropTypes.shape({
        productItems: PropTypes.arrayOf(
            PropTypes.shape({
                itemId: PropTypes.string.isRequired,
                shipmentId: PropTypes.string,
                productName: PropTypes.string,
                image: PropTypes.string,
                imageUrl: PropTypes.string,
                primaryImage: PropTypes.string,
                images: PropTypes.array,
                quantity: PropTypes.number,
                variationValues: PropTypes.object,
                variations: PropTypes.object
            })
        )
    }).isRequired
}

export default ShippingProductCards
