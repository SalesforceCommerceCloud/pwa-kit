/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo, useCallback} from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@chakra-ui/react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import ProductItem from '../../../components/product-item'
import CartSecondaryButtonGroup from './cart-secondary-button-group'
import CartProductListWithGroupedBonusProducts from './cart-product-list-with-grouped-bonus-products'
import SelectBonusProductsCard from './select-bonus-products-card'
import {useBasketProductsWithPromotions} from '../../../utils/bonus-product-utils'

// Configurable version with bonus product grouping support

/**
 * Cart product list component that renders all items in the cart
 *
 * Behavior is controlled by the config value `pages.cart.groupBonusProductsWithQualifyingProduct`:
 * - true (default): Groups bonus products with their qualifying products in enhanced cards
 * - false: Renders all products in a simple flat list without grouping
 *
 * @param {Object} props - Component props
 * @param {Object} props.basket - The current basket data
 * @param {Object} props.productsByItemId - Products organized by item ID
 * @param {Object} props.localQuantity - Local quantity state
 * @param {Object} props.localIsGiftItems - Local gift items state
 * @param {boolean} props.isProductsPending - Whether products are loading
 * @param {boolean} props.isCartItemLoading - Whether cart item is loading
 * @param {Object} props.selectedItem - Currently selected item
 * @param {Function} props.handleChangeItemQuantity - Function to handle quantity changes
 * @param {Function} props.handleIsAGiftChange - Function to handle gift changes
 * @param {Function} props.handleAddToWishlist - Function to handle wishlist additions
 * @param {Function} props.handleEditClick - Function to handle edit clicks
 * @param {Function} props.handleRemoveItem - Function to handle item removal
 * @returns {JSX.Element} The cart product list component
 */
const CartProductList = ({
    basket,
    productsByItemId,
    localQuantity,
    localIsGiftItems,
    isProductsPending,
    isCartItemLoading,
    selectedItem,
    handleChangeItemQuantity,
    handleIsAGiftChange,
    handleAddToWishlist,
    handleEditClick,
    handleRemoveItem
}) => {
    // All hooks MUST be called before any early returns

    // Get configuration for bonus product grouping
    const config = getConfig()
    const groupBonusProductsWithQualifyingProduct =
        config.pages?.cart?.groupBonusProductsWithQualifyingProduct ?? true

    // Fetch products with promotion data for enhanced bonus product utilities
    const {data: productsWithPromotions, isLoading: isPromotionDataLoading} =
        useBasketProductsWithPromotions(basket)

    // Helper function to get promotion callout message as plain text
    const getPromotionCalloutText = (product, promotionId) => {
        if (!product?.productPromotions || !promotionId) return ''

        const promo = product.productPromotions.find((p) => p.promotionId === promotionId)
        if (!promo?.calloutMsg) return ''

        // Strip HTML tags and return plain text
        return promo.calloutMsg.replace(/<[^>]*>/g, '')
    }

    // Helper function removed - debug logging no longer needed
    // Helper function to render a product item (memoized for stability)
    const renderProductItem = useCallback(
        (productItem, idx, options = {}) => (
            <ProductItem
                key={productItem.itemId}
                index={idx}
                secondaryActions={
                    <CartSecondaryButtonGroup
                        isAGift={
                            localIsGiftItems[productItem.itemId]
                                ? localIsGiftItems[productItem.itemId]
                                : productItem.gift
                        }
                        onIsAGiftChange={handleIsAGiftChange}
                        onAddToWishlistClick={handleAddToWishlist}
                        onEditClick={(product) => {
                            handleEditClick(product)
                        }}
                        onRemoveItemClick={handleRemoveItem}
                    />
                }
                product={{
                    ...productItem,
                    ...(productsByItemId && productsByItemId[productItem.itemId]),
                    isProductUnavailable: !isProductsPending
                        ? !productsByItemId?.[productItem.itemId]
                        : undefined,
                    price: productItem.price,
                    quantity: localQuantity[productItem.itemId]
                        ? localQuantity[productItem.itemId]
                        : productItem.quantity,
                    // Ensure we have a fallback name if product data is missing
                    name:
                        productsByItemId?.[productItem.itemId]?.name ||
                        productItem.productId ||
                        'Unknown Product'
                }}
                onItemQuantityChange={(quantity) => handleChangeItemQuantity(productItem, quantity)}
                showLoading={isCartItemLoading && selectedItem?.itemId === productItem.itemId}
                handleRemoveItem={handleRemoveItem}
                showQuantitySelector={options.showQuantitySelector !== false} // Default to true, allow override
                hideBorder={options.hideBorder === true} // Allow hiding border for aggregated cards
            />
        ),
        [
            productsByItemId,
            localQuantity,
            localIsGiftItems,
            isProductsPending,
            isCartItemLoading,
            selectedItem,
            handleChangeItemQuantity,
            handleIsAGiftChange,
            handleAddToWishlist,
            handleEditClick,
            handleRemoveItem
        ]
    )

    // Separate products into bonus and non-bonus categories (memoized to prevent re-computation)
    const nonBonusProducts = useMemo(
        () => basket.productItems?.filter((item) => !item.bonusProductLineItem) || [],
        [basket.productItems]
    )

    // Handler for select bonus products button click
    const handleSelectBonusProducts = useCallback(() => {
        // TODO: Implement modal opening logic here
    }, [])

    // Early return for empty basket
    if (!basket.productItems || basket.productItems.length === 0) {
        return <Stack gap={4}></Stack>
    }

    // Early return if product data is still loading and we don't have product details
    if (isProductsPending || !productsByItemId) {
        return <Stack gap={4}></Stack>
    }

    // If there are no qualifying products, use original simple layout
    if (nonBonusProducts.length === 0) {
        return (
            <Stack gap={4}>
                {basket.productItems?.map((productItem, idx) =>
                    renderProductItem(productItem, idx)
                )}
            </Stack>
        )
    }

    // If bonus product grouping is disabled, use simple layout with individual bonus product cards
    if (!groupBonusProductsWithQualifyingProduct) {
        return (
            <Stack gap={4}>
                {/* Render all cart items in simple layout */}
                {basket.productItems?.map((productItem, idx) =>
                    renderProductItem(productItem, idx)
                )}

                {/* Render SelectBonusProductsCard for each bonusDiscountLineItem */}
                {basket.bonusDiscountLineItems?.map((bonusDiscountLineItem) => {
                    // Find a qualifying product that triggered this bonus opportunity
                    // Look for products with price adjustments matching this promotion
                    const qualifyingProduct = basket.productItems?.find(
                        (item) =>
                            !item.bonusProductLineItem &&
                            item.priceAdjustments?.some(
                                (adj) => adj.promotionId === bonusDiscountLineItem.promotionId
                            )
                    ) || {productId: bonusDiscountLineItem.promotionId} // Fallback to promotionId if no qualifying product found

                    return (
                        <SelectBonusProductsCard
                            key={bonusDiscountLineItem.id}
                            qualifyingProduct={qualifyingProduct}
                            basket={basket}
                            productsWithPromotions={productsWithPromotions}
                            remainingBonusProductsData={{
                                bonusItems: [],
                                aggregatedMaxBonusItems: 0,
                                aggregatedSelectedItems: 0
                            }} // Not used when bonusDiscountLineItem is provided
                            isEligible={true}
                            getPromotionCalloutText={getPromotionCalloutText}
                            onSelectBonusProducts={handleSelectBonusProducts}
                            bonusDiscountLineItem={bonusDiscountLineItem}
                        />
                    )
                })}
            </Stack>
        )
    }

    return (
        <CartProductListWithGroupedBonusProducts
            nonBonusProducts={nonBonusProducts}
            basket={basket}
            productsWithPromotions={productsWithPromotions}
            isPromotionDataLoading={isPromotionDataLoading}
            renderProductItem={renderProductItem}
            getPromotionCalloutText={getPromotionCalloutText}
            onSelectBonusProducts={handleSelectBonusProducts}
        />
    )
}

CartProductList.propTypes = {
    basket: PropTypes.shape({
        productItems: PropTypes.arrayOf(
            PropTypes.shape({
                itemId: PropTypes.string,
                productId: PropTypes.string,
                gift: PropTypes.bool,
                price: PropTypes.number,
                quantity: PropTypes.number,
                bonusProductLineItem: PropTypes.bool
            })
        ),
        bonusDiscountLineItems: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string,
                promotionId: PropTypes.string,
                maxBonusItems: PropTypes.number
            })
        )
    }).isRequired,
    productsByItemId: PropTypes.object,
    localQuantity: PropTypes.object.isRequired,
    localIsGiftItems: PropTypes.object.isRequired,
    isProductsPending: PropTypes.bool.isRequired,
    isCartItemLoading: PropTypes.bool.isRequired,
    selectedItem: PropTypes.shape({
        itemId: PropTypes.string
    }),
    handleChangeItemQuantity: PropTypes.func.isRequired,
    handleIsAGiftChange: PropTypes.func.isRequired,
    handleAddToWishlist: PropTypes.func.isRequired,
    handleEditClick: PropTypes.func.isRequired,
    handleRemoveItem: PropTypes.func.isRequired
}

export default CartProductList
