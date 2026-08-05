/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

import React, {Fragment} from 'react'
import {useTrustedAgentPopupCallback} from '@salesforce/commerce-sdk-react'

/**
 * When the Trusted Agent (Order-on-Behalf) authorize flow runs, the popup lands
 * back on this same-origin `/callback` route with `?code&state` in the URL. Under
 * `Cross-Origin-Opener-Policy: same-origin` the opener can no longer read the
 * popup's location, so `useTrustedAgentPopupCallback` reads this page's own
 * same-origin URL and hands the OAuth result back to the opener out-of-band. It is
 * a no-op when `code`/`state` are absent, so the standard SLAS redirect is
 * unaffected.
 */
const LoginRedirect = () => {
    useTrustedAgentPopupCallback()

    return (
        <Fragment>
            <h1 data-testid="login-redirect-page-heading">Login Redirect</h1>
        </Fragment>
    )
}

LoginRedirect.getTemplateName = () => 'login-redirect'

export default LoginRedirect
