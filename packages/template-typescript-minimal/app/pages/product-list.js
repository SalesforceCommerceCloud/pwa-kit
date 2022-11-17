/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useParams} from 'react-router-dom/'
import {useProductSearch} from '../hooks/useFetch'
import {Link} from 'react-router-dom'

ProductList.propTypes = {}

const ProductTile = ({product}) => {
    return (
        <Link to={`/products/${product.id}`} style={{textDecoration: 'none', maxWidth: '300px'}}>
            <img src={product.defaultImage.url} alt="" width="150px" />
            <div>{product.name}</div>
        </Link>
    )
}
function ProductList(props) {
    const {categoryId} = useParams()
    const {data, isLoading, error} = useProductSearch(categoryId)
    if (isLoading) {
        return <div>Loading....</div>
    }
    if (error) {
        return <div>Something is wrong</div>
    }
    const {productsPage} = data
    console.log('data', data)
    return (
        <div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
                {productsPage.products.map((product) => (
                    <ProductTile product={product} />
                ))}
            </div>
        </div>
    )
}

export default ProductList
