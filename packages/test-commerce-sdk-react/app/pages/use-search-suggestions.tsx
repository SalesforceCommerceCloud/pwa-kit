/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useSearchSuggestions} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

const searchQuery = 'shirt'

function UseSearchSuggestions() {
    const {isLoading, error, data: result} = useSearchSuggestions({parameters: {q: searchQuery}})
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
            <h3>Search term: {searchQuery}</h3>
            <ul>
                {result?.productSuggestions?.products?.map(({productId, productName}) => {
                    return <li key={productId}>{productName}</li>
                })}
            </ul>
            <hr />
            <div>
                <div>Returning data</div>
                <Json data={{isLoading, error, result}} />
            </div>
        </>
    )
}

UseSearchSuggestions.getTemplateName = () => 'UseSearchSuggestions'

export default UseSearchSuggestions
