/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'
import {getAppConfig, getSiteAliasByHostname, getSiteAliasById} from '../utils/utils'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

export const useSiteAlias = () => {
    const appConfig = getAppConfig()
    const {sites, defaultSiteId} = appConfig

    const appOrigin = getAppOrigin()
    const {hostname} = new URL(appOrigin)
    // prioritize returning site alias based on hostname
    const alias = getSiteAliasByHostname(hostname, sites)
    if (alias) {
        return alias
    }

    let {pathname} = useLocation()
    const siteAlias = pathname.split('/')[1]
    // if there is no alias from the url, use the default value from app config
    if (!siteAlias) {
        const alias = getSiteAliasById(defaultSiteId, sites)
        return alias
    }

    return siteAlias
}
