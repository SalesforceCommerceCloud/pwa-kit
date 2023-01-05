/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {ShopperLoginHelpers, useShopperLoginHelper} from 'commerce-sdk-react-preview'
import Json from '../components/Json'

const UseShopperLoginHelper = () => {
    // use string or enum
    const loginGuestUser = useShopperLoginHelper('loginGuestUser')
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const logout = useShopperLoginHelper(ShopperLoginHelpers.Logout)

    //logout before logging guest user in
    const loginGuestUserFlow = async () => {
        await logout.mutateAsync()
        loginGuestUser.mutate()
    }

    return (
        <>
            <h1>LoginGuestUser</h1>
            <Json data={loginGuestUser} />
            <button onClick={() => loginGuestUserFlow()}>loginGuestUser</button>
            {loginGuestUser.error?.message && (
                <p style={{color: 'red'}}>Error: {loginGuestUser.error?.message}</p>
            )}
            <hr />
            <h1>LoginRegisteredUserB2C</h1>
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
            <h1>Logout</h1>
            <Json data={logout} />
            <button onClick={() => logout.mutate()}>logout</button>
            {logout.error?.message && <p style={{color: 'red'}}>Error: {logout.error?.message}</p>}
        </>
    )
}

UseShopperLoginHelper.getTemplateName = () => 'UseShopperLoginHelper'

export default UseShopperLoginHelper
