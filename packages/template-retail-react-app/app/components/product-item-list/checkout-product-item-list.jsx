/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import CheckoutProductItem from '@salesforce/retail-react-app/app/components/product-item/checkout-product-item'

const CheckoutProductItemList = ({
    productItems,
    productsByItemId,
    isProductsLoading,
    localQuantity,
    localIsGiftItems,
    isCartItemLoading,
    selectedItem,
    onItemQuantityChange,
    onRemoveItemClick,
    renderSecondaryActions,
    deliveryActions
}) => {
    return (
        <Stack spacing={4}>
            {productItems.map((productItem) => {
                const isBonusProductItem = productItem.bonusProductLineItem

                return (
                    <CheckoutProductItem
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
                        deliveryActions={deliveryActions}
                        product={{
                            ...productItem,
                            ...(productsByItemId && productsByItemId[productItem.itemId] ? productsByItemId[productItem.itemId] : {}),
                            isProductUnavailable: !isProductsLoading
                                ? !productsByItemId?.[productItem.itemId]
                                : undefined,
                            price: productItem.price,
                            quantity: localQuantity?.[productItem.itemId]
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

CheckoutProductItemList.propTypes = {
    productItems: PropTypes.array.isRequired,
    productsByItemId: PropTypes.object,
    isProductsLoading: PropTypes.bool,
    localQuantity: PropTypes.object,
    localIsGiftItems: PropTypes.object,
    isCartItemLoading: PropTypes.bool,
    selectedItem: PropTypes.object,
    onItemQuantityChange: PropTypes.func,
    onRemoveItemClick: PropTypes.func,
    renderSecondaryActions: PropTypes.func,
    deliveryActions: PropTypes.object
}

export default CheckoutProductItemList
