/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'
import {RouteProps} from 'react-router-dom'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/react'

// Local Imports
import withRedBorder from '$/components/with-red-border'
import {Config} from './types'

import SamplePage from './pages/sample'

const defaultPath = '/sample-page'
class Sample extends ApplicationExtension<Config> {
    extendApp<T>(App: React.ComponentType<T>): React.ComponentType<T> {
        return withRedBorder(App)
    }

    extendRoutes(routes: RouteProps[]): RouteProps[] {
        // TODO: reverse this order, and look at other similar files too
        return [
            {
                exact: true,
                path: this.getConfig().path || defaultPath,
                component: SamplePage
            },
            ...routes
        ]
    }
}

export default Sample
