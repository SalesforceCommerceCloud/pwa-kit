/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useContext} from 'react'
import {MultiSiteContext} from '@salesforce/retail-react-app/app/contexts'

/**
 * Custom React hook to get the function that returns usefule multi-site values, the site, the locale and
 * the funtion used to build URLs following the App configuration.
 * @returns {{site, locale, buildUrl: (function(*, *, *): *)}}
 */
const useMultiSite = () => {
    const context = useContext(MultiSiteContext)
    if (context === undefined) {
        throw new Error('useMultiSite must be used within MultiSiteProvider')
    }
    const {buildUrl: originalFn, site, locale} = context

    const buildUrl = useCallback(
        (path, siteRef, localeRef) => {
            return originalFn(
                path,
                siteRef ? siteRef : site?.alias || site?.id,
                localeRef ? localeRef : locale?.alias || locale?.id
            )
        },
        [originalFn, site, locale]
    )
    return {site, locale, buildUrl}
}

export default useMultiSite
