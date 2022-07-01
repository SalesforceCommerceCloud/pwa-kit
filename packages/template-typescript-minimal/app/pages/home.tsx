/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import useProductSearch from '../hooks/useProductSearch'
import useProducts from '../hooks/useProducts'

const Home = () => {
    const {data: productSearchData, isValidating} = useProductSearch({searchTerm: 'shirt'})
    const productIds = productSearchData?.hits.map((hit) => hit.productId)
    const {data: products, isValidating: isLoadingProductDetail} = useProducts({productIds})
    return (
        <div>
            {!productSearchData && isValidating && <h1>Loading...</h1>}
            {productSearchData?.hits.map((hit) => {
                const extraProductData = products?.data.find(
                    (product) => product.id === hit.productId
                )
                return (
                    <div key={hit.productId}>
                        <h1>Name: {hit.productName}</h1>
                        <p>
                            <b>The following data is from ShopperSearch API</b>
                        </p>
                        <p>Price: ${hit.price}</p>

                        <p>
                            <b>The following data is from ShopperProducts API</b>
                        </p>

                        {isLoadingProductDetail ? (
                            <p>loading...</p>
                        ) : (
                            <div>
                                <p>Description: {extraProductData?.shortDescription}</p>
                                <p>Image groups</p>
                                <p>minOrderQuantity: {extraProductData?.minOrderQuantity}</p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

Home.getTemplateName = () => 'home'

Home.getProps = async () => {}

export default Home
