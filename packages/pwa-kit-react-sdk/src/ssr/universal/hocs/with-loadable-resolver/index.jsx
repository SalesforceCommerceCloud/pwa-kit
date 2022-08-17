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

    const WrappedComponent = ({...passThroughProps}) => {
        return (
            <Component {...passThroughProps} />
        )
    }

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

    WrappedComponent.displayName = `withLoadableResolver(${wrappedComponentName})`

    hoistNonReactStatic(WrappedComponent, Component)

    return WrappedComponent
}

export default withLoadableResolver