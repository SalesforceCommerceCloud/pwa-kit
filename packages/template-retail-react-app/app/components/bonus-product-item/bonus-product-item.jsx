/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {
    VStack,
    AspectRatio,
    Skeleton,
    Text,
    Box,
    Checkbox
} from '@salesforce/retail-react-app/app/components/shared/ui'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {filterImageGroups} from '@salesforce/retail-react-app/app/utils/product-utils'

const BonusProductItem = ({product, productData, isSelected, onToggle, isLoading}) => {
    const productName = product?.productName || product?.title

    // Get the appropriate image group from the passed product data
    const imageGroup = useMemo(() => {
        if (!productData?.imageGroups) return null

        // If the product has variationValues, use filterImageGroups to get variant-specific images
        if (productData.variationValues && Object.keys(productData.variationValues).length > 0) {
            const filteredGroups = filterImageGroups(productData.imageGroups, {
                viewType: 'small',
                variationValues: productData.variationValues
            })
            return filteredGroups?.[0] || null
        }

        // Fallback to the original logic for non-variant products
        return findImageGroupBy(productData.imageGroups, {
            viewType: 'small'
        })
    }, [productData])

    const image = imageGroup?.images?.[0]
    const showLoading = isLoading

    if (showLoading) {
        return (
            <VStack spacing={3} p={4} bg="gray.50">
                <AspectRatio ratio={1} width="150px" minWidth="150px">
                    <Skeleton data-testid="skeleton" />
                </AspectRatio>
                <VStack spacing={2} align="center">
                    <Skeleton height="16px" width="100px" data-testid="skeleton" />
                    <Skeleton height="20px" width="20px" data-testid="skeleton" />
                </VStack>
            </VStack>
        )
    }

    return (
        <VStack spacing={3} p={4} bg="white">
            <AspectRatio
                ratio={1}
                width="150px"
                minWidth="150px"
                cursor="pointer"
                onClick={() => onToggle(product)}
            >
                {image && (
                    <DynamicImage
                        src={`${image.disBaseLink || image.link}[?sw={width}&q=60]`}
                        widths={{
                            base: '150px'
                        }}
                        imageProps={{
                            alt: productName,
                            borderRadius: 'md',
                            objectFit: 'cover'
                        }}
                    />
                )}
            </AspectRatio>
            <VStack spacing={2} align="center" width="full">
                <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    lineHeight="1.2"
                    textAlign="center"
                    noOfLines={{base: 2, md: 2}}
                    width={{base: '150px', md: 'full'}}
                >
                    {productName}
                </Text>
                <Box width="full" display="flex" justifyContent="center">
                    <Checkbox
                        isChecked={isSelected}
                        onChange={() => onToggle(product)}
                        cursor="pointer"
                        aria-label={`Select bonus product: ${productName}`}
                    />
                </Box>
            </VStack>
        </VStack>
    )
}

BonusProductItem.propTypes = {
    product: PropTypes.object.isRequired,
    productData: PropTypes.object,
    isSelected: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    isLoading: PropTypes.bool
}

export default BonusProductItem
