/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useSearchStores, useStores} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

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
        </div>
    )
}

const UseShopperStores = () => {
    const queryHooks = [
        {
            name: 'useSearchStores',
            arg: {
                parameters: {
                    countryCode: 'US',
                    postalCode: '94086',
                    locale: 'en-US',
                    maxDistance: 20012
                }
            },
            get hook() {
                // TODO: Address the lint error instead of ignoring it
                // eslint-disable-next-line react-hooks/rules-of-hooks
                return useSearchStores(this.arg)
            }
        },
        {
            name: 'useStores',
            arg: {
                parameters: {
                    ids: '00001,00002,00003'
                }
            },
            get hook() {
                // TODO: Address the lint error instead of ignoring it
                // eslint-disable-next-line react-hooks/rules-of-hooks
                return useStores(this.arg)
            }
        }
    ]
    return (
        <>
            <h1>ShopperStores page</h1>

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

UseShopperStores.getTemplateName = () => 'UseShopperStores'

export default UseShopperStores
