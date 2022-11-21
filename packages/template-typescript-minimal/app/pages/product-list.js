/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useParams} from 'react-router-dom/'
import {useProductSearch, useProductsPrice} from '../hooks/useFetch'
import {Link} from 'react-router-dom'

ProductList.propTypes = {}

const ProductTile = ({currency, product, price}) => {
    if (!price || !product) return null
    const imgSrc = product.defaultImage.url.startsWith('/cms/')
        ? new URL(
              `https://trialorgsforu-24b.test1.lightning.pc-rnd.force.com${product.defaultImage.url}`
          )
        : product.defaultImage.url
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
function ProductList(props) {
    const {categoryId} = useParams()
    const {data, isLoading, error} = useProductSearch(categoryId)
    const productIds = data?.productsPage?.products.map((product) => ({productId: product.id}))
    console.log('productIds', productIds)
    const {
        data: productListPrice,
        isLoading: productListPriceLoading,
        error: productListPriceError
    } = useProductsPrice(productIds)
    console.log('data', data)
    if (isLoading) {
        return <div>Loading....</div>
    }
    if (error || productListPriceError) {
        return <div>Something is wrong</div>
    }
    const {productsPage} = data
    if (productsPage?.products.length === 0) {
        return <div>No product in this category</div>
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
