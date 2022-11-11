/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {addItemToCart, useCart, useProduct, useProductPrice} from '../hooks/useFetch'
import QuantityPicker, {useQuantity} from '../components/quantity-picker'
import {useMutation} from '@tanstack/react-query'
ProductDetail.propTypes = {}

function ProductDetail(props) {
    const {quantity, onDecrease, onIncrease} = useQuantity()

    const productId = '01tRO000000YoTZYA0'
    const {data: productDetail, isLoading, error} = useProduct(productId)
    const {data: productPrice, isLoading: isProductPriceLoading} = useProductPrice(productId)
    const addItemToCartAction = addItemToCart()
    if (isLoading || isProductPriceLoading) {
        return <div>Loading a product....</div>
    }
    if (error) {
        return <h3 style={{color: 'red'}}>Something is wrong</h3>
    }
    const {defaultImage, fields} = productDetail
    console.log('productDetail', productDetail)
    console.log('productPrice', productPrice)

    const handleAddToCart = () => {
        if (quantity === 0) return
        const item = {
            productId,
            quantity,
            type: 'Product'
        }
        addItemToCartAction.mutate(item)
    }
    return (
        <div>
            <div style={{display: 'flex'}}>
                <img style={{flex: 1}} src={defaultImage.url} alt="big-thumbnail" />
                <div style={{flex: 1}}>
                    <h3>{fields.Name}</h3>
                    <h4>{`${productPrice?.listPrice} ${productPrice?.currencyIsoCode}`}</h4>
                    <div>{fields.Description}</div>
                    <QuantityPicker
                        quantity={quantity}
                        onDecrease={onDecrease}
                        onIncrease={onIncrease}
                    />
                    <button onClick={handleAddToCart}>Add to cart</button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetail
