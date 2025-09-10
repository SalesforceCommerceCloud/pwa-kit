/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext, useState, useMemo, useCallback} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Text,
    Box,
    VStack,
    AspectRatio,
    Skeleton,
    SimpleGrid,
    Button,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useProducts} from '@salesforce/commerce-sdk-react'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {filterImageGroups} from '@salesforce/retail-react-app/app/utils/product-utils'
import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import BonusProductViewModal from '@salesforce/retail-react-app/app/components/bonus-product-view-modal'
import {findAvailableBonusDiscountLineItemId, getBonusProductCountsForPromotion} from '@salesforce/retail-react-app/app/utils/bonus-product-utils'
import {addToCartModalTheme} from '@salesforce/retail-react-app/app/theme/components/project/add-to-cart-modal'

// Import AddToCartModal to render it within this provider
import {AddToCartModal} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

/**
 * Context for managing the BonusProductSelectionModal.
 * Used in top level App component.
 */
export const BonusProductSelectionModalContext = React.createContext()
export const useBonusProductSelectionModalContext = () =>
    useContext(BonusProductSelectionModalContext)

export const BonusProductSelectionModalProvider = ({children}) => {
    const bonusProductSelectionModal = useBonusProductSelectionModal()
    return (
        <BonusProductSelectionModalContext.Provider value={bonusProductSelectionModal}>
            {children}
            <BonusProductSelectionModal />
            <AddToCartModal />
        </BonusProductSelectionModalContext.Provider>
    )
}

BonusProductSelectionModalProvider.propTypes = {
    children: PropTypes.node.isRequired
}

// Component to display individual bonus product with checkbox for selection
const BonusProductItem = ({product, productData, foundProductData, onSelect, isLoading}) => {
    const intl = useIntl()
    const productName = product?.productName || product?.title

    // Get the appropriate image group from the passed product data
    const imageGroup = useMemo(() => {
        if (!productData?.imageGroups) {
            return null
        }

        const variantImages = filterImageGroups(productData.imageGroups, product)

        if (variantImages?.length > 0) {
            const largeImage = findImageGroupBy(variantImages, {
                viewType: 'large'
            })
            return largeImage
        }

        // Fall back to default small images
        const defaultSmallImage = findImageGroupBy(productData.imageGroups, {
            viewType: 'small'
        })
        return defaultSmallImage
    }, [productData, product])

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
        <Box p="4" bg="white">
            <VStack spacing="3" align="center" justify="flex-start">
                <AspectRatio ratio={1} width="162px" maxWidth="162px">
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
                <Text fontSize="md" fontWeight="semibold" noOfLines={2} textAlign="center">
                    {productName}
                </Text>
                <Box display="flex" alignItems="center" justifyContent="center" gap="2">
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
    isLoading: PropTypes.bool
}

/**
 * Modal for selecting from available bonus products.
 */
export const BonusProductSelectionModal = () => {
    const {isOpen, onClose: originalOnClose, data} = useBonusProductSelectionModalContext()
    // Independent state for the product view modal
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [selectedBonusMeta, setSelectedBonusMeta] = useState({
        bonusDiscountLineItemId: null,
        promotionId: null
    })
    const intl = useIntl()

    // Extract bonus products from modal data and derive promotionId using same logic as products card
    const bonusProducts = data?.bonusDiscountLineItems || []
    const {data: basket} = useCurrentBasket()
    
    // Get promotionId from bonus products - all items have the same promotionId since they're 
    // pre-filtered in select-bonus-products-card.jsx (line 143: bli.promotionId === promotionId)
    const promotionId = bonusProducts.length > 0 ? bonusProducts[0]?.promotionId : null
    
    // Calculate promotion-specific bonus counts using utility method
    const {selectedBonusItems, maxBonusItems} = useMemo(() => {
        return getBonusProductCountsForPromotion(basket, promotionId)
    }, [basket, promotionId])

    // Get product IDs for fetching product data, deduplicating by productId
    const uniqueBonusProducts = bonusProducts
        .flatMap((item) => item.bonusProducts || [])
        .filter(
            (product, index, self) =>
                index === self.findIndex((p) => p.productId === product.productId)
        )

    const productIds = uniqueBonusProducts
        .map((product) => product.productId)
        .filter(Boolean)
        .join(',')

    // Fetch product data
    const {data: productData, isLoading} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(productIds),
            placeholderData: null
        }
    )

    // Build a mapping for quick lookup of fetched product by id
    const productById = useMemo(() => {
        const map = new Map()
        productData?.data?.forEach((p) => map.set(p.id, p))
        return map
    }, [productData])

    // When selecting a product, compute metadata, close the selection modal, and open product view modal
    const switchToProductView = useCallback(
        (bonusProduct, foundProductData) => {
            const initial = foundProductData || productById.get(bonusProduct?.productId)
            const normalizedInitial = initial
                ? {
                      productId: initial.id,
                      ...initial,
                      // Ensure imageGroups are preserved
                      imageGroups: initial.imageGroups || [],
                      // Ensure other required fields
                      variants: initial.variants || [],
                      variationAttributes: initial.variationAttributes || [],
                      type: initial.type || {set: false, bundle: false}
                  }
                : {
                      productId: bonusProduct?.productId,
                      imageGroups: [],
                      variants: [],
                      variationAttributes: [],
                      type: {set: false, bundle: false}
                  }

            // Determine the promotion and available bonus discount line item id for this product
            let computedPromotionId = null
            let computedBonusDiscountLineItemId = null

            const candidates = bonusProducts.filter((bli) =>
                (bli.bonusProducts || []).some((p) => p.productId === normalizedInitial.productId)
            )

            if (candidates.length > 0) {
                for (const candidate of candidates) {
                    const availableId = findAvailableBonusDiscountLineItemId(
                        basket,
                        candidate.promotionId,
                        1,
                        candidate.id
                    )
                    if (availableId) {
                        computedPromotionId = candidate.promotionId
                        computedBonusDiscountLineItemId = availableId
                        break
                    }
                }

                // Fallback to the first candidate if none computed
                if (!computedBonusDiscountLineItemId) {
                    computedPromotionId = candidates[0].promotionId || null
                    computedBonusDiscountLineItemId = candidates[0].id || null
                }
            }

            setSelectedProduct(normalizedInitial)
            setSelectedBonusMeta({
                bonusDiscountLineItemId: computedBonusDiscountLineItemId,
                promotionId: computedPromotionId
            })

            // Don't close the main modal context, just switch to product view
            // This allows us to return to the selection modal later
            setTimeout(() => {
                setIsViewOpen(true)
            }, 150)
        },
        [productById, bonusProducts, basket]
    )

    const handleClose = useCallback(() => {
        // Auto-reset on close; also ensure view modal is closed
        setSelectedProduct(null)
        setSelectedBonusMeta({bonusDiscountLineItemId: null, promotionId: null})
        setIsViewOpen(false)
        originalOnClose()
    }, [originalOnClose])

    // Callback to return from BonusProductViewModal to SelectBonusProductModal
    const handleReturnToSelection = useCallback(() => {
        // Close the product view modal and return to selection modal
        setIsViewOpen(false)
        setSelectedProduct(null)
        setSelectedBonusMeta({bonusDiscountLineItemId: null, promotionId: null})
        // The selection modal will automatically show since isViewOpen becomes false
        // and the main modal context (isOpen) should still be true
    }, [])

    // Render selection modal (if open) and product view modal (controlled independently)
    // Only render selection modal if view modal is not open to prevent layering issues
    return (
        <>
            {/* Selection Modal - only show if view modal is not open */}
            {!isViewOpen && isOpen && (
                <Modal
                    size={addToCartModalTheme.modal.size}
                    isOpen={isOpen}
                    onClose={handleClose}
                    scrollBehavior={addToCartModalTheme.modal.scrollBehavior}
                    isCentered
                >
                    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                    <ModalContent
                        margin={addToCartModalTheme.layout.content.margin}
                        borderRadius={addToCartModalTheme.layout.content.borderRadius}
                        maxHeight={addToCartModalTheme.layout.content.maxHeight}
                        overflowY={addToCartModalTheme.layout.content.overflowY}
                        bg={addToCartModalTheme.colors.background}
                    >
                        <ModalHeader
                            paddingY={addToCartModalTheme.layout.header.paddingY}
                            bgColor={addToCartModalTheme.colors.contentBackground}
                            borderTopRadius={addToCartModalTheme.layout.content.borderRadius}
                            borderBottom={addToCartModalTheme.layout.header.borderBottom}
                            borderColor={addToCartModalTheme.layout.header.borderColor}
                        >
                            <Heading as="h3" size="md">
                                {intl.formatMessage(
                                    {
                                        id: 'bonus_product_modal.title',
                                        defaultMessage:
                                            'Select Bonus Product ({selected} of {max} selected)'
                                    },
                                    {selected: selectedBonusItems, max: maxBonusItems}
                                )}
                            </Heading>
                        </ModalHeader>

                        <ModalBody
                            bgColor={addToCartModalTheme.colors.contentBackground}
                            padding={addToCartModalTheme.layout.body.padding}
                            marginBottom={addToCartModalTheme.layout.body.marginBottom}
                        >
                            {bonusProducts.length === 0 ? (
                                <Text textAlign="center" color="gray.500" py="8">
                                    {intl.formatMessage({
                                        id: 'bonus_product_modal.no_bonus_products',
                                        defaultMessage: 'No bonus products available'
                                    })}
                                </Text>
                            ) : (
                                <VStack spacing="4">
                                    <Box 
                                        maxHeight={{base: "60vh", md: "70vh"}} 
                                        overflowY="auto" 
                                        width="100%"
                                        px="1"
                                    >
                                        <SimpleGrid columns={{base: 1, md: 3}} spacing="4" width="100%">
                                            {uniqueBonusProducts.map((product) => {
                                                const foundProductData = productData?.data?.find(
                                                    (p) => p.id === product.productId
                                                )
                                                return (
                                                    <BonusProductItem
                                                        key={product.productId}
                                                        product={product}
                                                        productData={foundProductData}
                                                        foundProductData={foundProductData}
                                                        onSelect={switchToProductView}
                                                        isLoading={isLoading}
                                                    />
                                                )
                                            })}
                                        </SimpleGrid>
                                    </Box>
                                </VStack>
                            )}
                        </ModalBody>
                        <ModalCloseButton
                            size="md"
                            position="absolute"
                            top="4"
                            right="4"
                            bg="white"
                            _hover={{bg: 'gray.100'}}
                        />
                    </ModalContent>
                </Modal>
            )}

            {/* Product View Modal */}
            {isViewOpen && selectedProduct && (
                <BonusProductViewModal
                    isOpen={isViewOpen}
                    onClose={handleClose}
                    product={selectedProduct}
                    bonusDiscountLineItemId={selectedBonusMeta?.bonusDiscountLineItemId}
                    promotionId={selectedBonusMeta?.promotionId}
                    onReturnToSelection={handleReturnToSelection}
                    withBackdrop={true}
                />
            )}
        </>
    )
}

export const useBonusProductSelectionModal = () => {
    const {isOpen, data, onOpen, onClose} = useModalState({
        // Keep the modal open when query params change (product view cleans variant params)
        closeOnRouteChange: false,
        resetDataOnClose: true
    })
    return {isOpen, data, onOpen, onClose}
}
