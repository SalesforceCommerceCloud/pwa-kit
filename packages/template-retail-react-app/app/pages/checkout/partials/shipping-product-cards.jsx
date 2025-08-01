/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useIntl} from 'react-intl'
import {
    Box,
    Text,
    VStack,
    HStack,
    Image,
    List,
    ListItem
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import PropTypes from 'prop-types'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {useProducts} from '@salesforce/commerce-sdk-react'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'

// Component to display product attributes (variants)
const ProductAttributes = ({variant, includeQuantity = true}) => {
    const {formatMessage} = useIntl()
    const variationAttributes = variant?.variationAttributes || []
    const variationValues = variant?.variationValues || {}

    return (
        <List
            spacing={1.5}
            flex={1}
            aria-label={formatMessage({
                id: 'shipping_options.product_attributes.label',
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
                            id: 'shipping_options.quantity.label',
                            defaultMessage: 'Quantity'
                        })}
                        : {variant.quantity}
                    </Text>
                </ListItem>
            )}
        </List>
    )
}

ProductAttributes.propTypes = {
    variant: PropTypes.object.isRequired,
    includeQuantity: PropTypes.bool
}

// Component to display a single product item
const ProductItem = ({item, currency, productsMap}) => {
    const {formatMessage} = useIntl()

    // Get product details and image using the exact same approach as shipping-multi-address
    const productDetail = productsMap?.[item.productId] || {}
    const variant = {...item, ...productDetail}
    const image = findImageGroupBy(productDetail.imageGroups, {
        viewType: 'small',
        selectedVariationAttributes: variant.variationValues
    })?.images?.[0]

    const imageSrc = image?.disBaseLink || image?.link || ''

    const priceData = getPriceData(variant)

    return (
        <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={3} bg="white" mb={2}>
            <HStack align="flex-start" spacing={3} w="100%">
                {/* Product Image */}
                <Box flexShrink={0}>
                    <Image
                        src={imageSrc}
                        alt={item.productName || 'Product'}
                        boxSize="60px"
                        objectFit="cover"
                        borderRadius="md"
                        fallback={
                            <Box
                                boxSize="60px"
                                bg="gray.100"
                                borderRadius="md"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text fontSize="xs" color="gray.500">
                                    {formatMessage({
                                        id: 'shipping_options.no_image',
                                        defaultMessage: 'No Image'
                                    })}
                                </Text>
                            </Box>
                        }
                    />
                </Box>

                {/* Product Details */}
                <VStack justify="flex-start" minW={0} flex={1} pt={0} align="flex-start">
                    <Text
                        fontWeight="medium"
                        fontSize="sm"
                        mb={1}
                        color="gray.900"
                        textAlign="left"
                    >
                        {item.productName}
                    </Text>
                    <Box>
                        <ItemVariantProvider variant={variant}>
                            <ProductAttributes variant={variant} />
                        </ItemVariantProvider>
                    </Box>
                </VStack>

                {/* Price */}
                <Box display="flex" justifyContent="flex-end" alignItems="flex-start">
                    <DisplayPrice
                        product={variant}
                        priceData={priceData}
                        currency={currency}
                        fontSize="sm"
                        fontWeight="bold"
                    />
                </Box>
            </HStack>
        </Box>
    )
}

ProductItem.propTypes = {
    item: PropTypes.shape({
        itemId: PropTypes.string.isRequired,
        productId: PropTypes.string.isRequired,
        productName: PropTypes.string.isRequired,
        image: PropTypes.string,
        imageUrl: PropTypes.string,
        primaryImage: PropTypes.string,
        images: PropTypes.array,
        quantity: PropTypes.number,
        variationValues: PropTypes.object,
        variations: PropTypes.object
    }).isRequired,
    currency: PropTypes.string.isRequired,
    productsMap: PropTypes.object
}

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
            {shipmentItems.map((item) => (
                <ProductItem
                    key={item.itemId}
                    item={item}
                    currency={currency}
                    productsMap={productsMap}
                />
            ))}
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
