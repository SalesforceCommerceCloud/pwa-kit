/*
 * Copyright (c) 2025, salesforce.com, inc.
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
import {Config} from './types'
import SamplePage from './pages/sample'

// Overridable Imports
// Using the `overridable` loader means that you are opting in to the override module resolution flow. As a result this module
// will be resolved by first looking in the base projects `overrides` folder then the overrides folders of any extensions configured
// after this one. Only if no module is found will the referenced module in this project be used.
import sampleHOC from 'overridable!./components/sample-hoc'

// Others
import extensionMeta from '../extension-meta.json'

class Sample extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    /**
     * Use this method to wrap or enhance your PWA-Kit application using [React higher-order components](https://legacy.reactjs.org/docs/higher-order-components.html).
     * You can use this to add visual treatments to your application, change the props that are supplied to the application component
     * or add things like providers and contexts to be used throughout your app.
     */
    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        return sampleHOC(App)
    }

    /**
     * This method is used to make changes to the PWA-Kit application routes. If your extension adds a new page to the application
     * then you can add it to the router here. The routes passed to this method is an accrued list of routes that have been added
     * from extensions applied before it. It is called during the `getRoutes` phase on both the server and the client.
     *
     * NOTE: If you instead want to modify a list of all the routes, refer to the `beforeRouteMatch` below.
     */
    extendRoutes(routes: RouteProps[]): RouteProps[] {
        return [
            {
                exact: true,
                path: this.getConfig().path,
                component: SamplePage
            },
            ...routes
        ]
    }

    /**
     * This method is used on the server during the rendering pipeline. It's provided a list of all the routes that your application
     * is configured with, including those defined in the base application and those added by all the extensions. You can use this
     * method to modify these routes in any way you want, but you must return an array of routes as a result.
     */
    beforeRouteMatch(allRoutes: RouteProps[]): RouteProps[] {
        return allRoutes
    }
}

export default Sample
