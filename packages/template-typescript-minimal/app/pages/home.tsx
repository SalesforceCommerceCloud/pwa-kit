/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import useProductSearch from '../hooks/useProductSearch'

const Home = () => {
    const {data} = useProductSearch()
    console.log('home')

    return (
        <div>
            {data?.hits.map((hit) => {
                return (
                    <div key={hit.productId}>
                        <h1>{hit.productName}</h1>
                        <p>${hit.price}</p>
                    </div>
                )
            })}
        </div>
    )
}

Home.getTemplateName = () => 'home'

Home.getProps = async () => {}

export default Home
