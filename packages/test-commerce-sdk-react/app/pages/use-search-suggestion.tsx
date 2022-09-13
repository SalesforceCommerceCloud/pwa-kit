/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import {useSearchSuggestions} from 'commerce-sdk-react'
import Json from '../components/Json'
import {Link} from 'react-router-dom'

const searchQuery = 'son'
const currency = 'USD'
const locale = 'en-US'

function UseSearchSuggestions() {
    const {
        isLoading,
        error,
        data: result,
    } = useSearchSuggestions({q: searchQuery, currency, locale})
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
            <ul>
                {result?.data?.productSuggestions.products.map(
                    (hit: {
                        productId: string
                        productName: string
                        price: number
                        currency: string
                    }) => {
                        return (
                            <li key={hit.productId}>
                                <p style={{fontWeight: 'bold'}}>{hit.productName}</p>
                                <p>{hit.productId}</p>
                                <p>
                                    {hit.currency} | {hit.price}
                                </p>
                                <hr />
                            </li>
                        )
                    }
                )}
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
