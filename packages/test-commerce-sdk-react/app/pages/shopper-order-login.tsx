/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Link, useParams} from 'react-router-dom'
import Json from '../components/Json'
import {ShopperLoginHelpers, useShopperLoginHelper} from 'commerce-sdk-react'
const orderNos = ['00014202', '00014103']

function ShopperOrderLogin() {
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const logout = useShopperLoginHelper(ShopperLoginHelpers.Logout)

    return (
        <>
            <h1>LoginRegisteredUserB2C</h1>
            <h2>Log in to view order information!</h2>
            <Json data={loginRegisteredUser} />
            <button
                onClick={() =>
                    loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
                }
            >
                loginRegisteredUser
            </button>
            {loginRegisteredUser.error?.message && (
                <p style={{color: 'red'}}>Error: {loginRegisteredUser.error?.message}</p>
            )}
            <hr />
            <h1>Account Orders</h1>
            <div>Click on the link to go to an order page</div>
            {orderNos.map(orderNo => (
                <div>
                    <Link to={`/orders/${orderNo}`}>{orderNo}</Link>
                </div>
            ))}
            <hr />
            <h1>Logout</h1>
            <h2>Logging out should disable order viewing</h2>
            <Json data={logout} />
            <button onClick={() => logout.mutate()}>logout</button>
            {logout.error?.message && <p style={{color: 'red'}}>Error: {logout.error?.message}</p>}
        </>
    )
}

ShopperOrderLogin.getTemplateName = () => 'ShopperOrderLogin'

export default ShopperOrderLogin