/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
// import loadable from '@loadable/component'
import {RouteProps} from 'react-router-dom'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-application-extensibility/react'

// Local Imports
import withRedBorder from '*/components/with-red-border'
import {Config} from './types'

// BUG: Laodable isn't working here --> https://gus.lightning.force.com/lightning/_classic/%2Fa07EE00001o9ELVYA2
// const SamplePage = loadable(() => import(/* webpackChunkName: "extension-sample-page-sample" */'./pages/sample'))
import SamplePage from './pages/sample'

const defaultPath: string = '/sample-page'
class Sample extends ApplicationExtension<Config> {
    extendApp<T>(App: React.ComponentType<T>): React.ComponentType<T> {
        return withRedBorder(App)
    }

    extendRoutes(routes: RouteProps[]): RouteProps[] {
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
