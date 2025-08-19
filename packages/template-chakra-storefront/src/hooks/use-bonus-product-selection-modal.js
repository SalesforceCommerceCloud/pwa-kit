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
    Dialog,
    Text,
    Box,
    VStack,
    AspectRatio,
    Skeleton,
    SimpleGrid,
    Button,
    CloseButton,
    Heading,
    useBreakpointValue
} from '@chakra-ui/react'
import {useProducts} from '@salesforce/commerce-sdk-react'
import DynamicImage from '../components/dynamic-image'
import {findImageGroupBy} from '../utils/image-groups-utils'
import {filterImageGroups} from '../utils/product-utils'
import {addToCartModalTheme} from '../theme/components/project/add-to-cart-modal'
import {useModalState} from './use-modal-state'
import ProductView from '../components/product-view'
import {useProductViewModal} from './use-product-view-modal'
import {productViewModalTheme} from '../theme/components/project/product-view-modal'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from './use-current-basket'

// Dedicated panel for product view mode to keep hooks ordering valid and avoid remounts
const BonusProductViewPanel = React.memo(function BonusProductViewPanel({
    initialProduct,
    bonusMeta,
    onBack
}) {
    const intl = useIntl()
    const productViewModalData = useProductViewModal(initialProduct)
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()

    //

    const handleAddToCart = useCallback(
        async (variant, quantity) => {
            const items = [
                {
                    productId:
                        variant?.productId || initialProduct?.id || initialProduct?.productId,
                    price: variant?.price || initialProduct?.price,
                    quantity: quantity,
                    bonusDiscountLineItemId: bonusMeta.bonusDiscountLineItemId
                }
            ]
            const result = await addItemToNewOrExistingBasket(items)
            return result
        },
        [addItemToNewOrExistingBasket, initialProduct, bonusMeta]
    )

    return (
        <Box
            bg={productViewModalTheme.layout.body.background}
            padding={productViewModalTheme.layout.body.padding}
        >
            <ProductView
                showFullLink={productViewModalTheme.productView.showFullLink}
                imageSize={productViewModalTheme.productView.imageSize}
                showImageGallery={productViewModalTheme.productView.showImageGallery}
                product={productViewModalData?.product}
                isLoading={productViewModalData?.isFetching}
                addToCart={handleAddToCart}
                isProductLoading={productViewModalData?.isFetching}
                promotionId={bonusMeta?.promotionId}
                suppressAddToCartModal={true}
            />
            <Box mt={4} display="flex" gap={2}>
                <Button
                    variant="outline"
                    onClick={() => {
                        onBack()
                    }}
                >
                    {intl.formatMessage({
                        id: 'bonus_product_modal.back_to_selection',
                        defaultMessage: 'Back to Selection'
                    })}
                </Button>
            </Box>
        </Box>
    )
})

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
                            alt={productName}
                            fallbackSrc={
                                imageGroup.images[0].disBaseLink || imageGroup.images[0].link
                            }
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

BonusProductViewPanel.propTypes = {
    initialProduct: PropTypes.object,
    bonusMeta: PropTypes.shape({
        bonusDiscountLineItemId: PropTypes.string,
        promotionId: PropTypes.string
    }),
    onBack: PropTypes.func.isRequired
}

/**
 * Modal for selecting from available bonus products.
 */
export const BonusProductSelectionModal = () => {
    const {isOpen, onClose: originalOnClose, data} = useBonusProductSelectionModalContext()
    // Modes: 'selection' | 'view'
    const [modalMode, setModalMode] = useState('selection')
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [selectedBonusMeta, setSelectedBonusMeta] = useState({
        bonusDiscountLineItemId: null,
        promotionId: null
    })
    const size = useBreakpointValue(addToCartModalTheme.modal.size)
    const intl = useIntl()

    // Extract bonus products and basket for selection counts
    const bonusProducts = data?.bonusDiscountLineItems || []
    const {data: basket} = useCurrentBasket()
    const bonusLineItemIds = useMemo(
        () => bonusProducts.map((bli) => bli.id).filter(Boolean),
        [bonusProducts]
    )
    const maxBonusItems = useMemo(
        () => bonusProducts.reduce((sum, bli) => sum + (bli.maxBonusItems || 0), 0),
        [bonusProducts]
    )
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

    //

    // Build a mapping for quick lookup of fetched product by id
    const productById = useMemo(() => {
        const map = new Map()
        productData?.data?.forEach((p) => map.set(p.id, p))
        return map
    }, [productData])

    // Switch to product view mode with selected product
    const switchToProductView = useCallback(
        (bonusProduct, foundProductData) => {
            const initial = foundProductData || productById.get(bonusProduct?.productId)
            const normalizedInitial = initial
                ? {productId: initial.id, ...initial}
                : {productId: bonusProduct?.productId}
            setSelectedProduct(normalizedInitial)
            setSelectedBonusMeta({
                bonusDiscountLineItemId: bonusProduct?.bonusDiscountLineItemId || null,
                promotionId: bonusProduct?.promotionId || null
            })
            setModalMode('view')
        },
        [productById]
    )

    const goBackToSelection = useCallback(() => {
        setModalMode('selection')
        setSelectedProduct(null)
        setSelectedBonusMeta({bonusDiscountLineItemId: null, promotionId: null})
    }, [])

    const handleClose = useCallback(() => {
        // Auto-reset on close
        setModalMode('selection')
        setSelectedProduct(null)
        setSelectedBonusMeta({bonusDiscountLineItemId: null, promotionId: null})
        originalOnClose()
    }, [originalOnClose])

    if (!isOpen) {
        return null
    }

    // (removed inline BonusProductViewPanel — now using memoized top-level component)

    return (
        <>
            <Dialog.Root
                size={size}
                open={isOpen}
                scrollBehavior={addToCartModalTheme.modal.scrollBehavior}
                placement={addToCartModalTheme.modal.placement}
            >
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content
                        margin={addToCartModalTheme.layout.content.margin}
                        borderRadius={addToCartModalTheme.layout.content.borderRadius}
                        bgColor={addToCartModalTheme.colors.background}
                    >
                        <Dialog.Header
                            paddingY={addToCartModalTheme.layout.header.paddingY}
                            bgColor={addToCartModalTheme.colors.contentBackground}
                        >
                            {modalMode === 'selection' ? (
                                <Heading as="h3" fontSize={24} fontWeight="700">
                                    {intl.formatMessage(
                                        {
                                            id: 'bonus_product_modal.title',
                                            defaultMessage:
                                                'Select Bonus Product ({selected} of {max} selected)'
                                        },
                                        {selected: selectedBonusItems, max: maxBonusItems}
                                    )}
                                </Heading>
                            ) : (
                                <Heading as="h3" fontSize={24} fontWeight="700">
                                    {selectedProduct?.name ||
                                        selectedProduct?.productName ||
                                        intl.formatMessage({
                                            id: 'bonus_product_modal.view_title',
                                            defaultMessage: 'Bonus Product Details'
                                        })}
                                </Heading>
                            )}
                        </Dialog.Header>

                        <Dialog.Body
                            bgColor={addToCartModalTheme.colors.contentBackground}
                            padding={addToCartModalTheme.layout.body.padding}
                            marginBottom={addToCartModalTheme.layout.body.marginBottom}
                        >
                            {modalMode === 'selection' ? (
                                bonusProducts.length === 0 ? (
                                    <Text textAlign="center" color="gray.500" py="8">
                                        {intl.formatMessage({
                                            id: 'bonus_product_modal.no_bonus_products',
                                            defaultMessage: 'No bonus products available'
                                        })}
                                    </Text>
                                ) : (
                                    <VStack spacing="4">
                                        <SimpleGrid
                                            columns={{base: 1, md: 3}}
                                            spacing="4"
                                            width="100%"
                                        >
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
                                    </VStack>
                                )
                            ) : (
                                <BonusProductViewPanel
                                    initialProduct={selectedProduct}
                                    bonusMeta={selectedBonusMeta}
                                    onBack={goBackToSelection}
                                />
                            )}
                        </Dialog.Body>
                        <CloseButton
                            size="md"
                            onClick={handleClose}
                            position="absolute"
                            top="4"
                            right="4"
                        />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
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
