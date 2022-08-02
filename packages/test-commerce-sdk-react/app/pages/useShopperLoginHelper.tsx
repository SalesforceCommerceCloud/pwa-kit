/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {ShopperLoginHelpers, useShopperLoginHelper} from 'commerce-sdk-react'
import Json from '../components/Json'

const UseShopperLoginHelper = () => {
    const loginGuestUser = useShopperLoginHelper(ShopperLoginHelpers.LoginGuestUser)
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    return (
        <>
            <h1>LoginGuestUser</h1>
            <Json data={loginGuestUser} />
            <button
                onClick={() =>
                    loginGuestUser.execute({redirectURI: 'http://localhost:3000/callback'})
                }
            >
                loginGuestUser
            </button>
            {loginGuestUser.error?.message && (
                <p style={{color: 'red'}}>Error: {loginGuestUser.error?.message}</p>
            )}
            <hr />
            <h1>LoginRegisteredUserB2C</h1>
            <Json data={loginRegisteredUser} />
            <button
                onClick={() =>
                    loginRegisteredUser.execute(
                        {username: 'kobe@test.com', password: 'Test1234!'},
                        {redirectURI: 'http://localhost:3000/callback'}
                    )
                }
            >
                loginRegisteredUser
            </button>
            {loginRegisteredUser.error?.message && (
                <p style={{color: 'red'}}>Error: {loginRegisteredUser.error?.message}</p>
            )}
        </>
    )
}

UseShopperLoginHelper.getTemplateName = () => 'UseShopperLoginHelper'

export default UseShopperLoginHelper
