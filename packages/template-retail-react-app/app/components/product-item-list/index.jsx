/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

// Chakra Components
import {Stack} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import ProductItem from '@salesforce/retail-react-app/app/components/product-item'

/**
 * Component that renders a list of product items with consistent props and behavior.
 * Extracted from cart page to be reusable across different contexts.
 */
const ProductItemList = ({
    productItems = [],
    renderSecondaryActions,
    renderDeliveryActions,
    onItemQuantityChange,
    onRemoveItemClick,
    // Optional props with defaults
    productsByItemId = {},
    isProductsLoading = false,
    localQuantity = {},
    localIsGiftItems = {},
    isCartItemLoading = false,
    selectedItem = null,
    removingItemIds = [],
    // Styling options
    hideBorder = false,
    hideBottomBorder = false,
    // Pickup information
    getShipmentInfoForProduct = null
}) => {
    return (
        <Stack spacing={4}>
            {productItems.map((productItem) => {
                const isBonusProductItem = productItem.bonusProductLineItem
                // Check if this product item (regular or bonus) is being removed
                const isBeingRemoved = removingItemIds.includes(productItem.itemId)

                // Get pickup information for this product item
                const shipmentInfo = getShipmentInfoForProduct
                    ? getShipmentInfoForProduct(productItem)
                    : null
                const pickupInStore = shipmentInfo?.isPickupOrder || false

                return (
                    <ProductItem
                        key={productItem.itemId}
                        isBonusProduct={isBonusProductItem}
                        isRemoving={isBeingRemoved}
                        pickupInStore={pickupInStore}
                        containerStyles={{
                            borderX: 'none',
                            borderTop: 'none',
                            boxShadow: 'none',
                            ...(hideBottomBorder && {borderBottom: 'none'})
                        }}
                        secondaryActions={
                            renderSecondaryActions
                                ? renderSecondaryActions({
                                      productItem,
                                      isAGift: localIsGiftItems[productItem.itemId]
                                          ? localIsGiftItems[productItem.itemId]
                                          : productItem.gift
                                  })
                                : null
                        }
                        deliveryActions={
                            renderDeliveryActions ? renderDeliveryActions(productItem) : null
                        }
                        product={{
                            ...productItem,
                            ...(productsByItemId && productsByItemId[productItem.itemId]),
                            isProductUnavailable: !isProductsLoading
                                ? !productsByItemId?.[productItem.itemId]
                                : undefined,
                            price: productItem.price,
                            quantity: localQuantity[productItem.itemId]
                                ? localQuantity[productItem.itemId]
                                : productItem.quantity
                        }}
                        onItemQuantityChange={onItemQuantityChange?.bind(this, productItem)}
                        showLoading={
                            (isCartItemLoading && selectedItem?.itemId === productItem.itemId) ||
                            isBeingRemoved
                        }
                        handleRemoveItem={onRemoveItemClick}
                        hideBorder={hideBorder}
                    />
                )
            })}
        </Stack>
    )
}

ProductItemList.propTypes = {
    productItems: PropTypes.arrayOf(PropTypes.object),
    renderSecondaryActions: PropTypes.func,
    renderDeliveryActions: PropTypes.func,
    onItemQuantityChange: PropTypes.func.isRequired,
    onRemoveItemClick: PropTypes.func,
    productsByItemId: PropTypes.object,
    isProductsLoading: PropTypes.bool,
    localQuantity: PropTypes.object,
    localIsGiftItems: PropTypes.object,
    isCartItemLoading: PropTypes.bool,
    selectedItem: PropTypes.object,
    removingItemIds: PropTypes.arrayOf(PropTypes.string),
    hideBorder: PropTypes.bool,
    hideBottomBorder: PropTypes.bool,
    getShipmentInfoForProduct: PropTypes.func
}

export default ProductItemList
