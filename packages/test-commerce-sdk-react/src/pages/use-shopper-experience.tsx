/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {usePage, usePages} from '@salesforce/commerce-sdk-react'
import {Page, Region} from '@salesforce/commerce-sdk-react/components'
import Json from '../components/Json'

const PAGE_ID = 'homepage-example'
const ASPECT_TYPE_ID_PDP = 'pdp'
const ASPECT_TYPE_ID_PLP = 'plp'
const PRODUCT_ID = '69309284M'
const CATEGORY_ID = 'mens'
const ASPECT_ATTRIBUTES = JSON.stringify({
    category: 'mens'
})

const componentMapProxy = new Proxy(
    {},
    {
        get() {
            return (props: any) => (
                <div style={{marginBottom: '10px'}}>
                    <b>{props.typeId}</b>
                    {props?.regions?.map((region: any) => (
                        <Region
                            style={{margin: '0px 0px 5px 20px'}}
                            key={region.id}
                            region={region}
                        />
                    ))}
                </div>
            )
        }
    }
)

const renderQueryHook = (name: string, arg: any, {data, isLoading, error}: any, index: number) => {
    if (isLoading) {
        return (
            <div key={`${name}_${index}_loading`}>
                <h1 id={name}>{name}</h1>
                <hr />
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    const pages = name === 'usePage' ? [data] : data.data

    return (
        <div key={`${name}_${index}`}>
            <h2 id={name}>{name}</h2>
            <h3>{data?.name}</h3>
            <h3>
                <Json data={{arg}} />
            </h3>
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
            <h3>Rendering Data</h3>
            <div>
                {pages &&
                    pages?.map((page: any) => (
                        <Page key={index} page={page} components={componentMapProxy} />
                    ))}
            </div>
        </div>
    )
}
const UseShopperExperience = () => {
    const queryHooks = [
        {
            name: 'usePage',
            arg: {
                parameters: {pageId: PAGE_ID}
            },
            get hook() {
                // TODO: Address the lint error instead of ignoring it
                // eslint-disable-next-line react-hooks/rules-of-hooks
                return usePage(this.arg)
            }
        },
        {
            name: 'usePages',
            arg: {
                parameters: {
                    aspectTypeId: ASPECT_TYPE_ID_PDP,
                    productId: PRODUCT_ID
                }
            },
            get hook() {
                // TODO: Address the lint error instead of ignoring it
                // eslint-disable-next-line react-hooks/rules-of-hooks
                return usePages(this.arg)
            }
        },
        {
            name: 'usePages',
            arg: {
                parameters: {
                    aspectTypeId: ASPECT_TYPE_ID_PLP,
                    categoryId: CATEGORY_ID,
                    aspectAttributes: ASPECT_ATTRIBUTES
                }
            },
            get hook() {
                // TODO: Address the lint error instead of ignoring it
                // eslint-disable-next-line react-hooks/rules-of-hooks
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
                    {queryHooks.map(({name, arg, hook}, index) => {
                        return renderQueryHook(name, arg, {...hook}, index)
                    })}
                </div>
            </>
        </>
    )
}

UseShopperExperience.getTemplateName = () => 'UseShopperExperience'

export default UseShopperExperience
