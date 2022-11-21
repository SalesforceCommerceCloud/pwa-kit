/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {addItemToCart, useCart, useProduct, useProductPrice} from '../hooks/useFetch'
import QuantityPicker, {useQuantity} from '../components/quantity-picker'
import {useParams} from 'react-router-dom'
import {getMediaLink} from '../utils/utils'
ProductDetail.propTypes = {}

function ProductDetail() {
    const {quantity, onDecrease, onIncrease} = useQuantity()

    const {productId} = useParams()
    const [selectedVariant, setSelectedVariant] = React.useState({})

    const {data: productDetail, isLoading, error} = useProduct(productId)
    const {
        data: productPrice,
        isLoading: isProductPriceLoading,
        error: productPriceError
    } = useProductPrice(productId)
    React.useEffect(() => {
        if (
            productDetail &&
            productDetail?.productClass === 'VariationParent' &&
            Object.keys(selectedVariant).length === 0
        ) {
            const variant = {}
            Object.values(productDetail?.variationInfo?.variationAttributeInfo).map((attr) => {
                variant[attr.label] = {
                    label: attr.label,
                    value: attr.allowableValues?.[0]
                }
            })
            setSelectedVariant(variant)
        }
    }, [productDetail])
    const addItemToCartAction = addItemToCart()

    if (isLoading || isProductPriceLoading) {
        return <div>Loading a product....</div>
    }
    if (error || productPriceError) {
        return <h3 style={{color: 'red'}}>Something is wrong</h3>
    }

    const {fields} = productDetail

    const handleAddToCart = () => {
        const variant = variationInfo?.attributesToProductMappings.find((variant) => {
            const {selectedAttributes} = variant
            return Object.values(selectedVariant).every((v) => {
                const t = selectedAttributes.find((i) => {
                    return i.label === v.label && i.value === v.value
                })
                return !!t
            })
        })
        const item = {
            productId: variant ? variant.productId : productId,
            quantity,
            type: 'Product'
        }
        addItemToCartAction.mutate(item)
    }
    const bigThumbnail = productDetail?.mediaGroups?.find((media) => media.usageType === 'Listing')
    const imgSrc = getMediaLink(bigThumbnail?.mediaItems[0].url)
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
                            const smallThumbnailSrc = getMediaLink(media.url)

                            return (
                                <div style={{maxWidth: '150px'}} key={media.id}>
                                    <img src={smallThumbnailSrc} alt="small-image" width="150px" />
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div style={{flex: 1}}>
                    <div>ProductClass: {productDetail.productClass}</div>
                    <h3>{fields.Name}</h3>
                    <h4>{`${
                        productPrice?.listPrice ? productPrice?.listPrice : productPrice.unitPrice
                    } ${productPrice?.currencyIsoCode}`}</h4>
                    <div>{fields.Description}</div>
                    {variationInfo &&
                        Object.values(variationInfo.variationAttributeInfo).map((attribute) => {
                            return (
                                <div key={attribute.label} style={{marginBottom: '10px'}}>
                                    <h4>{attribute.label}</h4>
                                    <select
                                        onChange={(e) => {
                                            setSelectedVariant({
                                                ...selectedVariant,
                                                [attribute.label]: {
                                                    label: attribute.label,
                                                    value: e.target.value
                                                }
                                            })
                                        }}
                                    >
                                        {attribute.allowableValues.map((value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )
                        })}
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
