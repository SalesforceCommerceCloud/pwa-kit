/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

import React, {Fragment} from 'react'

const PwdlessRedirect = () => {
    return (
        <Fragment>
            <h1 data-testid="pwdless-redirect-page-heading">Passwordless Redirect</h1>
            <h1>We just sent a login token to email@email.com</h1>
        </Fragment>
    )
}

PwdlessRedirect.getTemplateName = () => 'pwdless-redirect'

export default PwdlessRedirect
