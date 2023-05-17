/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {routes} from 'retail-react-app/app/routes'
import {configureRoutes} from 'retail-react-app/app/utils/routes-utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

export default () => {
    const config = getConfig()
    return configureRoutes(routes, config, {
        ignoredRoutes: ['/callback', '*']
    })
}