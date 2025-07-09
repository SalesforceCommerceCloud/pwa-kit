/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    useShopperContext,
    useShopperContextsMutation,
    ShopperContextsMutation
} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

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

    return (
        <div key={name}>
            <h2 id={name}>{name}</h2>
            <h3>{data?.name}</h3>
            <hr />
            <h3 style={{color: error ? 'red' : 'inherit'}}>Returned data</h3>
            <Json data={{isLoading, error, data}} />
        </div>
    )
}

const renderMutationHook = ({name, hook, body, parameters}: any) => {
    return (
        <div key={name}>
            <h2 id={name}>{name}</h2>
            <hr />
            <button
                onClick={() =>
                    hook.mutate({
                        body,
                        parameters
                    })
                }
            >
                {name}
            </button>
            <br />
            <br />
            {hook.error?.message && <p style={{color: 'red'}}>Error: {hook.error?.message}</p>}

            <div>
                <Json data={hook} />
            </div>
        </div>
    )
}

function UseShopperContext() {
    const usid = localStorage.getItem('RefArchGlobal_usid') || ''

    const mutationHooks = [
        {
            action: 'createShopperContext',
            body: {
                effectiveDateTime: '2020-12-20T00:00:00Z',
                customQualifiers: {
                    deviceType: 'mobile'
                },
                assignmentQualifiers: {
                    store: 'boston'
                }
            },
            parameters: {usid}
        },
        {
            action: 'updateShopperContext',
            body: {
                effectiveDateTime: new Date().toISOString().replace(/\.\d\d\dZ/, 'Z'),
                customQualifiers: {
                    deviceType: 'desktop'
                },
                assignmentQualifiers: {
                    store: 'vancouver'
                }
            },
            parameters: {usid}
        },
        {
            action: 'deleteShopperContext',
            body: {},
            parameters: {usid}
        }
    ].map(({action, body, parameters}) => {
        return {
            name: action,
            // This is essentially a shorthand to avoid writing out a giant object;
            // it *technically* violates the rules of hooks, but not in an impactful way.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            hook: useShopperContextsMutation(action as ShopperContextsMutation),
            body,
            parameters
        }
    })

    const queryHooks = [
        {
            name: 'useShopperContext',
            hook: useShopperContext({
                parameters: {usid}
            })
        }
    ]

    return (
        <>
            <div>
                <h1>Query hooks</h1>
                {queryHooks.map(({name, hook}) => {
                    return renderQueryHook(name, {...hook})
                })}
            </div>
            <div>
                <h1>Mutation hooks</h1>
                {mutationHooks.map((mutation) => {
                    return renderMutationHook({...mutation})
                })}
            </div>
        </>
    )
}

UseShopperContext.getTemplateName = () => 'UseShopperContext'

export default UseShopperContext
