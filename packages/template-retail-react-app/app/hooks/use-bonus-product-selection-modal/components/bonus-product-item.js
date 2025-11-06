/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Text,
    Box,
    VStack,
    AspectRatio,
    Skeleton,
    Button,
    IconButton,
    Badge,
    HStack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import {HeartIcon, HeartSolidIcon} from '@salesforce/retail-react-app/app/components/icons'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {filterImageGroups} from '@salesforce/retail-react-app/app/utils/product-utils'
import {PRODUCT_BADGE_DETAILS} from '@salesforce/retail-react-app/app/constants'

const IconButtonWithRegistration = withRegistration(IconButton)

const BonusProductItem = ({
    product,
    productData,
    foundProductData,
    onSelect,
    isLoading,
    enableFavourite = false,
    isFavourite = false,
    onFavouriteToggle,
    badgeDetails = PRODUCT_BADGE_DETAILS
}) => {
    const intl = useIntl()
    const productName = product?.productName || product?.title

    const imageGroup = useMemo(() => {
        // Check if this is productSearch data (has `image` property)
        if (productData?.image) {
            // Convert productSearch image format to imageGroup format
            return {
                images: [
                    {
                        link: productData.image.link,
                        disBaseLink: productData.image.disBaseLink,
                        alt: productData.image.alt || productName,
                        title: productData.image.title || productName
                    }
                ]
            }
        }

        // Otherwise, use imageGroups format (from products API)
        if (!productData?.imageGroups) {
            return null
        }

        // Use variant-specific variation values if available for image filtering
        const variationValues = productData.variationValues || {}
        const hasVariationValues = Object.keys(variationValues).length > 0

        if (hasVariationValues) {
            // Filter images based on the specific variant's variation values
            const variantImages = filterImageGroups(productData.imageGroups, {
                variationValues
            })

            if (variantImages?.length > 0) {
                const largeImage = findImageGroupBy(variantImages, {
                    viewType: 'large'
                })
                return largeImage || variantImages[0]
            }
        }

        // Fallback: try to find any large image, then small image
        const defaultLargeImage = findImageGroupBy(productData.imageGroups, {
            viewType: 'large'
        })
        if (defaultLargeImage) {
            return defaultLargeImage
        }

        const defaultSmallImage = findImageGroupBy(productData.imageGroups, {
            viewType: 'small'
        })
        return defaultSmallImage
    }, [productData, product])

    const filteredLabels = useMemo(() => {
        const labelsMap = new Map()
        if (productData) {
            badgeDetails.forEach((item) => {
                if (
                    item.propertyName &&
                    typeof productData[item.propertyName] === 'boolean' &&
                    productData[item.propertyName] === true
                ) {
                    labelsMap.set(intl.formatMessage(item.label), item.color)
                }
            })
        }
        return labelsMap
    }, [productData, badgeDetails, intl])

    if (isLoading) {
        return (
            <Box borderWidth="1px" borderRadius="lg" p="4">
                <VStack spacing="3" align="stretch">
                    <Skeleton height="200px" />
                    <Skeleton height="20px" />
                    <Skeleton height="16px" width="60%" />
                </VStack>
            </Box>
        )
    }

    return (
        <Box p="4" bg="white" position="relative">
            <VStack spacing="3" align="center" justify="flex-start">
                <Box position="relative" width="162px" maxWidth="162px">
                    <AspectRatio ratio={1}>
                        {imageGroup && imageGroup.images && imageGroup.images[0] ? (
                            <DynamicImage
                                src={imageGroup.images[0].disBaseLink || imageGroup.images[0].link}
                                widths={[162]}
                                imageProps={{
                                    alt: productName,
                                    loading: 'lazy'
                                }}
                            />
                        ) : (
                            <Box
                                bg="gray.100"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text color="gray.500" fontSize="sm">
                                    {intl.formatMessage({
                                        id: 'bonus_product_modal.no_image',
                                        defaultMessage: 'No Image'
                                    })}
                                </Text>
                            </Box>
                        )}
                    </AspectRatio>

                    {enableFavourite && (
                        <Box
                            position="absolute"
                            top="2"
                            right="2"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        >
                            <IconButtonWithRegistration
                                data-testid="bonus-product-wishlist-button"
                                aria-label={
                                    isFavourite
                                        ? intl.formatMessage(
                                              {
                                                  id: 'product_tile.assistive_msg.remove_from_wishlist',
                                                  defaultMessage: 'Remove {product} from wishlist'
                                              },
                                              {product: productName}
                                          )
                                        : intl.formatMessage(
                                              {
                                                  id: 'product_tile.assistive_msg.add_to_wishlist',
                                                  defaultMessage: 'Add {product} to wishlist'
                                              },
                                              {product: productName}
                                          )
                                }
                                icon={isFavourite ? <HeartSolidIcon /> : <HeartIcon />}
                                size="sm"
                                borderRadius="full"
                                colorScheme="whiteAlpha"
                                onClick={async () => {
                                    if (onFavouriteToggle) {
                                        await onFavouriteToggle(!isFavourite)
                                    }
                                }}
                            />
                        </Box>
                    )}

                    {filteredLabels.size > 0 && (
                        <HStack position="absolute" top="2" left="2" spacing="1">
                            {Array.from(filteredLabels.entries()).map(([label, colorScheme]) => (
                                <Badge
                                    key={label}
                                    data-testid="bonus-product-badge"
                                    colorScheme={colorScheme}
                                    fontSize="xs"
                                >
                                    {label}
                                </Badge>
                            ))}
                        </HStack>
                    )}
                </Box>
                <Box width="162px">
                    <Text fontSize="md" fontWeight="semibold" noOfLines={2} textAlign="left">
                        {productName}
                    </Text>
                </Box>
                <Box
                    width="162px"
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    gap="2"
                >
                    <Text fontSize="sm" color="gray.400" textDecoration="line-through">
                        {foundProductData?.price ? `$${foundProductData.price}` : ''}
                    </Text>
                    <Text fontSize="sm" fontWeight="normal">
                        Free
                    </Text>
                </Box>
                <Button
                    size="sm"
                    variant="outline"
                    width="162px"
                    onClick={() => {
                        onSelect(product, foundProductData)
                    }}
                >
                    {intl.formatMessage({
                        id: 'bonus_product_modal.button_select',
                        defaultMessage: 'Select'
                    })}
                </Button>
            </VStack>
        </Box>
    )
}

BonusProductItem.propTypes = {
    product: PropTypes.object.isRequired,
    productData: PropTypes.object,
    foundProductData: PropTypes.object,
    onSelect: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    enableFavourite: PropTypes.bool,
    isFavourite: PropTypes.bool,
    onFavouriteToggle: PropTypes.func,
    badgeDetails: PropTypes.array
}

export default BonusProductItem
