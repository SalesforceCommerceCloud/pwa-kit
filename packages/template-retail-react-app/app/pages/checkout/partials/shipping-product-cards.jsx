/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box, VStack} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {useProducts} from '@salesforce/commerce-sdk-react'
// Import the existing ProductItem component
import ProductItem from '@salesforce/retail-react-app/app/components/product-item'

// Main ShippingProductCards component
const ShippingProductCards = ({shipment, basket}) => {
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
                    <ProductItem
                        key={item.itemId}
                        product={completeProduct}
                        // Use custom container styles to match the original shipping layout
                        containerStyles={{
                            border: '1px solid',
                            borderColor: 'gray.200',
                            borderRadius: 'md',
                            p: 3,
                            bg: 'white',
                            mb: 2
                        }}
                        // Disable quantity picker and actions for shipping context
                        onItemQuantityChange={() => {}}
                        showLoading={false}
                    />
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
