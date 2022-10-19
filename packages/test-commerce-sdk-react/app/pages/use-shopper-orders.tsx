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
} from 'commerce-sdk-react'
const orderNos = ['00014202', '00014103']
const ORDER_NO = '00014103'
const BANK_ROUTING = '123456'

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
        // {
        //     action: 'createOrder',
        //     body: {basketId: 'xxx'},
        //     parameters: {}
        // },
        {
            action: 'createPaymentInstrumentForOrder',
            body: {
                amount: 700,
                paymentMethodId: 'GIFT_CERTIFICATE',
                bankRoutingNumber: BANK_ROUTING
            },
            parameters: {orderNo: ORDER_NO}
        },
        {
            //need to input a valid paymentInstrumentId from order details
            action: 'removePaymentInstrumentFromOrder',
            body: {},
            parameters: {orderNo: ORDER_NO, paymentInstrumentId: '2c79dabce39a7eba4a45725fc9'}
        },
        {
            action: 'updatePaymentInstrumentForOrder',
            body: {bankRoutingNumber: '000000'},
            parameters: {orderNo: ORDER_NO, paymentInstrumentId: '7a7cb6bb69e94fa6fcc35e6281'}
        }
    ].map(({action, body, parameters}) => {
        return {
            name: action,
            hook: useShopperOrdersMutation(action),
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
