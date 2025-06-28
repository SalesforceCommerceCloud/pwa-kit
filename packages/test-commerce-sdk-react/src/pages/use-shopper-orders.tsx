/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Link} from 'react-router-dom'
import Json from '../components/Json'
import {
    AuthHelpers,
    useOrder,
    useShopperOrdersMutation,
    useAuthHelper,
    ShopperOrdersMutation
} from '@salesforce/commerce-sdk-react'
const orderNos = ['00014202', '00014103']

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
            <h3>Returned data</h3>
            <Json data={{isLoading, error, data}} />
        </div>
    )
}

const renderMutationHooks = ({name, hook, body, parameters}: any) => {
    return (
        <div key={name}>
            <h2 id={name}>{name}</h2>
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

            {hook.error?.message && <p style={{color: 'red'}}>Error: {hook.error?.message}</p>}
            <div>
                <h3>Data</h3>
                <Json data={hook} />
            </div>
            <hr />
        </div>
    )
}

function UseShopperOrders() {
    const loginRegisteredUser = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])

    const mutationHooks = [
        {
            action: 'createOrder',
            body: {basketId: '0fb0df8ad1df3d7741081ada63'},
            parameters: {}
        },
        {
            action: 'createPaymentInstrumentForOrder',
            body: {basketId: '0fb0df8ad1df3d7741081ada63'},
            parameters: {}
        }
    ].map(({action, body, parameters}) => {
        return {
            name: action,
            // This is essentially a shorthand to avoid writing out a giant object;
            // it *technically* violates the rules of hooks, but not in an impactful way.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            hook: useShopperOrdersMutation(action as ShopperOrdersMutation),
            body,
            parameters
        }
    })

    const queryHooks = [
        {
            name: 'useOrder',
            hook: useOrder({
                parameters: {orderNo: orderNos[0]}
            })
        }
    ]

    return (
        <>
            <div>
                <h1>Account Orders</h1>
                {loginRegisteredUser.isLoading ? (
                    <span>Logging in...</span>
                ) : (
                    <h3>Logged in as {loginRegisteredUser?.variables?.username}</h3>
                )}
                <div>Click on the link to go to an order page</div>
                {orderNos.map((orderNo) => (
                    <div key={orderNo}>
                        <Link to={`/orders/${orderNo}`}>{orderNo}</Link>
                    </div>
                ))}
            </div>

            <hr />

            <div>
                <h1>Query hooks</h1>
                {queryHooks.map(({name, hook}) => {
                    return renderQueryHook(name, {...hook})
                })}
            </div>

            <hr />

            <div>
                <h1>Mutation Hooks</h1>
                {mutationHooks.map((mutation) => {
                    return renderMutationHooks({...mutation})
                })}
            </div>
        </>
    )
}

UseShopperOrders.getTemplateName = () => 'UseShopperOrders'

export default UseShopperOrders
