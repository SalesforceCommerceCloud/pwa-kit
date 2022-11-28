/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    getApiUrl,
    useCartAction,
    useProduct,
    useProductPrice,
    useWishList,
    useWishlistAction,
    useWishListItems
} from '../hooks/useFetch'
import QuantityPicker, {useQuantity} from '../components/quantity-picker'
import {Link, useParams} from 'react-router-dom'
import {getMediaLink} from '../utils/utils'
import Breadcrumb from '../components/breadcrumb'

ProductDetail.propTypes = {}

function ProductDetail() {
    const {quantity, onDecrease, onIncrease} = useQuantity()
    const {data: wishList} = useWishList()
    const wishListId = wishList?.summaries?.[0].id
    const {data: wishlistItems} = useWishListItems(wishListId)
    const wishListAction = useWishlistAction(wishListId)
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
    const cartAction = useCartAction()
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
        cartAction.mutate({url: getApiUrl(`/carts/current/cart-items`), payload: item})
    }
    const handleWishList = () => {
        const variant = variationInfo?.attributesToProductMappings.find((variant) => {
            const {selectedAttributes} = variant
            return Object.values(selectedVariant).every((v) => {
                const t = selectedAttributes.find((i) => {
                    return i.label === v.label && i.value === v.value
                })
                return !!t
            })
        })
        if (wishList?.wishlistCount === 0) {
            wishListAction.mutate({
                url: getApiUrl('/wishlists'),
                payload: {
                    name: 'My Wish List',
                    products: [
                        {
                            productId: variant ? variant.productId : productId
                        }
                    ]
                }
            })
        } else {
            wishListAction.mutate({
                url: getApiUrl(`/wishlists/${wishList?.summaries?.[0]?.id}/wishlist-items`),
                payload: {
                    productId: variant ? variant.productId : productId
                }
            })
        }
    }
    const bigThumbnail = productDetail?.mediaGroups?.find((media) => media.usageType === 'Listing')
    const imgSrc = getMediaLink(bigThumbnail?.mediaItems[0].url)
    const smallThumbnails = productDetail.mediaGroups.find(
        (media) => media.usageType === 'Standard'
    )

    const {variationInfo, primaryProductCategoryPath} = productDetail
    const isProductInWishList = wishlistItems?.items?.find((item) => {
        const variant = variationInfo?.attributesToProductMappings.find((variant) => {
            const {selectedAttributes} = variant
            return Object.values(selectedVariant).every((v) => {
                const t = selectedAttributes.find((i) => {
                    return i.label === v.label && i.value === v.value
                })
                return !!t
            })
        })
        return (
            item.productSummary.productId === productId ||
            item.productSummary.productId === variant?.productId
        )
    })
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
                    <Breadcrumb categories={primaryProductCategoryPath} />
                    <div>ProductClass: {productDetail.productClass}</div>
                    <h3>{fields.Name}</h3>
                    <h4>
                        List Price {productPrice.listPrice} {productPrice.currencyIsoCode}
                    </h4>
                    <h4>
                        Unit Price {productPrice.unitPrice} {productPrice.currencyIsoCode}
                    </h4>
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
                    <div style={{marginTop: '10px', marginBottom: '10px'}}>
                        <button onClick={handleAddToCart} disabled={cartAction.isLoading}>
                            {cartAction.isLoading ? 'loading..' : 'Add to cart'}
                        </button>
                    </div>
                    {isProductInWishList && <div>Already in wishlist</div>}
                    {!isProductInWishList && (
                        <button
                            style={{marginTop: '10px'}}
                            onClick={handleWishList}
                            disabled={cartAction.isLoading}
                        >
                            {cartAction.isLoading ? 'loading..' : 'Add to wishlist'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductDetail
