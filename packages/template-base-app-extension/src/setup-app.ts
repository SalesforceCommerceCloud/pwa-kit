/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import loadable from '@loadable/component'
import {ApplicationExtension, IRouteConfig} from '@salesforce/pwa-kit-react-sdk/ssr/universal/extensibility'

import withRedBorder from '*/components/with-red-border'
import {ReactExtensionConfig as Config} from './types'

const SamplePage = loadable(() => import('*/pages/sample'))

const defaultPath: string = '/sample-page'
class Sample extends ApplicationExtension<Config> {
    extendApp(App: React.ComponentType): React.ComponentType {
        return withRedBorder(App)
    }

    extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
        console.log('Extend Routes for ', this.getName())
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
