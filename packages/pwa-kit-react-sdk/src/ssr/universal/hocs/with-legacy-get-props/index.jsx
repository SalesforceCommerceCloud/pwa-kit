/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {routeComponent} from '../../components/route-component'
import withLoadableResolver from '../with-loadable-resolver'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee its functionality if used elsewhere.`

/**
 * This higher order component will configure your PWA-Kit application with the legacy getProps API.
 */
const withGetPropsAPI = (Component) => {
    // This will add all the getProps like features to the App component.
    Component = routeComponent(withLoadableResolver(Component))

    const wrappedComponentName = Component.displayName || Component.name

    if (wrappedComponentName !== 'App') {
        console.warn(USAGE_WARNING)
    }

    const WrappedComponent = ({...passThroughProps}) => {
        return <Component {...passThroughProps} />
    }

    // Expose statics from the wrapped component on the HOC
    hoistNonReactStatic(WrappedComponent, Component)

    /**
     *
     * @param {*} routes
     * @returns
     */
    WrappedComponent.enhanceRoutes = (routes = [], isPage, locals) => {
        routes = Component.enhanceRoutes ? Component.enhanceRoutes(routes) : routes

        return routes.map(({component, ...rest}) => ({
            component: component ? routeComponent(component, isPage, locals) : component,
            ...rest
        }))
    }

    /**
     *
     * @param {*} args
     * @returns
     */
    WrappedComponent.resolveAPIState = async (args) => {
        const {App, route, match, req, res, location} = args

        // NOTE: This should not be blocking, so lets make it parallel before releasing.
        let wrappeeState
        if (Component.resolveAPIState) {
            wrappeeState = await Component.resolveAPIState()
        }

        const {params} = match
        const components = [App, route.component]

        const promises = components.map((c) =>
            c.getProps
                ? c.getProps({
                      req,
                      res,
                      params,
                      location
                  })
                : Promise.resolve({})
        )
        let returnVal = {}

        try {
            const [appProps, pageProps] = await Promise.all(promises)
            const appState = {
                appProps,
                pageProps
            }

            returnVal = {
                error: undefined,
                appState: {
                    ...appState,
                    ...wrappeeState?.appState
                }
            }
        } catch (error) {
            returnVal = {
                error: logAndFormatError(error || new Error()),
                appState: {}
            }
        }

        return returnVal
    }

    WrappedComponent.displayName = `withGetPropsAPI(${wrappedComponentName})`

    return WrappedComponent
}

export default withGetPropsAPI
