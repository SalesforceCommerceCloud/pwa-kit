/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useMemo} from 'react'
import {
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    ModalFooter,
    ModalHeader,
    ModalBody,
    Text,
    Box,
    VStack,
    AspectRatio,
    Skeleton,
    SimpleGrid,
    Button,
    Checkbox
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useProducts} from '@salesforce/commerce-sdk-react'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import PropTypes from 'prop-types'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {FormattedMessage} from 'react-intl'

// Component to display individual bonus product with checkbox for selection
const BonusProductItem = ({product, productData, isSelected, onToggle, isLoading}) => {
    const productName = product?.productName || product?.title

    // Get the appropriate image group from the passed product data
    const imageGroup = useMemo(
        () =>
            findImageGroupBy(productData?.imageGroups || [], {
                viewType: 'small'
            }),
        [productData]
    )

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
                    noOfLines={2}
                    width="full"
                >
                    {productName}
                </Text>
                <Box width="full" display="flex" justifyContent="center">
                    <Checkbox
                        isChecked={isSelected}
                        onChange={() => onToggle(product)}
                        cursor="pointer"
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

export const BonusProductModal = () => {
    const {isOpen, onClose, data} = useBonusProductModalContext()
    const [selectedProducts, setSelectedProducts] = useState(new Set())

    // Extract bonus items from the response structure
    const bonusDiscountLineItems = data?.newBonusItems || data?.allBonusItems || []
    const currentPromotion = bonusDiscountLineItems[0] || {}
    const bonusProducts = currentPromotion.bonusProducts || []
    const maxBonusItems = currentPromotion.maxBonusItems || 1

    // Get all product IDs for batch fetching
    const productIds = useMemo(() => {
        return bonusProducts.map((product) => product.productId || product.id).filter(Boolean)
    }, [bonusProducts])

    // Fetch all products data at once
    const {data: productsData, isLoading: isProductsLoading} = useProducts(
        {
            parameters: {
                ids: productIds.join(','),
                allImages: true
            }
        },
        {
            enabled: productIds.length > 0
        }
    )

    // Create a map of product data by ID for easy lookup
    const productsDataMap = useMemo(() => {
        if (!productsData?.data) return {}

        return productsData.data.reduce((acc, product) => {
            acc[product.id] = product
            return acc
        }, {})
    }, [productsData])

    // Reset selections when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedProducts(new Set())
        }
    }, [isOpen])

    const handleToggle = (product) => {
        const productIdentifier = product.id || product.productId
        const isSelected = selectedProducts.has(productIdentifier)
        if (isSelected) {
            setSelectedProducts((prev) => {
                const newSet = new Set(prev)
                newSet.delete(productIdentifier)
                return newSet
            })
        } else if (selectedProducts.size < maxBonusItems) {
            setSelectedProducts((prev) => {
                const newSet = new Set(prev)
                newSet.add(productIdentifier)
                return newSet
            })
        }
    }

    const handleNext = () => {
        onClose()
    }

    const selectedCount = selectedProducts.size

    // Calculate columns based on number of products
    const productCount = bonusProducts.length
    const columns = Math.min(productCount, 3) // Max 3 columns, but fewer if less products

    if (!isOpen) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Text fontSize="lg" fontWeight="bold">
                        Add Bonus Product ({selectedCount} of {maxBonusItems})
                    </Text>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody bgColor="white" padding="6">
                    {bonusProducts.length > 0 ? (
                        <SimpleGrid columns={columns} spacing={8} justifyItems="start">
                            {bonusProducts.map((product) => {
                                const productId = product.productId || product.id
                                const productData = productsDataMap[productId]

                                return (
                                    <BonusProductItem
                                        key={productId}
                                        product={product}
                                        productData={productData}
                                        isSelected={selectedProducts.has(productId)}
                                        onToggle={handleToggle}
                                        isLoading={isProductsLoading}
                                    />
                                )
                            })}
                        </SimpleGrid>
                    ) : (
                        <Box textAlign="center" py={8}>
                            <Text color="gray.500">
                                <FormattedMessage
                                    defaultMessage="No bonus products available"
                                    id="bonus_product_modal.no_products_available"
                                />
                            </Text>
                        </Box>
                    )}
                </ModalBody>

                <ModalFooter justifyContent="center">
                    <Button colorScheme="blue" onClick={handleNext}>
                        Next
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
