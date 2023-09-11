/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {IFRAME_HOST_ALLOW_LIST} from './constant'

/**
 * Utility to determine if you are on the browser (client) or not.
 */
export const onClient = (): boolean => typeof window !== 'undefined'

export const getCookieSameSiteAttribute = () => {
    // document.location?.ancestorOrigins?.[0] will provide the parent host url, but it only works for Chrome and Safari.
    // Firefox does not have this field. document.referrer is common use for parent url, but it could be less reliable.
    // It is best to use it a fallback option for Firefox
    const parentUrl = document.location?.ancestorOrigins?.[0] || document.referrer
    const parentHostName = parentUrl ? new URL(parentUrl).hostname : ''
    const isParentSiteTrusted = IFRAME_HOST_ALLOW_LIST.includes(parentHostName)
    const isLocalHost = window.location.hostname === 'localhost'

    return !isLocalHost && isParentSiteTrusted ? 'none' : 'Lax'
}
