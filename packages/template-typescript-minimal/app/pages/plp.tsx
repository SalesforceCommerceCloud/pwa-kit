/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Link} from 'react-router-dom'

import useProductSearch from '../hooks/useProductSearch'
import useProducts from '../hooks/useProducts'

const PLP = () => {
    // Q: How do we dealing with incomplete data, and the requests that depend on another request?
    // A common issue we had was that on PLP, the product search data is incomplete
    // the products are missing image / description that you have to make another call to
    // the ShopperProducts API.

    // A: In this example, we have two hook calls.
    // 1. useProductSearch()
    // 2. useProducts()
    // The second call depends on the result of the first call.
    // On the initial rendering, since useProductSearch's data is undefined
    // useProducts will do nothing and wait for the result.

    const productSearch = useProductSearch({searchTerm: 'shirt'}, [])
    const productIds = productSearch?.data?.hits.map((hit) => hit.productId)
    const productDetails = useProducts({productIds})

    return (
        <div>
            {!productSearch?.data && productSearch?.isLoading && <h1>Loading...</h1>}
            {productSearch?.data?.hits.map((hit) => {
                const extraProductData = productDetails?.data?.data.find(
                    (product) => product.id === hit.productId
                )
                return (
                    <Link to={`/${hit.productId}`} key={hit.productId}>
                        <div>
                            <h1>Name: {hit.productName}</h1>
                            <p>
                                <b>The following data is from ShopperSearch API</b>
                            </p>
                            <p>Price: ${hit.price}</p>

                            <p>
                                <b>The following data is from ShopperProducts API</b>
                            </p>

                            {productDetails?.isValidating ? (
                                <p>loading...</p>
                            ) : (
                                <div>
                                    <p>Description: {extraProductData?.shortDescription}</p>
                                    <p>Image groups</p>
                                    <p>minOrderQuantity: {extraProductData?.minOrderQuantity}</p>
                                </div>
                            )}
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}

PLP.getTemplateName = () => 'plp'

PLP.getProps = async () => {}

export default PLP
