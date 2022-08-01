/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useProducts} from 'commerce-sdk-react'
import Json from '../components/Json'

const UseProducts = () => {
    const result = useProducts({parameters: {ids: '25697800M'}})

    return (
        <>
            <h1>useProducts</h1>
            <Json data={result} />
        </>
    )
}

UseProducts.getTemplateName = () => 'UseProducts'

export default UseProducts
