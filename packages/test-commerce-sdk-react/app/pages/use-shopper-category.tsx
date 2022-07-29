/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
// @ts-ignore
import {useCategory} from 'commerce-sdk-react'
import {Link, useParams} from 'react-router-dom'
import Json from '../components/Json'

function UseShopperCategory() {
    const {categoryId}: {categoryId: string} = useParams()
    const {isLoading, error, data} = useCategory({
        id: categoryId
    })
    if (isLoading) {
        return (
            <div>
                <h1>useCategory Page</h1>
                <div>Loading...</div>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <div>
            <div>
                <Link to={'/'}>Home</Link>
            </div>
            <h1>useCategory Page</h1>
            <Json data={data} />
        </div>
    )
}

UseShopperCategory.getTemplateName = () => 'UseShopperCategory'

export default UseShopperCategory
