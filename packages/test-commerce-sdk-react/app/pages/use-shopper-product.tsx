/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useProduct} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'
import {Link, useParams} from 'react-router-dom'

function UseShopperProduct() {
    const {productId}: {productId: string} = useParams()
    const {data, isLoading, error} = useProduct({parameters: {id: productId}})
    if (isLoading) {
        return (
            <div>
                <h1>useProducts page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>useProducts page</h1>
            <h2>{data?.name}</h2>

            {productId !== '25604455M' && (
                <div>
                    <Link to="/products/25604455M">See No-Iron Textured Dress Shirt </Link>
                </div>
            )}
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
        </>
    )
}

UseShopperProduct.getTemplateName = () => 'UseShopperProduct'

export default UseShopperProduct
