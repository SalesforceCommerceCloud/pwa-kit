/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'

/**
 * The `routeComponent` HOC is automatically used on every component in a project's
 * route-config. It provides an interface, via static methods on React components,
 * that can be used to fetch data on the server and on the client, seamlessly.
 */
const withLoadableResolver = (Component) => {
    /* istanbul ignore next */
    const wrappedComponentName = Component.displayName || Component.name

    if (wrappedComponentName.includes('withLoadableResolver')) {
        return Component
    }

    const WrappedComponent = ({...passThroughProps}) => {
        return <Component {...passThroughProps} />
    }

    hoistNonReactStatic(WrappedComponent, Component)

    /**
     * Get the underlying component this HoC wraps. This handles loading of
     * `@loadable/component` components.
     *
     * @return {Promise<React.Component>}
     */
    WrappedComponent.getComponent = async () => {
        return Component.load
            ? Component.load().then((module) => module.default)
            : Promise.resolve(Component)
    }

    /**
     * Route-components implement `getTemplateName()` to return a readable
     * name for the component that is used internally for analytics-tracking –
     * eg. performance/page-view events.
     *
     * If not implemented defaults to the `displayName` of the React component.
     *
     * @return {Promise<String>}
     */
    WrappedComponent.getTemplateName = async () => {
        return Component.getComponent
            ? Component.getComponent().then((c) =>
                  c.getTemplateName ? c.getTemplateName() : Promise.resolve(wrappedComponentName)
              )
            : Promise.resolve(Component)
    }

    WrappedComponent.displayName = `withLoadableResolver(${wrappedComponentName})`

    return WrappedComponent
}

export default withLoadableResolver
