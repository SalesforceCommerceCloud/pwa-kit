/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo, useCallback} from 'react'
import PropTypes from 'prop-types'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    Box,
    Text,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {useProductViewModal} from '@salesforce/retail-react-app/app/hooks/use-product-view-modal'
import {useControlledVariations} from '@salesforce/retail-react-app/app/hooks/use-controlled-variations'
import {useIntl} from 'react-intl'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {processProductsForBonusCart} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'
import {useBonusProductCounts} from '@salesforce/retail-react-app/app/utils/bonus-product/hooks'
import {checkForRemainingBonusProducts} from '@salesforce/retail-react-app/app/components/bonus-product-view-modal/utils'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {productViewModalTheme} from '@salesforce/retail-react-app/app/theme/components/project/product-view-modal'
import {bonusProductViewModalTheme} from '@salesforce/retail-react-app/app/theme/components/project/bonus-product-view-modal'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'

/**
 * A Modal that contains Bonus Product View
 */
const BonusProductViewModal = ({
    product,
    isOpen,
    onClose,
    promotionId,
    onReturnToSelection,
    ...props
}) => {
    // Ensure a safe product shape for the modal hook
    const safeProduct = useMemo(() => {
        if (!product) return {productId: undefined, variants: [], variationAttributes: []}
        const id = product.productId || product.id
        return {
            productId: id,
            id,
            variants: product.variants || [],
            variationAttributes: product.variationAttributes || [],
            imageGroups: product.imageGroups || [],
            type: product.type || {set: false, bundle: false},
            price: product.price,
            name: product.name || product.productName
        }
    }, [product])

    // Use custom hook for controlled variation management
    const {controlledVariationValues, handleVariationChange} = useControlledVariations(safeProduct)

    const productViewModalData = useProductViewModal(safeProduct, controlledVariationValues, {
        keepPreviousData: true
    })

    // Keep a stable reference to the last successfully loaded product
    // This prevents constant re-renders while fetching
    const lastLoadedProductRef = React.useRef(productViewModalData.product)

    React.useLayoutEffect(() => {
        if (productViewModalData.product && !productViewModalData.isFetching) {
            lastLoadedProductRef.current = productViewModalData.product
        }
    }, [productViewModalData.product, productViewModalData.isFetching])

    // Use the stable product reference to prevent flashing during fetches
    const stableProductViewModalData = React.useMemo(
        () => ({
            ...productViewModalData,
            product:
                productViewModalData.isFetching && lastLoadedProductRef.current
                    ? lastLoadedProductRef.current
                    : productViewModalData.product
        }),
        [productViewModalData.product, productViewModalData.isFetching]
    )

    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
    const {data: basket} = useCurrentBasket()
    const navigate = useNavigation()

    // Extract available bonus product IDs from basket for variant filtering
    const availableBonusProductIds = useMemo(() => {
        if (!basket?.bonusDiscountLineItems || !promotionId) return []

        return basket.bonusDiscountLineItems
            .filter((item) => item.promotionId === promotionId)
            .flatMap((item) => item.bonusProducts || [])
            .map((bonusProduct) => bonusProduct.productId)
            .filter(Boolean)
    }, [basket, promotionId])

    // Check if we have promotion data to work with
    const hasPromotionData = useMemo(() => {
        return !!promotionId
    }, [promotionId])

    const intl = useIntl()
    const {formatMessage} = intl
    const showToast = useToast()

    // Calculate bonus counts using promotionId and custom hook
    const {finalSelectedBonusItems, finalMaxBonusItems} = useBonusProductCounts(basket, promotionId)

    const messages = useMemo(
        () => ({
            modalLabel: formatMessage(
                {
                    id: 'bonus_product_view_modal.modal_label',
                    defaultMessage: 'Bonus product selection modal for {productName}'
                },
                {productName: stableProductViewModalData?.product?.name}
            ),
            viewCart: formatMessage({
                id: 'bonus_product_view_modal.button.view_cart',
                defaultMessage: 'View Cart'
            }),
            backToSelection: formatMessage({
                id: 'bonus_product_view_modal.button.back_to_selection',
                defaultMessage: '← Back to Selection'
            })
        }),
        [intl, stableProductViewModalData?.product?.name, formatMessage]
    )

    // Custom addToCart handler for bonus products that includes bonusDiscountLineItemId
    const handleAddToCart = useCallback(
        async (products) => {
            try {
                // Process products using the extracted helper function
                // Use a function that returns the remaining capacity based on the bonus counts
                const getRemainingQuantity = () =>
                    Math.max(0, finalMaxBonusItems - finalSelectedBonusItems)

                const productItems = processProductsForBonusCart(
                    products,
                    basket,
                    promotionId,
                    product,
                    getRemainingQuantity
                )

                if (productItems.length === 0) {
                    return null
                }

                const result = await addItemToNewOrExistingBasket(productItems)

                // Check for remaining bonus products after successful add to cart
                if (result) {
                    // Show success toast notification
                    showToast({
                        title: formatMessage({
                            id: 'bonus_product_view_modal.toast.item_added',
                            defaultMessage: 'Bonus item added to cart'
                        }),
                        status: 'success'
                    })

                    // Get updated basket data to check for remaining bonus products
                    // addItemToNewOrExistingBasket returns the basket directly
                    const updatedBasket = result

                    // Check if there are still remaining bonus products available for THIS promotion
                    const hasRemainingBonusProducts = checkForRemainingBonusProducts(
                        updatedBasket,
                        promotionId
                    )

                    if (hasRemainingBonusProducts && onReturnToSelection) {
                        // Return to SelectBonusProductModal if there are remaining bonus products
                        onReturnToSelection()
                        // Return null to prevent AddToCartModal from opening
                        return null
                    } else {
                        // Navigate to cart page if no remaining bonus products or no callback provided
                        onClose()
                        // Always use a delay to ensure modal closes cleanly
                        setTimeout(() => {
                            navigate('/cart', 'push')
                        }, 200)
                        // Return null to prevent AddToCartModal from opening
                        return null
                    }
                }

                // For bonus products, don't open add-to-cart modal - just return null
                return null
            } catch (error) {
                console.error('Error adding bonus product to cart:', error)
                return null
            }
        },
        [
            addItemToNewOrExistingBasket,
            basket,
            promotionId,
            product,
            finalMaxBonusItems,
            finalSelectedBonusItems,
            onClose,
            navigate,
            onReturnToSelection,
            showToast,
            formatMessage
        ]
    )

    // Custom buttons for the ProductView
    const handleViewCart = useCallback(() => {
        // Close modal immediately and navigate with proper delay
        onClose()
        // Always use a delay to ensure modal closes cleanly
        setTimeout(() => {
            navigate('/cart', 'push')
        }, 200)
    }, [onClose, navigate])

    // Reusable Back to Selection button component
    const BackToSelectionButton = useMemo(
        () => (
            <Text
                as="button"
                color="blue.600"
                cursor="pointer"
                onClick={onReturnToSelection}
                fontSize={{base: 'lg', lg: 'md'}}
                _hover={{
                    color: 'blue.700'
                }}
            >
                {messages.backToSelection}
            </Text>
        ),
        [messages.backToSelection, onReturnToSelection]
    )

    const customButtons = useMemo(
        () => [
            <Button key="view-cart" variant="outline" onClick={handleViewCart}>
                {messages.viewCart}
            </Button>
        ],
        [messages.viewCart, handleViewCart]
    )

    // Clean product data and pre-filter variants based on available bonus products
    const productToRender = useMemo(() => {
        const baseProduct = stableProductViewModalData.product || safeProduct

        // Always provide a fallback product for testing scenarios
        if (!baseProduct) {
            return null
        }

        // If no promotion data, just return the basic product without filtering
        if (!hasPromotionData) {
            return {
                ...baseProduct,
                variationAttributes: baseProduct.variationAttributes,
                variants: baseProduct.variants,
                variationParams: baseProduct.variationParams,
                selectedVariationAttributes: baseProduct.selectedVariationAttributes,
                type: baseProduct.type,
                inventory: {
                    ...baseProduct.inventory,
                    orderable: true,
                    stockLevel: 999
                },
                minOrderQuantity: 1,
                stepQuantity: 1,
                orderable: true,
                rating: baseProduct.rating,
                reviewCount: baseProduct.reviewCount
            }
        }

        // If no bonus products are available, still render but with original product
        if (availableBonusProductIds.length === 0) {
            return {
                ...baseProduct,
                variationAttributes: baseProduct.variationAttributes,
                variants: baseProduct.variants,
                variationParams: baseProduct.variationParams,
                selectedVariationAttributes: baseProduct.selectedVariationAttributes,
                type: baseProduct.type,
                inventory: {
                    ...baseProduct.inventory,
                    orderable: true,
                    stockLevel: 999
                },
                minOrderQuantity: 1,
                stepQuantity: 1,
                orderable: true,
                rating: baseProduct.rating,
                reviewCount: baseProduct.reviewCount
            }
        }

        // Check if we should filter variants
        // Only treat it as base product ID if it's NOT found in the variants array
        const isBaseProductId = !baseProduct.variants?.some((v) => v.productId === baseProduct.id)
        const hasBaseProductId =
            isBaseProductId && availableBonusProductIds.includes(baseProduct.id)
        const hasVariantIds = availableBonusProductIds.some((id) =>
            baseProduct.variants?.some((v) => v.productId === id)
        )

        let filteredVariants = baseProduct.variants || []
        let filteredVariationAttributes = baseProduct.variationAttributes || []

        // If we have specific variant IDs (not base product), filter variants and variation attributes
        if (hasVariantIds && !hasBaseProductId) {
            // Filter variants to only include available ones
            filteredVariants =
                baseProduct.variants?.filter((variant) =>
                    availableBonusProductIds.includes(variant.productId)
                ) || []

            // Filter variation attribute values to only show available combinations
            filteredVariationAttributes =
                baseProduct.variationAttributes
                    ?.map((attr) => {
                        const availableValues =
                            attr.values?.filter((value) => {
                                // Check if this value leads to an available variant
                                return filteredVariants.some(
                                    (variant) => variant.variationValues?.[attr.id] === value.value
                                )
                            }) || []

                        return {
                            ...attr,
                            values: availableValues
                        }
                    })
                    .filter((attr) => attr.values.length > 0) || []
        }

        // KEY FIX: Ensure the correct variant is pre-selected to prevent flash
        // When we have only one available variant, make sure it's the selected one
        let finalProduct = {
            ...baseProduct,
            variationAttributes: filteredVariationAttributes,
            variants: filteredVariants,
            variationParams: baseProduct.variationParams,
            selectedVariationAttributes: baseProduct.selectedVariationAttributes,
            type: baseProduct.type,
            inventory: {
                ...baseProduct.inventory,
                orderable: true,
                stockLevel: 999
            },
            minOrderQuantity: 1,
            stepQuantity: 1,
            orderable: true,
            rating: baseProduct.rating,
            reviewCount: baseProduct.reviewCount
        }

        // If we filtered to only one variant, ensure it's pre-selected
        if (filteredVariants.length === 1 && filteredVariants[0].variationValues) {
            const selectedVariant = filteredVariants[0]
            finalProduct = {
                ...finalProduct,
                // Override the product ID to be the selected variant
                id: selectedVariant.productId,
                // Pre-set the variation values to match the selected variant
                selectedVariant,
                variationValues: selectedVariant.variationValues
            }
        }

        return finalProduct
    }, [
        stableProductViewModalData.product,
        safeProduct,
        hasPromotionData,
        availableBonusProductIds
    ])

    // Calculate max order quantity for UI - reuse the same calculation from the header
    const maxOrderQuantity = Math.max(0, finalMaxBonusItems - finalSelectedBonusItems)

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={productViewModalTheme.modal.size}
            closeOnOverlayClick={true}
            closeOnEsc={true}
            isCentered
            motionPreset="slideInBottom"
            preserveScrollBarGap={true}
        >
            <ModalOverlay />
            <ModalContent
                data-testid="bonus-product-view-modal"
                aria-label={messages.modalLabel}
                margin={productViewModalTheme.layout.content.margin}
                borderRadius={productViewModalTheme.layout.content.borderRadius}
                bg={productViewModalTheme.layout.content.background}
                maxHeight={bonusProductViewModalTheme.layout.content.maxHeight}
                overflowY={productViewModalTheme.layout.content.overflowY}
            >
                <ModalHeader
                    bg={productViewModalTheme.colors.contentBackground}
                    pb={onReturnToSelection ? {base: 1, lg: 6} : 6}
                    px={6}
                    pt={6}
                >
                    <Heading size="md">
                        {formatMessage(
                            {
                                id: 'bonus_product_view_modal.title',
                                defaultMessage:
                                    'Select bonus product ({selected} of {max} selected)'
                            },
                            {selected: finalSelectedBonusItems, max: finalMaxBonusItems}
                        )}
                    </Heading>
                    {/* Mobile-only Back to Selection button */}
                    {onReturnToSelection && (
                        <HideOnDesktop>
                            <Box mt={2} mb={0}>
                                {BackToSelectionButton}
                            </Box>
                        </HideOnDesktop>
                    )}
                </ModalHeader>

                <ModalBody
                    bg={productViewModalTheme.layout.body.background}
                    px={productViewModalTheme.layout.body.padding}
                    pt={
                        onReturnToSelection
                            ? {base: 1, lg: productViewModalTheme.layout.body.padding}
                            : productViewModalTheme.layout.body.padding
                    }
                    pb={productViewModalTheme.layout.body.paddingBottom}
                >
                    {(stableProductViewModalData.isFetching &&
                        !stableProductViewModalData.product) ||
                    !productToRender ? (
                        <Box p={8} textAlign="center">
                            <Text>Loading product details...</Text>
                        </Box>
                    ) : (
                        <ProductView
                            showFullLink={false}
                            imageSize="sm"
                            showImageGallery={true}
                            product={productToRender}
                            isLoading={false}
                            addToCart={handleAddToCart}
                            isProductLoading={false}
                            customButtons={customButtons}
                            promotionId={promotionId}
                            maxOrderQuantity={maxOrderQuantity}
                            showReviews={true}
                            showVariationAttributes={true}
                            alignItems="stretch"
                            imageGalleryFooter={
                                onReturnToSelection ? (
                                    <HideOnMobile>{BackToSelectionButton}</HideOnMobile>
                                ) : null
                            }
                            controlledVariationValues={controlledVariationValues}
                            onVariationChange={handleVariationChange}
                            {...props}
                        />
                    )}
                </ModalBody>
                <ModalCloseButton size="sm" />
            </ModalContent>
        </Modal>
    )
}

BonusProductViewModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    isLoading: PropTypes.bool,
    promotionId: PropTypes.string, // The promotion ID to filter promotions in PromoCallout
    onReturnToSelection: PropTypes.func // Callback to return to SelectBonusProductModal
}

export default BonusProductViewModal
