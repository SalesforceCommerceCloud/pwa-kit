/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {useQuery} from '@tanstack/react-query'
//@ts-ignore
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
//@ts-ignore
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import useBuyer from '../hooks/useBuyer'
import useFetch from '../hooks/useFetch'

const Home = () => {
    // const [token, setToken] = useState('')
    const {
        app: {webstoreId}
    } = getConfig()
    const [token, getToken] = useBuyer()
    const productId = 'fds'
    const test = useFetch(
        `${getAppOrigin()}/mobify/proxy/scom/services/data/v55.0/commerce/webstores/${webstoreId}/product-categories/children`
    )
    const query = useQuery(
        ['categories'],
        () => test
        // async () => {
        //     const res = await fetch(
        //         `${getAppOrigin()}/mobify/proxy/scom/services/data/v55.0/commerce/webstores/${webstoreId}/product-categories/children`,
        //         {
        //             headers: {
        //                 Authorization: `Bearer ${token}`
        //             }
        //         }
        //     )
        //     const data = await res.json()
        //     return data
        // }
    )
    React.useEffect(() => {
        getToken()
    }, [])
    console.log('token', token)

    console.log('query', query.data)
    return (
        <div>
            <div>
                <div>{token && token}</div>
                {token ? (
                    <div>Logged in as alex.vuong </div>
                ) : (
                    <button onClick={getToken}>Log in as alex.vuong@salesforce.com</button>
                )}
                <button
                    onClick={async () => {
                        const res = await fetch(
                            `${getAppOrigin()}/mobify/proxy/scom/services/data/v55.0/commerce/webstores/${webstoreId}/product-categories/children`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        )
                        const data = await res.json()
                        console.log('data', data)
                    }}
                >
                    Get a product detail
                </button>
            </div>
        </div>
    )
}

Home.getTemplateName = () => 'home'

export default Home
