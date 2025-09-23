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
import {useIntl} from 'react-intl'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {getRemainingAvailableBonusProductsForProduct} from '@salesforce/retail-react-app/app/utils/bonus-product'
import {processProductsForBonusCart} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'
import {useBonusProductCounts} from '@salesforce/retail-react-app/app/utils/bonus-product/hooks'
import {
    createGetRemainingBonusQuantity,
    checkForRemainingBonusProducts
} from '@salesforce/retail-react-app/app/components/bonus-product-view-modal/utils'
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
    bonusDiscountLineItemId,
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

    const productViewModalData = useProductViewModal(safeProduct)
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
    const {data: basket} = useCurrentBasket()
    const navigate = useNavigation()

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
                {productName: productViewModalData?.product?.name}
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
        [intl]
    )

    // Create getRemainingBonusQuantity function using the factory
    const getRemainingBonusQuantity = useMemo(
        () =>
            createGetRemainingBonusQuantity(
                basket,
                product,
                getRemainingAvailableBonusProductsForProduct
            ),
        [basket, product]
    )

    // Custom addToCart handler for bonus products that includes bonusDiscountLineItemId
    const handleAddToCart = useCallback(
        async (products) => {
            try {
                // Process products using the extracted helper function
                const productItems = processProductsForBonusCart(
                    products,
                    basket,
                    promotionId,
                    product,
                    getRemainingBonusQuantity
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

                    // Check if there are still remaining bonus products available
                    const hasRemainingBonusProducts = checkForRemainingBonusProducts(updatedBasket)

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
            getRemainingBonusQuantity,
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

    // Clean product data but preserve variation attributes for size/color selectors
    const productToRender = useMemo(() => {
        const baseProduct = productViewModalData.product || safeProduct
        return {
            ...baseProduct,
            variationAttributes: baseProduct.variationAttributes,
            variants: baseProduct.variants,
            variationParams: baseProduct.variationParams,
            selectedVariationAttributes: baseProduct.selectedVariationAttributes,
            type: baseProduct.type,
            // Ensure proper inventory and quantity defaults for bonus products
            inventory: {
                ...baseProduct.inventory,
                orderable: true,
                stockLevel: 999 // High stock level for bonus products
            },
            minOrderQuantity: 1,
            stepQuantity: 1,
            // Ensure the product is orderable
            orderable: true,
            // Add review data for display
            rating: baseProduct.rating,
            reviewCount: baseProduct.reviewCount
        }
    }, [productViewModalData.product, safeProduct])

    // Calculate max order quantity for UI
    const maxOrderQuantity = getRemainingBonusQuantity()

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
                    {productViewModalData.isFetching && !productViewModalData.product ? (
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
    bonusDiscountLineItemId: PropTypes.string, // The 'id' from bonusDiscountLineItems
    promotionId: PropTypes.string, // The promotion ID to filter promotions in PromoCallout
    onReturnToSelection: PropTypes.func // Callback to return to SelectBonusProductModal
}

export default BonusProductViewModal
