/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import loadable from '@loadable/component'
import {
    ApplicationExtension,
    IRouteConfig
} from '@salesforce/pwa-kit-react-sdk/ssr/universal/extensibility'

import {ReactExtensionConfig as Config} from './types'
import withExtendedApp from './components/with-extended-app'

class Translations extends ApplicationExtension<Config> {
    extendApp(App: React.ComponentType): React.ComponentType {
        return withExtendedApp(App)
    }

    extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
        return routes
    }
}

export default Translations
