/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useParams} from 'react-router-dom'
import pwaKitConfig from '../../pwa-kit-config.json'
import {getSiteAlias} from '../utils/utils'

export const useSiteAlias = () => {
    let {siteAlias} = useParams()

    if (!siteAlias) {
        const siteId = pwaKitConfig.app.defaultSiteId
        return getSiteAlias(siteId)
    }

    return siteAlias
}
