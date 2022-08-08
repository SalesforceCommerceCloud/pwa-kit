/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
// @ts-ignore
import {useProducts} from 'commerce-sdk-react'
import Json from '../components/Json'
import {Link} from 'react-router-dom'
const ids = '25502228M,25503045M'

const UseShopperProducts = () => {
    const {isLoading, error, data: result} = useProducts({
        ids
    })
    if (isLoading) {
        return (
            <div>
                <h1>Products</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>Products</h1>
            <div>Click on the link to go to a product page</div>
            {result?.data.map(({id, name}) => {
                return (
                    <div key={id}>
                        <Link to={`/products/${id}`}>{name}</Link>
                    </div>
                )
            })}
            <hr />
            <div>
                <div>Returning data</div>
                <Json data={{isLoading, error, result}} />
            </div>
        </>
    )
}

UseShopperProducts.getTemplateName = () => 'UseShopperProducts'

export default UseShopperProducts
