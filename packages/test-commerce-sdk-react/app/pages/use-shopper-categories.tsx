/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useCategories} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'
import {Link} from 'react-router-dom'
import {flatten} from '../utils/utils'

function UseShopperCategories() {
    // how to get the categories type
    const {
        isLoading,
        error,
        data: result
    } = useCategories({
        parameters: {
            ids: 'root',
            levels: 2
        }
    })
    if (isLoading) {
        return (
            <div>
                <h1>useShopperCategories page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <div>
            <h1>useShopperCategories page</h1>
            {result &&
                Object.keys(flatten(result.data[0], 'categories')).map((key) => (
                    <div key={key}>
                        <Link to={`/categories/${key}`}>Category {key}</Link>
                    </div>
                ))}

            <hr />
            <div>
                <div>Returning data</div>
                <Json data={result} />
            </div>
        </div>
    )
}

UseShopperCategories.getTemplateName = () => 'UserShopperCategories'
export default UseShopperCategories
