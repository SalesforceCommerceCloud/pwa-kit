/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@chakra-ui/react'
import ProductItem from '../../../components/product-item'
import CartSecondaryButtonGroup from './cart-secondary-button-group'

/**
 * Cart product list component that renders all items in the cart
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
    return (
        <Stack gap={4}>
            {basket.productItems?.map((productItem, idx) => {
                return (
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
                                : productItem.quantity
                        }}
                        onItemQuantityChange={handleChangeItemQuantity.bind(this, productItem)}
                        showLoading={
                            isCartItemLoading && selectedItem?.itemId === productItem.itemId
                        }
                        handleRemoveItem={handleRemoveItem}
                    />
                )
            })}
        </Stack>
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
                quantity: PropTypes.number
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
