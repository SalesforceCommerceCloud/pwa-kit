/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

import React, {Fragment, useEffect} from 'react'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'

// Hooks
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

const LoginRedirect = () => {
    const navigate = useNavigation()
    const [searchParams] = useSearchParams()
    const loginIDPUser = useAuthHelper(AuthHelpers.LoginIDPUser)
    const {data: customer} = useCurrentCustomer()
    /********** Social Login **********/
    useEffect(() => {
        if (searchParams.code && searchParams.usid) {
            loginIDPUser.mutateAsync({
                code: searchParams.code,
                usid: searchParams.usid
            })
        }
    }, [])

    useEffect(() => {
        if (customer?.isRegistered) {
            if (location?.state?.directedFrom) {
                navigate(location.state.directedFrom)
            } else {
                navigate('/account')
            }
        }
    }, [customer?.isRegistered])

    return (
        <Fragment>
            <h1 data-testid="login-redirect-page-heading">Login Redirect</h1>
        </Fragment>
    )
}

LoginRedirect.getTemplateName = () => 'login-redirect'

export default LoginRedirect
