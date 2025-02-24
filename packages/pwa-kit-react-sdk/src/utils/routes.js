/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Transforms a URL mapping from the Shopper Search getUrlMapping API to a routes config.
 * https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-seo?meta=getUrlMapping
 *
 * @param {Object} urlMapping - The URL mapping object.
 * @param {string} urlMapping.resourceType - The type of resource (e.g., 'product', 'category').
 * @param {string} urlMapping.resourceId - The ID of the resource.
 * @param {string} urlMapping.destinationUrl - The destination URL for redirects.
 * @param {Object} resourceableComponentsMap - A map of resource types to React components.
 */
export const transformUrlMappingToRoute = (path, urlMapping, resourceableComponentsMap) => {
    let Component, props

    // Resource type is not defined for redirects with a URL destination
    const isRedirect = !urlMapping.resourceType

    if (isRedirect) {
        Component = Redirect
        props = {
            to: urlMapping.destinationUrl
        }
    } else {
        Component = resourceableComponentsMap[urlMapping.resourceType]
        props = {
            [`${urlMapping.resourceType}Id`]: urlMapping.resourceId
        }
    }

    return {
        path: path,
        // DEVELOPER NOTE: Here we would want to use a Loadable component as to not bloat the home page chunk size.
        component: Component,
        props
    }
}

/**
 * 
 * @param {*} routes 
 * @returns 
 */
export const resolveRoutes = (routes, componentMap, resourceTypeToComponentMap) => {
    const isServerSide = typeof window === 'undefined'
    let configuredRoutes = []
    // TODO: use the config to determine if seoUrlMappingEnabled
    const seoUrlMappingEnabled = true
    // const {config} = getConfig()
    console.log('isServerSide', isServerSide)

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
            const component = componentMap[componentName]
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
                const route = transformUrlMappingToRoute(path, mapping, resourceTypeToComponentMap)
                configuredRoutes = [route, ...routes]
            }
        }
    }
    return configuredRoutes
}
