/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    captureAttribution,
    clearAttribution
} from '@salesforce/retail-react-app/app/utils/attribution-utils'

/**
 * Write (and, on opt-out, clear) the first-touch `dw_attribution` marketing-attribution
 * cookie in the browser.
 *
 * Runs client-side — not as an SSR middleware — so it also fires on a CDN document-cache
 * hit (when the SSR handler never runs) and reads this shopper's own `document.referrer`
 * and `location.search`. See `attribution-utils.js` for the full rationale.
 *
 * Reacts to the shopper's tracking-consent state (`dw_dnt`):
 *  - Explicit opt-out (`selectedDnt === true`, i.e. `dw_dnt=1`): clear any existing
 *    cookie and do not capture. This also fires the instant a shopper declines in the
 *    SPA (no full-page navigation needed), so a value captured before opt-out is not
 *    forwarded on a later order.
 *  - Absent (`undefined`) or accepted (`false`) consent: capture first touch
 *    optimistically. `captureAttribution` is write-once, so re-runs are no-ops. Consent
 *    is recorded only AFTER the landing request — by which point the campaign params are
 *    gone from the URL — so gating on an explicit `dw_dnt=0` would never capture anything.
 */
export const useAttribution = () => {
    const {selectedDnt} = useDNT()

    useEffect(() => {
        const cookieDomain = getConfig()?.app?.commerceAPI?.cookieDomain

        if (selectedDnt === true) {
            clearAttribution({cookieDomain})
            return
        }

        captureAttribution({cookieDomain})
    }, [selectedDnt])
}
