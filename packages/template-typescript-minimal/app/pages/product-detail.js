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
import {useParams} from 'react-router-dom'
ProductDetail.propTypes = {}

function ProductDetail(props) {
    const {quantity, onDecrease, onIncrease} = useQuantity()

    const {productId} = useParams()
    const {data: productDetail, isLoading, error} = useProduct(productId, {
        select: (data) => {
            const {variationInfo} = data
            return {
                ...data
            }
        }
    })
    const {data: productPrice, isLoading: isProductPriceLoading} = useProductPrice(productId)
    const addItemToCartAction = addItemToCart()
    if (isLoading || isProductPriceLoading) {
        return <div>Loading a product....</div>
    }
    if (error) {
        return <h3 style={{color: 'red'}}>Something is wrong</h3>
    }
    const {defaultImage, fields} = productDetail

    const handleAddToCart = () => {
        if (quantity === 0) return
        const item = {
            productId,
            quantity,
            type: 'Product'
        }
        addItemToCartAction.mutate(item)
    }
    const bigThumbnail = productDetail.mediaGroups.find((media) => media.usageType === 'Listing')
    const imgSrc = bigThumbnail.mediaItems[0].url.startsWith('/cms/')
        ? new URL(
              `https://trialorgsforu-24b.test1.lightning.pc-rnd.force.com${productDetail.defaultImage.url}`
          )
        : productDetail.defaultImage.url
    const smallThumbnails = productDetail.mediaGroups.find(
        (media) => media.usageType === 'Standard'
    )

    const {variationInfo} = productDetail
    return (
        <div>
            <div style={{display: 'flex'}}>
                <div>
                    <div style={{maxWidth: '600px'}}>
                        <img src={imgSrc} alt="pdp-big-thumbnail" width={'100%'} />
                    </div>
                    <div style={{display: 'flex'}}>
                        {smallThumbnails.mediaItems.map((media) => {
                            const smallThumbnailSrc = media.url.startsWith('/cms/')
                                ? new URL(
                                      `https://trialorgsforu-24b.test1.lightning.pc-rnd.force.com${media.url}`
                                  )
                                : media.url

                            return (
                                <div style={{maxWidth: '150px'}}>
                                    <img src={smallThumbnailSrc} alt="small-image" width="150px" />
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div style={{flex: 1}}>
                    <h3>{fields.Name}</h3>
                    <h4>{`${
                        productPrice?.listPrice ? productPrice?.listPrice : productPrice.unitPrice
                    } ${productPrice?.currencyIsoCode}`}</h4>
                    <div>{fields.Description}</div>
                    <QuantityPicker
                        quantity={quantity}
                        onDecrease={onDecrease}
                        onIncrease={onIncrease}
                    />
                    <button onClick={handleAddToCart} disabled={addItemToCartAction.isLoading}>
                        {addItemToCartAction.isLoading ? 'loading..' : 'Add to cart'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetail
