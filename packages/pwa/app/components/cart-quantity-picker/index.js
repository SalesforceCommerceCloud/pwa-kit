/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {HStack, Button, Input, useDisclosure} from '@chakra-ui/react'
import {useProduct} from '../../hooks'
import ConfirmationModal from '../confirmation-modal'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from '../../pages/cart/partials/cart-secondary-button-group'

const CartQuantityPicker = ({product, handleRemoveItem, onItemQuantityChange}) => {
    const {stepQuantity} = useProduct(product)
    const [updatedQuantity, setUpdatedQuantity] = useState(product.quantity)
    const modalProps = useDisclosure()

    const showRemoveItemConfirmation = () => {
        modalProps.onOpen()
    }
    return (
        <HStack maxW="80%">
            <Button
                data-testid="cart-quantity-decrement"
                variant="outline"
                onClick={() => {
                    if (product.quantity - stepQuantity === 0) {
                        showRemoveItemConfirmation()
                    } else {
                        setUpdatedQuantity(product.quantity - stepQuantity)
                        onItemQuantityChange(product.quantity - stepQuantity)
                    }
                }}
            >
                -
            </Button>
            <form
                onSubmit={(e) => {
                    if (parseInt(updatedQuantity)) {
                        onItemQuantityChange(updatedQuantity)
                    } else if (updatedQuantity === '0') {
                        setUpdatedQuantity(0)
                        showRemoveItemConfirmation()
                    }
                    e.preventDefault()
                    document.activeElement.blur()
                }}
            >
                <Input
                    type="numeric"
                    data-testid="cart-quantity"
                    width={11}
                    onBlur={(e) => {
                        const quantity = e.target.value
                        if (parseInt(quantity)) {
                            onItemQuantityChange(quantity)
                        } else {
                            if (quantity === '0') {
                                showRemoveItemConfirmation()
                            } else {
                                setUpdatedQuantity(product.quantity)
                                onItemQuantityChange(product.quantity)
                            }
                        }
                    }}
                    onChange={(e) => {
                        const quantity = e.target.value
                        if (parseInt(quantity) >= 0 || quantity === '') {
                            setUpdatedQuantity(quantity)
                        }
                    }}
                    value={updatedQuantity}
                />
            </form>
            <Button
                data-testid="cart-quantity-increment"
                variant="outline"
                onClick={() => {
                    setUpdatedQuantity(product.quantity + stepQuantity)
                    onItemQuantityChange(product.quantity + stepQuantity)
                }}
            >
                +
            </Button>
            <ConfirmationModal
                {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG}
                onPrimaryAction={() => handleRemoveItem(product)}
                onAlternateAction={() => setUpdatedQuantity(product.quantity)}
                {...modalProps}
            />
        </HStack>
    )
}

CartQuantityPicker.propTypes = {
    product: PropTypes.object,
    onItemQuantityChange: PropTypes.func,
    handleRemoveItem: PropTypes.func
}

export default CartQuantityPicker
