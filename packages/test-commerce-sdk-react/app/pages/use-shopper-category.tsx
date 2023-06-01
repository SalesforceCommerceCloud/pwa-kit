/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useCategory} from '@salesforce/commerce-sdk-react'
import {Link, useParams} from 'react-router-dom'
import Json from '../components/Json'
import {flatten} from '../utils/utils'

function UseShopperCategory() {
    const {categoryId}: {categoryId: string} = useParams()
    const {isLoading, error, data} = useCategory({
        parameters: {
            id: categoryId
        }
    })
    if (isLoading) {
        return (
            <div>
                <h1>useCategory Page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <div>
            <h1>useCategory Page</h1>
            <h2>Categories {data?.name}</h2>
            {data && data.categories && (
                <>
                    <h3>Sub categories</h3>
                    {Object.keys(flatten(data, 'categories'))
                        .filter((key) => key !== categoryId)
                        .map((key) => (
                            <div key={key}>
                                <Link to={`/categories/${key}`}>Category {key}</Link>
                            </div>
                        ))}
                </>
            )}

            <hr />
            <div>Returned data</div>
            <Json data={data} />
        </div>
    )
}

UseShopperCategory.getTemplateName = () => 'UseShopperCategory'

export default UseShopperCategory
