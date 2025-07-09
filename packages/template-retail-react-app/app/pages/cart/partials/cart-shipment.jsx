/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import OrderTypeDisplay from '@salesforce/retail-react-app/app/pages/cart/partials/order-type-display'
import BonusProductsTitle from '@salesforce/retail-react-app/app/pages/cart/partials/bonus-products-title'
import ProductItemList from '@salesforce/retail-react-app/app/components/product-item-list'

// Constants
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'

const CartShipment = ({
    isPickupOrder,
    store,
    categorizedProducts,
    productsByItemId,
    isProductsLoading,
    localQuantity,
    localIsGiftItems,
    isCartItemLoading,
    selectedItem,
    onItemQuantityChange,
    onRemoveItemClick,
    renderSecondaryActions,
    deliveryActions,
    totalItemsInCart
}) => {
    const itemsInShipment =
        categorizedProducts.regularProducts.length + categorizedProducts.bonusProducts.length

    return (
        <Box
            bg="white"
            borderLeft="1px solid"
            borderRight="1px solid"
            borderBottom="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            borderTopRadius="none"
            overflow="hidden"
            boxShadow="sm"
            p={4}
        >
            {/* Order Type Display */}
            {STORE_LOCATOR_IS_ENABLED && (
                <OrderTypeDisplay
                    isPickupOrder={isPickupOrder}
                    store={store}
                    itemsInShipment={itemsInShipment}
                    totalItemsInCart={totalItemsInCart}
                />
            )}

            {/* Regular Products */}
            <ProductItemList
                productItems={categorizedProducts.regularProducts}
                productsByItemId={productsByItemId}
                isProductsLoading={isProductsLoading}
                localQuantity={localQuantity}
                localIsGiftItems={localIsGiftItems}
                isCartItemLoading={isCartItemLoading}
                selectedItem={selectedItem}
                onItemQuantityChange={onItemQuantityChange}
                onRemoveItemClick={onRemoveItemClick}
                renderSecondaryActions={renderSecondaryActions}
                deliveryActions={deliveryActions}
            />

            {/* Bonus Products */}
            {categorizedProducts.bonusProducts.length > 0 && (
                <>
                    <BonusProductsTitle />
                    <ProductItemList
                        productItems={categorizedProducts.bonusProducts}
                        productsByItemId={productsByItemId}
                        isProductsLoading={isProductsLoading}
                        localQuantity={localQuantity}
                        localIsGiftItems={localIsGiftItems}
                        isCartItemLoading={isCartItemLoading}
                        selectedItem={selectedItem}
                        onItemQuantityChange={onItemQuantityChange}
                        onRemoveItemClick={onRemoveItemClick}
                        renderSecondaryActions={renderSecondaryActions}
                        deliveryActions={deliveryActions}
                    />
                </>
            )}
        </Box>
    )
}

CartShipment.propTypes = {
    isPickupOrder: PropTypes.bool,
    store: PropTypes.object,
    categorizedProducts: PropTypes.shape({
        regularProducts: PropTypes.arrayOf(PropTypes.object),
        bonusProducts: PropTypes.arrayOf(PropTypes.object)
    }).isRequired,
    productsByItemId: PropTypes.object.isRequired,
    isProductsLoading: PropTypes.bool,
    localQuantity: PropTypes.object,
    localIsGiftItems: PropTypes.object,
    isCartItemLoading: PropTypes.object,
    selectedItem: PropTypes.object,
    onItemQuantityChange: PropTypes.func.isRequired,
    onRemoveItemClick: PropTypes.func.isRequired,
    renderSecondaryActions: PropTypes.func,
    deliveryActions: PropTypes.object,
    totalItemsInCart: PropTypes.number.isRequired
}

export default CartShipment
