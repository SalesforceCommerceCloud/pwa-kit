/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

import React, {Fragment} from 'react'
import {useIntl} from 'react-intl'

const LoginRedirect = () => {
    const intl = useIntl()
    return (
        <Fragment>
            <h1 data-testid="login-redirect-page-heading">
                {intl.formatMessage({
                    id: 'login-redirect.message.welcome',
                    defaultMessage: 'Login Redirect'
                })}
            </h1>
        </Fragment>
    )
}

LoginRedirect.getTemplateName = () => 'login-redirect'

export default LoginRedirect
