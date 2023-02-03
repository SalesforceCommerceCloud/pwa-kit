/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {usePage, usePages} from 'commerce-sdk-react-preview'
import Json from '../components/Json'

const PAGE_ID = 'homepage-example'
const ASPECT_TYPE_ID_PDP = 'pdp'
const ASPECT_TYPE_ID_PLP = 'plp'
const PRODUCT_ID = '69309284M'
const CATEGORY_ID = 'mens'
const ASPECT_ATTRIBUTES = JSON.stringify({
    category: 'mens'
})

const renderQueryHook = (name: string, arg: any, {data, isLoading, error}: any) => {
    if (isLoading) {
        return (
            <div key={name}>
                <h1 id={name}>{name}</h1>
                <hr />
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <div key={name}>
            <h2 id={name}>{name}</h2>
            <h3>{data?.name}</h3>
            <h3>
                <Json data={{arg}} />
            </h3>
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
        </div>
    )
}
const UseShopperExperience = () => {
    const queryHooks = [
        {
            name: 'usePage',
            arg: {pageId: PAGE_ID},
            hook: usePage({pageId: PAGE_ID})
        },
        {
            name: 'usePages',
            arg: {
                aspectTypeId: ASPECT_TYPE_ID_PDP,
                productId: PRODUCT_ID
            },
            get hook() {
                return usePages(this.arg)
            }
        },
        {
            name: 'usePages',
            arg: {
                aspectTypeId: ASPECT_TYPE_ID_PLP,
                categoryId: CATEGORY_ID,
                aspectAttributes: ASPECT_ATTRIBUTES
            },
            get hook() {
                return usePages(this.arg)
            }
        }
    ]
    return (
        <>
            <h1>ShopperExperience page</h1>

            <>
                <div>
                    <h1>Query hooks</h1>
                    {queryHooks.map(({name, arg, hook}) => {
                        return renderQueryHook(name, arg, {...hook})
                    })}
                </div>
            </>
        </>
    )
}

UseShopperExperience.getTemplateName = () => 'UseShopperExperience'

export default UseShopperExperience
