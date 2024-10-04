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

// import withRedBorder from '*/components/with-red-border'
import {ReactExtensionConfig as Config} from './types'

// const SamplePage = loadable(() => import('*/pages/sample'))
// const defaultPath = '/sample-page'

// NOTE: had to rename this home path, so that the wildcard will resolve to the copy found in the app extension.
// Otherwise, it'll resolve to the base project version.
const Home = loadable(() => import('*/pages/home-rra'))

class RetailReactApp extends ApplicationExtension<Config> {
    extendApp(App: React.ComponentType): React.ComponentType {
        // TODO
        // return doSomething(App)
        return App
    }

    // extendAppConfig(AppConfig, locals) {
    //     updateLocals(locals)
    //     // TODO: wrap with additional providers
    //     return withAdditionalProviders(AppConfig, locals)
    // }

    extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
        console.log('Extend Routes for ', this.getName())
        const result = [
            // {
            //     exact: true,
            //     path: this.getConfig().path || defaultPath,
            //     component: SamplePage
            // },
            {
                path: '/',
                component: Home,
                exact: true,
                foo: 'bar'
            },
            ...routes
        ]
        console.log('--- routes', result)
        return result
    }
}

export default RetailReactApp
