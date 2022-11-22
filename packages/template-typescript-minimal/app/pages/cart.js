/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {getApiUrl, useCartAction, useCartItems} from '../hooks/useFetch'
import QuantityPicker, {useQuantity} from '../components/quantity-picker'
import {Link} from 'react-router-dom'
import {getMediaLink} from '../utils/utils'
import {debounce} from '../utils/utils'

Cart.propTypes = {}
const CartItem = ({item}) => {
    const {productDetails} = item.cartItem
    const cartAction = useCartAction()
    const {quantity, setQuantity} = useQuantity()

    React.useEffect(() => {
        if (item.cartItem.quantity) {
            setQuantity(parseInt(item.cartItem.quantity))
        }
    }, [item])

    return (
        <div>
            <div style={{display: 'flex'}}>
                <div>
                    <img
                        width={'200px'}
                        src={getMediaLink(productDetails.thumbnailImage.url)}
                        alt="cart-item-thumbnail"
                    />
                </div>
                <div>
                    <h4>{productDetails.name}</h4>
                    <div>Sku: {productDetails.sku}</div>
                    <div>
                        Total Price: ${item.cartItem.totalPrice}{' '}
                        <s>${item.cartItem.totalListPrice}</s>
                    </div>
                    <div>{item.cartItem.salesPrice} ea</div>
                    <div>
                        {Object.values(productDetails.variationAttributes).map((attr) => (
                            <div>
                                {attr.label}: {attr.value}
                            </div>
                        ))}
                    </div>

                    <div style={{marginTop: '10px'}}>
                        Quantity:
                        <QuantityPicker
                            isLoading={cartAction.isLoading}
                            quantity={quantity}
                            onDecrease={debounce(() => {
                                if (quantity === 1) return
                                cartAction.mutate({
                                    url: getApiUrl(
                                        `/carts/current/cart-items/${item.cartItem.cartItemId}`
                                    ),
                                    payload: {
                                        quantity: quantity - 1
                                    },
                                    fetchOptions: {
                                        method: 'PATCH'
                                    }
                                })
                            }, 400)}
                            onIncrease={debounce(() => {
                                cartAction.mutate({
                                    url: getApiUrl(
                                        `/carts/current/cart-items/${item.cartItem.cartItemId}`
                                    ),
                                    payload: {
                                        quantity: quantity + 1
                                    },
                                    fetchOptions: {
                                        method: 'PATCH'
                                    }
                                })
                            }, 400)}
                        />
                    </div>
                    <button
                        style={{marginTop: '10px'}}
                        disabled={cartAction.isLoading}
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
                        {cartAction.isLoading ? 'loading' : 'Remove'}
                    </button>
                </div>
            </div>
        </div>
    )
}
function Cart() {
    const {data, isLoading, error} = useCartItems()
    const cartAction = useCartAction()
    React.useEffect(() => {
        if (data?.[0]?.errorCode === 'INVALID_ID_FIELD') {
            cartAction.mutate({
                url: getApiUrl(`/carts`),
                payload: {
                    name: 'Cart',
                    type: 'Cart'
                },
                fetchOptions: {
                    method: 'POST'
                }
            })
        }
    }, [data])
    // keep loading when the cart does not exist, waiting til the cart is created
    if (isLoading || data?.[0]?.errorCode === 'INVALID_ID_FIELD') {
        return <div>Loading...</div>
    }
    if (error) {
        return <div>Error</div>
    }
    const {cartItems, cartSummary} = data

    if (cartItems?.length === 0) {
        return (
            <div>
                <button
                    onClick={() => {
                        cartAction.mutate({
                            url: getApiUrl(`/carts/current`),
                            fetchOptions: {
                                method: 'DELETE'
                            }
                        })
                    }}
                >
                    Delete a cart
                </button>
                Cart is empty
            </div>
        )
    }

    return (
        <div>
            <h3>Cart ({cartSummary?.totalProductCount} item(s))</h3>

            <div style={{display: 'flex'}}>
                <div style={{flex: 2}}>
                    {cartItems?.map((item) => (
                        <CartItem item={item} key={item.cartItem.cartItemId} />
                    ))}
                </div>
                <div style={{flex: 1}}>
                    <h3>Cart Summary</h3>
                    <div>Subtotal: ${cartSummary?.totalProductAmountAfterAdjustments}</div>
                    <div>Shipping: TBD</div>
                    <div>Tax: {cartSummary?.totalTaxAmount}</div>
                    <h3>Total {cartSummary?.totalProductAmount}</h3>
                    <Link to={'/checkout'}>Checkout</Link>
                </div>
            </div>
        </div>
    )
}

export default Cart
