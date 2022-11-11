/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {useCategories, useProductCategoryPath} from '../hooks/useFetch'
import {useQuery} from '@tanstack/react-query'
import {Link} from 'react-router-dom'

const Category = ({cate}) => {
    const {fields} = cate
    const {data, isLoading} = useCategories(fields.Id)
    console.log('data', data)

    return (
        <div>
            <div>Category {fields.Name}</div>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                data?.productCategories && (
                    <ul>
                        <li>
                            {data?.productCategories?.map((cate) => (
                                <div key={cate.fields.Id}>
                                    <div>{cate.fields.Name}</div>
                                </div>
                            ))}
                        </li>
                    </ul>
                )
            )}
        </div>
    )
}

const Home = () => {
    const {
        app: {webstoreId}
    } = getConfig()
    const {data, isLoading} = useCategories()
    if (isLoading) {
        return <div>Loading categories.....</div>
    }

    return (
        <div>
            <div>
                <div>
                    {data?.productCategories.map((cate) => {
                        return <Category key={cate.id} cate={cate} />
                    })}
                </div>
                <Link to="/products/go-brew">Go Brew Coffee</Link>
            </div>
        </div>
    )
}

Home.getTemplateName = () => 'home'

export default Home
