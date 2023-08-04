/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {Box, Stack, useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import ProductItem from '@salesforce/retail-react-app/app/components/product-item/index'
import CartSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'
import debounce from 'lodash/debounce'
import {useProductItems} from '@salesforce/retail-react-app/app/pages/cart/use-product-items'
import {useAssignDefaultShippingMethod} from '@salesforce/retail-react-app/app/pages/cart/use-assign-default-shipping-method'
import {useAddToWishlist} from '@salesforce/retail-react-app/app/pages/cart/use-add-to-wishlist'
import {useChangeItemQuantity} from '@salesforce/retail-react-app/app/pages/cart/use-change-item-quantity'
import {useRemoveItem} from '@salesforce/retail-react-app/app/pages/cart/use-remove-item'
import {useUpdateCart} from '@salesforce/retail-react-app/app/pages/cart/use-update-cart'
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal/index'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'

const ProductItems = () => {
    const {currentBasket, productItems} = useProductItems()
    const {data: basket} = currentBasket
    const {data: products} = productItems

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const [isCartItemLoading, setCartItemLoading] = useState(false)

    const discloseProductViewModal = useDisclosure()
    const discloseConfirmationModal = useDisclosure()

    // TODO: return a function
    useAssignDefaultShippingMethod(basket)
    const handleAddToWishlist = useAddToWishlist()
    const handleRemoveItem = useRemoveItem({basket, setCartItemLoading})

    const _changeItemQuantity = useChangeItemQuantity({
        basket,
        setLocalQuantity,
        setCartItemLoading
    })
    const changeItemQuantity = debounce(_changeItemQuantity, 750)

    const handleUpdateCart = useUpdateCart({basket, setCartItemLoading, setLocalQuantity})

    const handleChangeItemQuantity = async (product, value) => {
        const {stockLevel} = products[product.productId].inventory

        // Handle removing of the items when 0 is selected.
        if (value === 0) {
            // Flush last call to keep ui in sync with data.
            changeItemQuantity.flush()

            // Set the selected item to the current product to the modal acts on it.
            setSelectedItem(product)

            // Show the modal.
            discloseConfirmationModal.onOpen()

            // Return false as 0 isn't valid section.
            return false
        }

        // Cancel any pending handlers.
        changeItemQuantity.cancel()

        // Allow use to selected values above the inventory.
        if (value > stockLevel || value === product.quantity) {
            return true
        }

        // Take action.
        changeItemQuantity(value, product)

        return true
    }

    return (
        <Stack spacing={4}>
            {basket.productItems?.map((productItem, idx) => {
                return (
                    <>
                        <ProductItem
                            key={productItem.productId}
                            index={idx}
                            secondaryActions={
                                <CartSecondaryButtonGroup
                                    onAddToWishlistClick={handleAddToWishlist}
                                    onEditClick={(product) => {
                                        setSelectedItem(product)
                                        discloseProductViewModal.onOpen()
                                    }}
                                    onRemoveItemClick={handleRemoveItem}
                                />
                            }
                            product={{
                                ...productItem,
                                ...(products && products[productItem.productId]),
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

                        <Box>
                            {discloseProductViewModal.isOpen && (
                                <ProductViewModal
                                    isOpen={discloseProductViewModal.isOpen}
                                    onOpen={discloseProductViewModal.onOpen}
                                    onClose={discloseProductViewModal.onClose}
                                    product={selectedItem}
                                    updateCart={(variant, quantity) => {
                                        // close the modal before handle the change
                                        discloseProductViewModal.onClose()
                                        handleUpdateCart(variant, quantity)
                                    }}
                                />
                            )}

                            <ConfirmationModal
                                {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG}
                                onPrimaryAction={() => {
                                    handleRemoveItem(selectedItem)
                                }}
                                onAlternateAction={() => {}}
                                {...discloseConfirmationModal}
                            />
                        </Box>
                    </>
                )
            })}
        </Stack>
    )
}

export default ProductItems
