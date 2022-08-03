/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {MultiSiteContext} from '../contexts'

/**
 * Custom React hook to get the function that generates URLs following the App configuration.
 * @returns {{site, fillUrlTemplate: (function(*, *, *): *), locale}}
 */
const useUrlTemplate = () => {
    const context = useContext(MultiSiteContext)
    if (context === undefined) {
        throw new Error('useUrlTemplate must be used within MultiSiteProvider')
    }
    const {fillUrlTemplate: originalFn, site, locale} = context

    const fillUrlTemplate = (path, siteRef, localeRef) => {
        return originalFn(
            path,
            siteRef ? siteRef : site?.alias || site?.id,
            localeRef ? localeRef : locale
        )
    }
    return {site, locale, fillUrlTemplate}
}

export default useUrlTemplate
