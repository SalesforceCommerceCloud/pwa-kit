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
import {compose} from '../../utils'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee its functionality if used elsewhere.`
const STATE_KEY = '__LEGACY_GET_PROPS__'

/**
 * This higher order component will configure your PWA-Kit application with the legacy getProps API.
 * 
 * @param {*} Component 
 * @returns 
 */
const withGetProps = (Component) => {
    // This will add all the getProps like features to the App component.
    // Component = routeComponent(withLoadableResolver(Component))
    Component = 
        compose(
            withLoadableResolver, 
            routeComponent
        )(Component)

    const wrappedComponentName = Component.displayName || Component.name

    if (!wrappedComponentName.includes('App')) {
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
    WrappedComponent.getDataPromises = (args) => {
        const {App, route, match, req, res, location} = args

        const dataPromise = 
            Promise.resolve()
                .then(() => {
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

                    return Promise.all(promises)
                })
                .then(([appProps, pageProps]) => {
                    return {
                        [STATE_KEY]: {
                            appProps,
                            pageProps
                        }
                    }
                })
        
        let promises = [dataPromise]
        
        if (Component.getDataPromises) {
            promises = [...promises, ...Component.getDataPromises(args)]
        }

        return promises
    }

    WrappedComponent.displayName = `withLegacyGetProps(${wrappedComponentName})`

    return WrappedComponent
}

export default withGetProps
