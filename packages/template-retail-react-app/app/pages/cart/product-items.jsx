/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {Stack, useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import ProductItem from '@salesforce/retail-react-app/app/components/product-item/index'
import CartSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'
import {
    API_ERROR_MESSAGE,
    TOAST_MESSAGE_REMOVED_ITEM_FROM_CART
} from '@salesforce/retail-react-app/app/constants'
import debounce from 'lodash/debounce'
import {useProductItems} from '@salesforce/retail-react-app/app/pages/cart/use-product-items'
import {useAssignDefaultShippingMethod} from '@salesforce/retail-react-app/app/pages/cart/use-assign-default-shipping-method'
import {useAddToWishlist} from '@salesforce/retail-react-app/app/pages/cart/use-add-to-wishlist'
import {useShowGenericError} from '@salesforce/retail-react-app/app/pages/cart/use-show-generic-error'
import {useChangeItemQuantity} from '@salesforce/retail-react-app/app/pages/cart/use-change-item-quantity'

const ProductItems = () => {
    const {currentBasket, productItems} = useProductItems()
    const {data: basket} = currentBasket
    const {data: products} = productItems

    /*****************Basket Mutation************************/
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    /*****************Basket Mutation************************/

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const [isCartItemLoading, setCartItemLoading] = useState(false)

    const {isOpen, onOpen, onClose} = useDisclosure()
    const {formatMessage} = useIntl()
    const toast = useToast()
    const modalProps = useDisclosure()

    useAssignDefaultShippingMethod(basket)
    const handleAddToWishlist = useAddToWishlist()
    const showError = useShowGenericError()

    const _changeItemQuantity = useChangeItemQuantity({
        basket,
        setLocalQuantity,
        setCartItemLoading
    })
    const changeItemQuantity = debounce(_changeItemQuantity, 750)

    const handleChangeItemQuantity = async (product, value) => {
        const {stockLevel} = products[product.productId].inventory

        // Handle removing of the items when 0 is selected.
        if (value === 0) {
            // Flush last call to keep ui in sync with data.
            changeItemQuantity.flush()

            // Set the selected item to the current product to the modal acts on it.
            setSelectedItem(product)

            // Show the modal.
            modalProps.onOpen()

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
    /***************************** Update quantity **************************/

    /***************************** Remove Item from basket **************************/
    // TODO: useItemRemovalHandler()
    const handleRemoveItem = async (product) => {
        setSelectedItem(product)
        setCartItemLoading(true)
        await removeItemFromBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket.basketId, itemId: product.itemId}
            },
            {
                onSettled: () => {
                    // reset the state
                    setCartItemLoading(false)
                    setSelectedItem(undefined)
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {quantity: 1}),
                        status: 'success'
                    })
                },
                onError: () => {
                    showError()
                }
            }
        )
    }

    return (
        <Stack spacing={4}>
            {basket.productItems?.map((productItem, idx) => {
                return (
                    <ProductItem
                        key={productItem.productId}
                        index={idx}
                        secondaryActions={
                            <CartSecondaryButtonGroup
                                onAddToWishlistClick={handleAddToWishlist}
                                onEditClick={(product) => {
                                    setSelectedItem(product)
                                    onOpen()
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
                )
            })}
        </Stack>
    )
}

export default ProductItems
