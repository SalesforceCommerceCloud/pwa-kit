/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

const UseAuthHelper = () => {
    // use string or enum
    const loginGuestUser = useAuthHelper(AuthHelpers.LoginGuestUser)
    const loginRegisteredUser = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const logout = useAuthHelper(AuthHelpers.Logout)
    const isError = (err: unknown): err is Error => err instanceof Error

    //logout before logging guest user in
    const loginGuestUserFlow = async () => {
        await logout.mutateAsync()
        loginGuestUser.mutate()
    }

    return (
        <>
            <h1>LoginGuestUser</h1>
            <Json data={loginGuestUser} />
            <button onClick={() => void loginGuestUserFlow()}>loginGuestUser</button>
            {isError(loginGuestUser.error) && (
                <p style={{color: 'red'}}>Error: {loginGuestUser.error.message}</p>
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
            {isError(loginRegisteredUser.error) && (
                <p style={{color: 'red'}}>Error: {loginRegisteredUser.error.message}</p>
            )}
            <hr />
            <h1>Logout</h1>
            <Json data={logout} />
            <button onClick={() => logout.mutate()}>logout</button>
            {isError(logout.error) && <p style={{color: 'red'}}>Error: {logout.error.message}</p>}
        </>
    )
}

UseAuthHelper.getTemplateName = () => 'UseAuthHelper'

export default UseAuthHelper
