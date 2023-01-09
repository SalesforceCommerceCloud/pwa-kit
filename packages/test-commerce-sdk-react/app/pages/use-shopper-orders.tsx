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
    useShopperOrdersMutation,
    useShopperLoginHelper,
    ShopperLoginHelpers
} from 'commerce-sdk-react-preview'
const orderNos = ['00014202', '00014103']

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
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])
    const mutationHooks = [
        {
            action: 'createOrder',
            body: {basketId: '0fb0df8ad1df3d7741081ada63'},
            parameters: {}
        }
    ].map(({action, body, parameters}) => {
        return {
            name: action,
            hook: useShopperOrdersMutation({
                action,
                headers: {'test-header': 'value'},
                rawResponse: false
            }),
            body,
            parameters
        }
    })

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
                <Link to="/orders/abcdef">abcdef</Link>
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
