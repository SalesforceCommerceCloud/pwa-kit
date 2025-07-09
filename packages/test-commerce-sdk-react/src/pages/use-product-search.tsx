/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'
import {Link} from 'react-router-dom'

const searchQuery = 'shirt'
const refinement = ['price=(0..50)']

function UseProductSearch() {
    const {
        isLoading,
        error,
        data: result
    } = useProductSearch({
        parameters: {
            q: searchQuery,
            refine: refinement
        }
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
            <h3 style={{margin: 0, padding: 0}}>Search term: {searchQuery}</h3>
            <h4 style={{margin: 0, padding: 0}}>Refinements: {refinement}</h4>
            <div>Click on the link to go to a product page</div>
            {result?.hits?.map(({productId, productName}) => {
                return (
                    <div key={productId}>
                        <Link to={`/products/${productId}`}>{productName}</Link>
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
