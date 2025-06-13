/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
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

// Component to display individual bonus product with checkbox for selection
const BonusProductItem = ({product, isSelected, onToggle, isLoading}) => {
    const productName = product?.productName || product?.title || 'Unknown Product'
    const productId = product?.productId || product?.id

    // Fetch product data to get image information
    const {data: productData, isLoading: isProductLoading} = useProducts(
        {
            parameters: {
                ids: productId,
                allImages: true
            }
        },
        {
            enabled: !!productId
        }
    )

    // Extract image URL from imageGroups
    const getProductImage = () => {
        if (!productData?.data?.[0]?.imageGroups) return null

        const imageGroups = productData.data[0].imageGroups

        // Try to find image in order of preference: medium, small, large
        const preferredViewTypes = ['medium', 'small', 'large']

        for (const viewType of preferredViewTypes) {
            const imageGroup = imageGroups.find((group) => group.viewType === viewType)
            if (imageGroup?.images?.[0]?.link) {
                return imageGroup.images[0].link
            }
        }

        // Fallback to first available image
        for (const group of imageGroups) {
            if (group.images?.[0]?.link) {
                return group.images[0].link
            }
        }

        return null
    }

    const imageUrl = getProductImage()
    const showLoading = isLoading || isProductLoading

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
                {imageUrl ? (
                    <DynamicImage
                        src={imageUrl}
                        alt={productName}
                        borderRadius="md"
                        objectFit="cover"
                    />
                ) : (
                    <Box
                        bg="gray.200"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text fontSize="xs" color="gray.500" textAlign="center">
                            No Image
                        </Text>
                    </Box>
                )}
            </AspectRatio>
            <VStack spacing={2} align="center">
                <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    lineHeight="1.2"
                    textAlign="center"
                    noOfLines={2}
                >
                    {productName}
                </Text>
                <Checkbox isChecked={isSelected} onChange={() => onToggle(product)} cursor="pointer" />
            </VStack>
        </VStack>
    )
}

BonusProductItem.propTypes = {
    product: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    isLoading: PropTypes.bool
}

export const BonusProductModal = () => {
    const {isOpen, onClose, data} = useBonusProductModalContext()
    const [selectedProducts, setSelectedProducts] = useState(new Set())

    // Extract bonus items from the response structure
    const bonusDiscountLineItems = data?.newBonusItems || data?.allBonusItems || []
    const firstBonusItem = bonusDiscountLineItems[0] || {}
    const bonusProducts = firstBonusItem.bonusProducts || []
    const maxBonusItems = firstBonusItem.maxBonusItems || 1
    const promotionId = firstBonusItem.promotionId

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
        console.log('Selected products:', Array.from(selectedProducts))
        onClose()
    }

    const selectedCount = selectedProducts.size

    // Calculate dynamic columns and modal size based on number of products
    const productCount = bonusProducts.length
    const columns = Math.min(productCount, 3) // Max 3 columns, but fewer if less products
    const modalSize = productCount === 1 ? 'lg' : productCount === 2 ? '3xl' : '5xl'

    if (!isOpen) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} size={modalSize} scrollBehavior="inside">
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
                        <SimpleGrid columns={columns} spacing={8}>
                            {bonusProducts.map((product, index) => (
                                <BonusProductItem
                                    key={product.productId || index}
                                    product={product}
                                    isSelected={selectedProducts.has(product.id || product.productId)}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Box textAlign="center" py={8}>
                            <Text color="gray.500">No bonus products available</Text>
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
