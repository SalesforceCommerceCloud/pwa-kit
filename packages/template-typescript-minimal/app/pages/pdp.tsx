/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useParams} from 'react-router-dom'

import useProduct from '../hooks/useProduct'

const PDP = () => {
    const {productId} = useParams()
    const {data} = useProduct({productId})

    return (
        <div>
            {data ? (
                <>
                    <h1>{data.name}</h1>
                    <p>{data.id}</p>
                    <p>{data.shortDescription}</p>
                </>
            ) : (
                <h1>Loading...</h1>
            )}
        </div>
    )
}

PDP.getTemplateName = () => 'pdp'

export default PDP
