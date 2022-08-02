/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {LocaleContext, SiteContext, UrlTemplateContext} from '../contexts'

/**
 * Custom React hook to get the function that generates URLs following the App configuration.
 * @returns {{fillUrlTemplate: (function(*, *, *): *)}}
 */
const useUrlTemplate = () => {
    const {fillUrlTemplate: originalFn} = useContext(UrlTemplateContext)
    const context = useContext(UrlTemplateContext)
    if (context === undefined) {
        throw new Error('useUrlTemplate must be used within UrlTemplateProvider')
    }
    const siteContext = useContext(SiteContext)
    const localeContext = useContext(LocaleContext)

    const fillUrlTemplate = (path, site, locale) => {
        return originalFn(
            path,
            site ? site : siteContext?.site?.alias || siteContext?.site?.id,
            locale ? locale : localeContext?.locale
        )
    }
    return {fillUrlTemplate}
}

export default useUrlTemplate
