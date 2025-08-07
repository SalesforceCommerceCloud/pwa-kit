'use client'

/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {AspectRatio, Box, Text, Stack} from '@chakra-ui/react'
import {Link} from 'react-router'
import {formatCurrency} from '@/app/utils/currency'

interface ProductTileProps {
    product: ShopperSearchTypes.ProductSearchHit
    dynamicImageProps?: {
        widths?: string[]
        imageProps?: Record<string, any>
    }
    [key: string]: any
}

/**
 * The ProductTile is a simple visual representation of a
 * product object. It will show its default image, name and price.
 */
const ProductTile = (props: ProductTileProps) => {
    const {product, dynamicImageProps, ...rest} = props
    const {productId, productName, price, image} = product

    // Primary image for the tile
    const productImage = useMemo(() => {
        return image?.disBaseLink || image?.link
    }, [image])

    // Product URL
    const productUrl = `/product/${productId}`

    return (
        <Box position="relative" {...rest}>
            <Link to={productUrl}>
                <Stack gap={3}>
                    {/* Product Image */}
                    <Box position="relative">
                        <AspectRatio ratio={1}>
                            <img
                                src={`${productImage}?sw=300&q=60`}
                                alt={productName}
                                loading="lazy"
                                style={{
                                    objectFit: 'cover',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '8px'
                                }}
                            />
                        </AspectRatio>
                    </Box>

                    {/* Product Info */}
                    <Stack gap={1}>
                        {/* Product Name */}
                        <Text
                            fontSize="sm"
                            fontWeight="medium"
                            lineHeight="short"
                            noOfLines={2}
                            color="gray.900"
                        >
                            {productName}
                        </Text>

                        {/* Price */}
                        <Text fontSize="sm" fontWeight="bold" color="gray.900">
                            {formatCurrency(price ?? 0)}
                        </Text>
                    </Stack>
                </Stack>
            </Link>
        </Box>
    )
}

ProductTile.displayName = 'ProductTile'

export default ProductTile
