/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import { Link } from 'react-router-dom'
import Json from '../components/Json'
import {useBasket} from 'commerce-sdk-react'

function UseShopperBaskets() {
    const {
        isLoading,
        error,
        data: result,
    } = useBasket({basketId: '123'})

    if (isLoading) {
        return (
            <div>
                <h1>Basket</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            <h1>Basket</h1>
            {result?.productItems?.map(({productId, productName}) => {
                return (
                    <div key={productId}>
                        <Link to={`/products/${productId}`}>{productName}</Link>
                    </div>
                )
            })}
            <p>
                Total: {result?.productTotal} {result?.currency}
            </p>
            <hr />
            <div>
                <div>Returning data</div>
                <Json data={{isLoading, error, result}} />
            </div>
        </>
    )
}

UseShopperBaskets.getTemplateName = () => 'UseShopperBaskets'

export default UseShopperBaskets
