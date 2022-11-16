/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {getApiUrl, useCartAction, useCartItems} from '../hooks/useFetch'
import QuantityPicker from '../components/quantity-picker'
import {Link} from 'react-router-dom'

Cart.propTypes = {}
const CartItem = ({item}) => {
    const {productDetails} = item.cartItem
    const cartAction = useCartAction()

    return (
        <div>
            <div style={{display: 'flex'}}>
                <div>
                    <img
                        width={'200px'}
                        src={productDetails.thumbnailImage.url}
                        alt="cart-item-thumbnail"
                    />
                </div>
                <div>
                    <h4>{productDetails.name}</h4>
                    <div>Sku {productDetails.sku}</div>
                    <div>
                        Total Price: ${item.cartItem.totalPrice}{' '}
                        <s>${item.cartItem.totalListPrice}</s>
                    </div>
                    <div>{item.cartItem.salesPrice} ea</div>

                    <div>
                        Quantity:
                        <QuantityPicker quantity={item.cartItem.quantity} />
                    </div>
                    <button
                        style={{marginTop: '10px'}}
                        onClick={() => {
                            cartAction.mutate({
                                url: getApiUrl(
                                    `/carts/current/cart-items/${item.cartItem.cartItemId}`
                                ),
                                fetchOptions: {
                                    method: 'DELETE'
                                }
                            })
                        }}
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    )
}
function Cart() {
    const {data, isLoading} = useCartItems()

    if (isLoading) {
        return <div>Loading...</div>
    }
    const {cartItems, cartSummary} = data
    if (cartItems.length === 0) {
        return <div>Cart is empty</div>
    }

    return (
        <div>
            <h3>Cart ({cartSummary.totalProductCount} item(s))</h3>
            <div style={{display: 'flex'}}>
                <div style={{flex: 2}}>
                    {cartItems.map((item) => (
                        <CartItem item={item} key={item.cartItem.cartItemId} />
                    ))}
                </div>
                <div style={{flex: 1}}>
                    <h3>Cart Summary</h3>
                    <div>Subtotal: ${cartSummary.totalProductAmountAfterAdjustments}</div>
                    <div>Shipping: TBD</div>
                    <div>Tax: {cartSummary.totalTaxAmount}</div>
                    <h3>Total {cartSummary.totalProductAmount}</h3>
                    <Link to={'/checkout'}>Checkout</Link>
                </div>
            </div>
        </div>
    )
}

export default Cart
