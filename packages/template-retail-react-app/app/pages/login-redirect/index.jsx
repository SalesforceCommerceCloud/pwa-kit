/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

import React, {Fragment, useEffect} from 'react'
import {
    TRUSTED_AGENT_POPUP_MESSAGE_TYPE,
    TRUSTED_AGENT_POPUP_CHANNEL
} from '@salesforce/commerce-sdk-react'

/**
 * When the Trusted Agent (Order-on-Behalf) authorize flow runs, the popup lands
 * back on this same-origin `/callback` route with `?code&state` in the URL. Under
 * `Cross-Origin-Opener-Policy: same-origin` the opener can no longer read the
 * popup's location, so this page which can read its own same-origin URL must
 * deliver the OAuth result back to the opener out-of-band.
 *
 * We post to `window.opener` (primary) and also broadcast on a same-origin
 * BroadcastChannel (fallback for when the opener reference is unusable after a
 * COOP-induced browsing-context-group switch). `useTrustedAgent` listens for both.
 */
const deliverTrustedAgentResult = () => {
    if (typeof window === 'undefined') {
        return
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    // Not a trusted-agent callback (no OAuth result present) — nothing to deliver.
    if (!code || !state) {
        return
    }

    const message = {type: TRUSTED_AGENT_POPUP_MESSAGE_TYPE, code, state}

    // Primary: post to the opener, scoped to our own origin so the message is not
    // exposed to any other document.
    if (window.opener) {
        try {
            window.opener.postMessage(message, window.location.origin)
        } catch (e) {
            /* opener may be unavailable/severed; the broadcast fallback covers this */
        }
    }

    // Fallback: same-origin BroadcastChannel survives a COOP context-group switch.
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel(TRUSTED_AGENT_POPUP_CHANNEL)
            channel.postMessage(message)
            channel.close()
        } catch (e) {
            /* environment without BroadcastChannel support */
        }
    }
}

const LoginRedirect = () => {
    useEffect(() => {
        deliverTrustedAgentResult()
    }, [])

    return (
        <Fragment>
            <h1 data-testid="login-redirect-page-heading">Login Redirect</h1>
        </Fragment>
    )
}

LoginRedirect.getTemplateName = () => 'login-redirect'

export default LoginRedirect
