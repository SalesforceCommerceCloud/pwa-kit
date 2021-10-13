/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'
import {HOME_HREF} from '../constants'
import pwaKitConfig from '../../pwa-kit-config.json'
import {getSiteAlias} from '../utils/utils'

export const useSiteAlias = () => {
    const location = useLocation()

    if (location.pathname === HOME_HREF) {
        const siteId = pwaKitConfig.app.defaultSiteId
        return getSiteAlias(siteId)
    }

    const siteAlias = location.pathname.split('/')[1]
    return siteAlias
}
