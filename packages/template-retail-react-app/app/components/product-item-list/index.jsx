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
    onItemQuantityChange,
    onRemoveItemClick,
    // Optional props with defaults
    productsByItemId = {},
    isProductsLoading = false,
    localQuantity = {},
    localIsGiftItems = {},
    isCartItemLoading = false,
    selectedItem = null
}) => {
    return (
        <Stack spacing={4}>
            {productItems.map((productItem) => {
                const isBonusProductItem = productItem.bonusProductLineItem

                return (
                    <ProductItem
                        key={productItem.itemId}
                        isBonusProduct={isBonusProductItem}
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
                            isCartItemLoading && selectedItem?.itemId === productItem.itemId
                        }
                        handleRemoveItem={onRemoveItemClick}
                    />
                )
            })}
        </Stack>
    )
}

ProductItemList.propTypes = {
    productItems: PropTypes.arrayOf(PropTypes.object),
    renderSecondaryActions: PropTypes.func,
    onItemQuantityChange: PropTypes.func.isRequired,
    onRemoveItemClick: PropTypes.func,
    productsByItemId: PropTypes.object,
    isProductsLoading: PropTypes.bool,
    localQuantity: PropTypes.object,
    localIsGiftItems: PropTypes.object,
    isCartItemLoading: PropTypes.bool,
    selectedItem: PropTypes.object
}

export default ProductItemList
