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
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {useHistory} from 'react-router-dom'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal'
import PropTypes from 'prop-types'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {FormattedMessage} from 'react-intl'
import {filterImageGroups} from '@salesforce/retail-react-app/app/utils/product-utils'

// Component to display individual bonus product with checkbox for selection
const BonusProductItem = ({product, productData, onClick, isLoading}) => {
    const productName = product?.productName || product?.title

    // Get the appropriate image group from the passed product data
    // Use filterImageGroups to get variant-specific images when available
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
            <AspectRatio ratio={1} width="150px" minWidth="150px" cursor="pointer">
                {image && (
                    <DynamicImage
                        src={`${image.disBaseLink || image.link}[?sw={width}&q=60]`}
                        widths={{
                            base: '150px'
                        }}
                        imageProps={{
                            alt: productName,
                            borderRadius: 'md',
                            objectFit: 'cover',
                            style: {pointerEvents: 'all'}
                        }}
                        onClick={onClick}
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
            </VStack>
        </VStack>
    )
}

BonusProductItem.propTypes = {
    product: PropTypes.object.isRequired,
    productData: PropTypes.object,
    onClick: PropTypes.func.isRequired,
    isLoading: PropTypes.bool
}

export const BonusProductModal = () => {
    const history = useHistory()
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
    const {isOpen, onClose, onClickClose, data} = useBonusProductModalContext()
    const {
        isOpen: isProductViewOpen,
        onOpen: onProductViewOpen,
        onClose: onProductViewClose
    } = useDisclosure()
    const [selectedProducts, setSelectedProducts] = useState(new Set())
    const [selectedProduct, setSelectedProduct] = useState()

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
            setSelectedProduct(null)
        }
    }, [isOpen])

    const handleClickBonusProduct = (product) => {
        setSelectedProduct(product.productId || product.id)
        onProductViewOpen()
    }

    const handleAddToCart = async (productSelectionValues) => {
        try {
            const productItems = productSelectionValues.map(({variant, quantity}) => ({
                productId: variant.productId,
                bonusDiscountLineItemId: currentPromotion.id,
                quantity
            }))

            const response = await addItemToNewOrExistingBasket(productItems)

            einstein.sendAddToCart(productItems)

        } catch (error) {
            console.log('error', error)
            showError(error)
        } finally {
            onClickClose()
            history.push('/cart')
        }
    }

    const onProductViewHide = () => {
        setSelectedProduct(null)
        onProductViewClose()
    }

    const selectedCount = selectedProducts.size

    // Calculate columns based on number of products
    const productCount = bonusProducts.length
    const columns = Math.min(productCount, 3) // Max 3 columns, but fewer if less products
    const product = useMemo(() => {
        const bonusProduct = bonusProducts.find((product) => product.productId === selectedProduct)
        if (!bonusProduct) return null
        
        // Get the full product data from the fetched products
        const fullProductData = productsDataMap[bonusProduct.productId || bonusProduct.id]
        
        // Merge bonus product data with full product data
        return fullProductData ? {
            ...fullProductData,
            ...bonusProduct
        } : null
    }, [bonusProducts, selectedProduct, productsDataMap])

    if (!isOpen) return null

    return (
        <>
            {selectedProduct && product && (
                <ProductViewModal
                    isOpen={isProductViewOpen} 
                    onClose={onProductViewHide} 
                    onOpen={onProductViewOpen}
                    product={product}
                    addToCart={(variant, quantity) =>
                        handleAddToCart([{product: product, variant, quantity: quantity}])
                    }
                />
            )}          
            {!selectedProduct && (
                <Modal isOpen={isOpen} onClose={(onClose)} size="3xl" scrollBehavior="inside">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>
                            <Text fontSize="lg" fontWeight="bold">
                                Add Bonus Product ({selectedCount} of {maxBonusItems})
                            </Text>
                        </ModalHeader>
                        <ModalCloseButton onClick={onClickClose} />

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
                                                onClick={() => handleClickBonusProduct(product)}
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
                            <Button colorScheme="blue" onClick={onClickClose}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </>
    )
}
