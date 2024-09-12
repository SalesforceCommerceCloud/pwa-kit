/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import loadable from '@loadable/component'
import {IApplicationExtension, IRouteConfig} from '@salesforce/pwa-kit-react-sdk/ssr/universal/extensibility/types'
import {IConfig} from './types'
import withRedBorder from './components/with-red-border'

const SamplePage = loadable(() => import('./pages/sample-2'))

const defaultPath: string = '/sample-page-2'
class Sample implements IApplicationExtension {
    private config: IConfig;

    constructor(config: IConfig) {
        this.config = config
    }
    
    getName(): string {
        return 'sample'
    }

    extendApp(App: React.ComponentType): React.ComponentType {
        return withRedBorder(App)
    }

    extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
        return [
            {
                exact: true,
                path: this.config?.path || defaultPath,
                component: SamplePage
            },
            ...routes
        ]
    }
}

export default Sample
