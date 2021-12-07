/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getSitesConfig, getUrlConfig, getDefaultSiteId} from '../utils/utils'
import {HOME_HREF, urlPartPositions} from '../constants'
import {useLocation} from 'react-router-dom'

const useSite = () => {
    const sitesConfig = getSitesConfig()
    const urlConfig = getUrlConfig()
    const {pathname, search} = useLocation()
    const defaultSiteID = getDefaultSiteId()
    const params = new URLSearchParams(search)
    let site
    if (pathname === HOME_HREF && !params.get('site')) {
        return sitesConfig.find((site) => site.id === defaultSiteID)
    }

    const sitePosition = urlConfig['site']
    switch (sitePosition) {
        case urlPartPositions.NONE:
            break
        case urlPartPositions.QUERY_PARAM: {
            const currentSite = params.get('site')
            site = sitesConfig.find((site) => site.alias === currentSite)
            break
        }
        case urlPartPositions.PATH: {
            let currentSite = pathname.split('/')[1]
            site = sitesConfig.find((site) => site.alias === currentSite)
            break
        }
    }

    return site
}
export default useSite
