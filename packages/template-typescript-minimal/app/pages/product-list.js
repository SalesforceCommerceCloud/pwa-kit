/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useParams} from 'react-router-dom/'
import {useProductSearch, useProductsPrice} from '../hooks/useFetch'
import {Link, useLocation} from 'react-router-dom'
import {getMediaLink} from '../utils/utils'

ProductList.propTypes = {}

const ProductTile = ({currency, product, price}) => {
    if (!price || !product) return null
    const imgSrc = getMediaLink(product.defaultImage.url)
    return (
        <Link to={`/products/${product.id}`} style={{textDecoration: 'none', maxWidth: '300px'}}>
            <div style={{width: '150px', minHeight: '150px'}}>
                <img src={imgSrc} alt="" width="150px" />
            </div>
            <div>{product.name}</div>
            <div>
                {price.listPrice || price.unitPrice}
                {currency}
            </div>
        </Link>
    )
}
function ProductList() {
    const {categoryId} = useParams()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search.split('?')?.[1])
    const searchTerm = queryParams.get('q')
    const {data, isLoading, error} = useProductSearch({categoryId, searchTerm})
    const productIds = data?.productsPage?.products.map((product) => ({productId: product.id}))
    const {
        data: productListPrice,
        isLoading: productListPriceLoading,
        error: productListPriceError
    } = useProductsPrice(productIds)
    if (isLoading) {
        return <div>Loading....</div>
    }
    if (error || productListPriceError) {
        return <div>Something is wrong</div>
    }
    const {productsPage} = data
    if (productsPage?.products.length === 0) {
        return <div>No product found</div>
    }
    return (
        <div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
                {productsPage?.products.map((product) => {
                    const price = productListPrice?.pricingLineItemResults?.find((i) =>
                        product.id.includes(i.productId)
                    )
                    return (
                        <ProductTile
                            key={product.id}
                            currency={productListPrice?.currencyIsoCode}
                            product={product}
                            price={price}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default ProductList
