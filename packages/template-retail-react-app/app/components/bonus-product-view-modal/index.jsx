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
    ModalBody,
    ModalCloseButton,
    Button,
    Box,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {useProductViewModal} from '@salesforce/retail-react-app/app/hooks/use-product-view-modal'
import {useIntl} from 'react-intl'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    findAvailableBonusDiscountLineItemId,
    getRemainingAvailableBonusProductsForProduct
} from '@salesforce/retail-react-app/app/utils/bonus-product-utils'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useLocation} from 'react-router-dom'
import {productViewModalTheme} from '@salesforce/retail-react-app/app/theme/components/project/product-view-modal'

/**
 * A Modal that contains Bonus Product View
 */
const BonusProductViewModal = ({
    product,
    isOpen,
    onClose,
    bonusDiscountLineItemId,
    promotionId,
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
    const location = useLocation()

    const intl = useIntl()
    const {formatMessage} = intl

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
            })
        }),
        [intl]
    )

    // Determine context for navigation behavior
    const isFromAddToCartModal = location.pathname !== '/cart'

    // Helper function to calculate max order quantity
    const getMaxOrderQuantity = () => {
        if (basket && product) {
            const bonusData = getRemainingAvailableBonusProductsForProduct(basket, product.id, {
                [product.id]: product
            })
            // Return remaining capacity: total allowed - already in cart
            return bonusData.aggregatedMaxBonusItems - bonusData.aggregatedSelectedItems
        }
        return null
    }

    // Custom addToCart handler for bonus products that includes bonusDiscountLineItemId
    const handleAddToCart = useCallback(
        async (products) => {
            try {
                const productItems = []

                // Process each item in the selection
                for (const {variant, quantity} of products) {
                    // Default quantity to 1 if not provided or invalid
                    let finalQuantity = quantity && quantity > 0 ? quantity : 1

                    // Cap quantity to remaining capacity (defensive programming)
                    const maxAllowed = getMaxOrderQuantity()
                    if (maxAllowed && finalQuantity > maxAllowed) {
                        finalQuantity = maxAllowed
                    }

                    // Find the first available bonus discount line item with capacity
                    const availableBonusDiscountLineItemId = findAvailableBonusDiscountLineItemId(
                        basket,
                        promotionId,
                        finalQuantity,
                        bonusDiscountLineItemId // fallback to originally passed id
                    )

                    if (!availableBonusDiscountLineItemId) {
                        console.warn('No available bonus discount line item found')
                        continue // Skip this item but process others
                    }

                    productItems.push({
                        productId: variant?.productId || product?.productId || product?.id,
                        price: variant?.price || product?.price,
                        quantity: parseInt(finalQuantity, 10),
                        bonusDiscountLineItemId: availableBonusDiscountLineItemId
                    })
                }

                if (productItems.length === 0) {
                    return null
                }

                const result = await addItemToNewOrExistingBasket(productItems)

                // Navigate to cart page after successful add to cart
                if (result) {
                    // Close modal immediately and navigate with proper delay
                    onClose()
                    // Always use a delay to ensure modal closes cleanly
                    setTimeout(() => {
                        navigate('/cart', 'push')
                    }, 200)
                }

                return result
            } catch (error) {
                console.error('Error adding bonus product to cart:', error)
                return null
            }
        },
        [
            addItemToNewOrExistingBasket,
            product,
            bonusDiscountLineItemId,
            promotionId,
            basket,
            onClose,
            navigate,
            isFromAddToCartModal
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

    const customButtons = useMemo(
        () => [
            <Button key="view-cart" variant="outline" onClick={handleViewCart}>
                {messages.viewCart}
            </Button>
        ],
        [messages.viewCart, handleViewCart]
    )

    // Aggressively clean product data to prevent SwatchGroup errors while preserving essential fields
    const productToRender = useMemo(() => {
        const baseProduct = productViewModalData.product || safeProduct
        return {
            ...baseProduct,
            variationAttributes: [], // Force empty array
            variants: [], // Also remove variants to be safe
            variationParams: {},
            selectedVariationAttributes: {},
            type: {...baseProduct.type, variant: false, master: false},
            // Ensure proper inventory and quantity defaults for bonus products
            inventory: {
                ...baseProduct.inventory,
                orderable: true,
                stockLevel: 999 // High stock level for bonus products
            },
            minOrderQuantity: 1,
            stepQuantity: 1,
            // Ensure the product is orderable
            orderable: true
        }
    }, [productViewModalData.product, safeProduct])

    // Calculate max order quantity for UI
    const maxOrderQuantity = getMaxOrderQuantity()

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={productViewModalTheme.modal.size}
            closeOnOverlayClick={true}
            closeOnEsc={true}
            motionPreset="slideInBottom"
            preserveScrollBarGap={true}
        >
            <ModalOverlay bg="blackAlpha.600" />
            <ModalContent
                data-testid="bonus-product-view-modal"
                aria-label={messages.modalLabel}
                margin="0"
                borderRadius={{base: 'none', md: 'base'}}
                bg="white"
                maxHeight="85vh"
                overflowY="auto"
                boxShadow="xl"
            >
                <ModalBody bg="white" p={6} pb={8} mt={6}>
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
    promotionId: PropTypes.string // The promotion ID to filter promotions in PromoCallout
}

export default BonusProductViewModal
