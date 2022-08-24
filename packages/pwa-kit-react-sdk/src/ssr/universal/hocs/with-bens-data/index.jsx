/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import withLoadableResolver from '../with-loadable-resolver'
import {compose} from '../../utils'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee its functionality if used elsewhere.`
const STATE_KEY = '__BENS_DATA__'

/**
 * This higher order component will configure your PWA-Kit application with React Query. Uses of
 * the `useQuery` hook will also work server-side.
 * 
 * @param {*} Component 
 * @returns 
 */
const withBensData = (Component) => {
    // Component = withLoadableResolver(Component)
    Component = 
        compose(
            withLoadableResolver
        )(Component)
        
    const wrappedComponentName = Component.displayName || Component.name

    // NOTE: Is this a reliable way to determine the component type (e.g. will this work in prodution
    // when code is minified?)
    if (!wrappedComponentName.includes('App')) {
        console.warn(USAGE_WARNING)
    }

    const WrappedComponent = ({...passThroughProps}) => {
        return <Component {...passThroughProps} />
    }

    // Expose statics from the wrapped component on the HOC
    // NOTE: THIS MUST COME BEFORE WE DEFINE ANY NEW CLASS STATIC FUNCTIONS.
    hoistNonReactStatic(WrappedComponent, Component)


    /**
     *
     * @param {*} routes
     * @returns
     */
    WrappedComponent.enhanceRoutes = (routes = []) => {
        routes = Component.enhanceRoutes ? Component.enhanceRoutes(routes) : routes

        return routes
    }

    /**
     *
     * @param {*} args
     * @returns
     */
    WrappedComponent.getDataPromises = (args) => {
        const dataPromise = Promise.resolve({[STATE_KEY]: {greeting: 'hello jello'}})
        let promises = [dataPromise]
        
        if (Component.getDataPromises) {
            promises = [...promises, ...Component.getDataPromises(args)]
        }

        return promises
    }

    WrappedComponent.displayName = `withBensData(${wrappedComponentName})`

    return WrappedComponent
}

export default withBensData
