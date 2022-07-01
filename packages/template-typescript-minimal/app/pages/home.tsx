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

const Home = () => {
    const productSearch = useProductSearch({searchTerm: 'shirt'})
    const productIds = productSearch?.data?.hits.map((hit) => hit.productId)
    const productDetails = useProducts({productIds})
    return (
        <div>
            {!productSearch?.data && productSearch?.isValidating && <h1>Loading...</h1>}
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

Home.getTemplateName = () => 'home'

Home.getProps = async () => {}

export default Home
