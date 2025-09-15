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
    Heading,
    IconButton,
    Badge,
    HStack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    useProducts,
    useShopperCustomersMutation,
    useCustomerId
} from '@salesforce/commerce-sdk-react'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import {HeartIcon, HeartSolidIcon} from '@salesforce/retail-react-app/app/components/icons'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {filterImageGroups} from '@salesforce/retail-react-app/app/utils/product-utils'
import {
    PRODUCT_BADGE_DETAILS,
    API_ERROR_MESSAGE,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST,
    TOAST_ACTION_VIEW_WISHLIST
} from '@salesforce/retail-react-app/app/constants'
import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import BonusProductViewModal from '@salesforce/retail-react-app/app/components/bonus-product-view-modal'
import {findAvailableBonusDiscountLineItemIds} from '@salesforce/retail-react-app/app/utils/bonus-product-utils'
import {addToCartModalTheme} from '@salesforce/retail-react-app/app/theme/components/project/add-to-cart-modal'

// Import AddToCartModal to render it within this provider
import {AddToCartModal} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

const IconButtonWithRegistration = withRegistration(IconButton)

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

    // Retrieve product badges (similar to ProductTile logic)
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

                    {/* Wishlist Icon - positioned like ProductTile */}
                    {enableFavourite && (
                        <Box
                            position="absolute"
                            top="2"
                            right="2"
                            onClick={(e) => {
                                // stop click event from bubbling
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

                    {/* Product Badges - positioned like ProductTile */}
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
    const toast = useToast()
    const navigate = useNavigation()
    const customerId = useCustomerId()

    // Extract bonus products from modal data and derive promotionId using same logic as products card
    const bonusProducts = data?.bonusDiscountLineItems || []
    const {data: basket} = useCurrentBasket()

    // Wishlist functionality
    const {data: wishlist} = useWishList()
    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const deleteCustomerProductListItem = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    // Calculate bonus item IDs for tracking
    const bonusLineItemIds = useMemo(
        () => bonusProducts.map((bli) => bli.id).filter(Boolean),
        [bonusProducts]
    )

    // Calculate maximum available bonus items
    const maxBonusItems = useMemo(
        () => bonusProducts.reduce((sum, bli) => sum + (bli.maxBonusItems || 0), 0),
        [bonusProducts]
    )

    // Calculate currently selected bonus items
    const selectedBonusItems = useMemo(() => {
        const items = basket?.productItems || []
        return items
            .filter(
                (it) =>
                    it?.bonusProductLineItem &&
                    bonusLineItemIds.includes(it?.bonusDiscountLineItemId)
            )
            .reduce((acc, it) => acc + (it?.quantity || 0), 0)
    }, [basket, bonusLineItemIds])

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
                    const availablePairs = findAvailableBonusDiscountLineItemIds(
                        basket,
                        candidate.promotionId
                    )
                    if (availablePairs.length > 0) {
                        computedPromotionId = candidate.promotionId
                        computedBonusDiscountLineItemId = availablePairs[0][0] // Use first available ID
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

    // Wishlist handlers
    const handleAddToWishlist = useCallback(
        async (product) => {
            if (!wishlist || !customerId) return

            try {
                await createCustomerProductListItem.mutateAsync({
                    parameters: {
                        listId: wishlist.id,
                        customerId
                    },
                    body: {
                        quantity: 1,
                        productId: product.productId,
                        public: false,
                        priority: 1,
                        type: 'product'
                    }
                })

                toast({
                    title: intl.formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                    status: 'success',
                    action: (
                        <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                            {intl.formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                        </Button>
                    )
                })
            } catch (error) {
                toast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        },
        [wishlist, customerId, createCustomerProductListItem, toast, intl, navigate]
    )

    const handleRemoveFromWishlist = useCallback(
        async (product) => {
            if (!wishlist || !customerId) return

            const wishlistItem = wishlist.customerProductListItems?.find(
                (item) => item.productId === product.productId
            )

            if (!wishlistItem) return

            try {
                await deleteCustomerProductListItem.mutateAsync({
                    parameters: {
                        customerId,
                        itemId: wishlistItem.id,
                        listId: wishlist.id
                    }
                })

                toast({
                    title: intl.formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                    status: 'success'
                })
            } catch (error) {
                toast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        },
        [wishlist, customerId, deleteCustomerProductListItem, toast, intl]
    )

    const handleWishlistToggle = useCallback(
        async (product, shouldAdd) => {
            if (shouldAdd) {
                await handleAddToWishlist(product)
            } else {
                await handleRemoveFromWishlist(product)
            }
        },
        [handleAddToWishlist, handleRemoveFromWishlist]
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
                    <ModalOverlay bg="blackAlpha.300" />
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
                                            'Select bonus product ({selected} of {max} selected)'
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
                                        maxHeight={{base: '60vh', md: '70vh'}}
                                        overflowY="auto"
                                        width="100%"
                                        px="1"
                                    >
                                        <SimpleGrid
                                            columns={{base: 1, md: 3}}
                                            spacing="4"
                                            width="100%"
                                        >
                                            {uniqueBonusProducts.map((product) => {
                                                const foundProductData = productData?.data?.find(
                                                    (p) => p.id === product.productId
                                                )
                                                const isInWishlist =
                                                    wishlist?.customerProductListItems?.some(
                                                        (item) =>
                                                            item.productId === product.productId
                                                    )
                                                return (
                                                    <BonusProductItem
                                                        key={product.productId}
                                                        product={product}
                                                        productData={foundProductData}
                                                        foundProductData={foundProductData}
                                                        onSelect={switchToProductView}
                                                        isLoading={isLoading}
                                                        enableFavourite={true}
                                                        isFavourite={isInWishlist}
                                                        onFavouriteToggle={(shouldAdd) =>
                                                            handleWishlistToggle(product, shouldAdd)
                                                        }
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
