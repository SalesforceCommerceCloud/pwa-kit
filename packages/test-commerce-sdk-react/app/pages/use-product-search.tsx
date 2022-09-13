/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import {useProductSearch} from 'commerce-sdk-react'
import Json from '../components/Json'
import { Link } from 'react-router-dom'

const searchQuery = 'shirt'

function UseProductSearch() {
    const {isLoading, error, data: result} = useProductSearch({
        q: searchQuery
    })
    if (isLoading) {
        return (
            <div>
                <h1>Search Results</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            <h1>Search Results</h1>
            <div>Click on the link to go to a product page</div>
            {result?.data?.hits.map((hit: {productId: string, productName: string}) => {
                return (
                    <div key={hit.productId}>
                        <Link to={`/products/${hit.productId}`}>{hit.productName}</Link>
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

UseProductSearch.getTemplateName = () => 'UseProductSearch'

export default UseProductSearch
