/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {usePage, usePages} from 'commerce-sdk-react-preview'
import Json from '../components/Json'

const PAGE_ID = 'homepage-example'
const PAGE_IDS = 'homepage-example,campaign-example'
const ASPECT_TYPE_ID = 'pdp'

const renderQueryHook = (name: string, {data, isLoading, error}: any) => {
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
            hook: usePage({pageId: PAGE_ID})
        },
        // TODO: API endpoint currently not working
        //  Response: 400 error Bad request {
        //   "detail" : "No business object identifier was provided. You must provide exactly one.",
        //   "title" : "Business Object ID Invalid",
        //   "type" : "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/business-object-id-invalid"
        //  }
        {
            name: 'usePages',
            hook: usePages({
                ids: PAGE_IDS,
                aspectTypeId: ASPECT_TYPE_ID
            })
        }
    ]
    return (
        <>
            <h1>ShopperExperience page</h1>

            <>
                <div>
                    <h1>Query hooks</h1>
                    {queryHooks.map(({name, hook}) => {
                        return renderQueryHook(name, {...hook})
                    })}
                </div>
            </>
        </>
    )
}

UseShopperExperience.getTemplateName = () => 'UseShopperExperience'

export default UseShopperExperience
