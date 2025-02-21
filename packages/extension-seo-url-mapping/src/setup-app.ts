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
import {
    ApplicationExtension,
    SliceInitializer,
    withApplicationExtensionStore
} from '@salesforce/pwa-kit-extension-sdk/react'
import {applyHOCs} from '@salesforce/pwa-kit-extension-sdk/react/utils'

// Local Imports
import {Config} from './types'
import {configureRoutes, transformUrlMappingToRoute} from './utils/routes-utils'

// Pages
import * as Pages from '@salesforce/extension-chakra-storefront/pages'

// Overridable Imports
// Using the `overridable` loader means that you are opting in to the override module resolution flow. As a result this module
// will be resolved by first looking in the base projects `overrides` folder then the overrides folders of any extensions configured
// after this one. Only if no module is found will the referenced module in this project be used.
import sampleHOC from 'overridable!./components/sample-hoc'

// Others
import extensionMeta from '../extension-meta.json'

interface StoreSlice {
    count: number
    increment: () => void
    decrement: () => void
}

// This is safe to delete if your extension does not use state. If you aren't using this, ensure you remove the
// `withApplicationExtensionStore` usage below as well.
const sliceInitializer: SliceInitializer<StoreSlice> = (set) => ({
    count: 0,
    increment: () => set((state) => ({count: state.count + 1})),
    decrement: () => set((state) => ({count: state.count - 1}))
})

const isServerSide = typeof window === 'undefined'

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
        const HOCs = [
            // Example higher-order component, this can be safely removed.
            sampleHOC,
            // Optionally include state for this extension using `withApplicationExtensionStore`
            (component: React.ComponentType<any>) =>
                withApplicationExtensionStore(component, {
                    id: extensionMeta.id,
                    initializer: sliceInitializer
                })
        ]

        return applyHOCs(App, HOCs)
    }

    /**
     * This method is used to make changes to the PWA-Kit application routes. If your extension adds a new page to the application
     * then you can add it to the router here. The routes passed to this method is an accrued list of routes that have been added
     * from extensions applied before it. It is called during the `getRoutes` phase on both the server and the client.
     *
     * NOTE: If you instead want to modify a list of all the routes, refer to the `beforeRouteMatch` below.
     */
    extendRoutes(routes: RouteProps[]): RouteProps[] {
        return routes
    }

    /**
     * This method is used on the server during the rendering pipeline. It's provided a list of all the routes that your application
     * is configured with, including those defined in the base application and those added by all the extensions. You can use this
     * method to modify these routes in any way you want, but you must return an array of routes as a result.
     */
    beforeRouteMatch(allRoutes: RouteProps[]): RouteProps[] {
        let configuredRoutes: RouteProps[] = []

        const seoUrlMappingEnabled = true
        // console.log('---- beforeRouteMatch CLIENT! allRoutes:')
        // allRoutes.forEach((route: RouteProps) => {
        //     console.log(route.path)
        // })
        console.log('---beforeRouteMatch isClient', !isServerSide)
        if (!isServerSide) {
            // CLIENT!
            // Router Deserialization
            const _routes = window.__CONFIG__.app.routes
            // console.log('---- beforeRouteMatch CLIENT! window.__CONFIG__.app.routes:')
            // _routes.forEach((route: RouteProps) => {
            //     console.log(route)
            // })
            configuredRoutes = _routes.map(({path, componentName, componentProps}) => {
                // DEVELOPER NOTE: We previously tried to dynamically load the component using the path to map to the
                // filename and use import, but I couldn't get that to work. So here we are using the original routes
                // array to find the component for a given path from the serialized route config. It doesn't completely
                // work as it will remove the configured routes as they don't match the path. This should be done in
                // another way.
                // console.log('--- beforeRouteMatch in _routes.map:', path, 'componentName:', componentName, 'componentProps:', componentProps)
                // TODO: Pass the components though the configuration
                // - use a js file for configuration to import the files
                const component = Pages[componentName]
                if (!component) {
                    return
                }
                // if (componentProps) {
                //     // DEVELOPER NOTE: This is where you should determine the component
                //     const ComponentClass: React.ComponentType<any> = SamplePage
                //     component = () => <ComponentClass {...componentProps}/>
                // }
                return {
                    path,
                    exact: true,
                    component
                }
            })
            configuredRoutes = configuredRoutes.filter((route) => !!route)
            // DEVELOPER NOTES: ensure routes work with sites/locale
            // console.log('--- beforeRouteMatch: config', this.getConfig())
            // configuredRoutes = configureRoutes(configuredRoutes, this.getConfig(), {
            //     ignoredRoutes: ['/callback', '*']
            // })
        } else {
            // SERVER!
            if (seoUrlMappingEnabled) {
                // DEVELOPER NOTES: Replace with actual getUrlMapping call
                // For now we Mock a response that returns a resourceType category
                const mapping = {
                    copySourceParams: false,
                    destinationUrl: '/s/RefArch/search?lang=en_US&cgid=newarrivals',
                    resourceId: 'newarrivals',
                    resourceType: 'category',
                    statusCode: '301'
                }
                if (mapping) {
                    // DEVELOPER NOTES: Here we'd make the getUrlMapping API call
                    const path = '/category/top-seller'
                    const route = transformUrlMappingToRoute(path, mapping)
                    configuredRoutes = [route, ...allRoutes]
                }
            }
        }
        console.log('---- beforeRouteMatch configuredRoutes')
        configuredRoutes.forEach((route: RouteProps) => {
            console.log(route.path)
        })
        return configuredRoutes
    }
}

export default Sample
