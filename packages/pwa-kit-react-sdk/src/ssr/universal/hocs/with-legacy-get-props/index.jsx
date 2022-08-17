/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {getRoutes, routeComponent} from '../../components/route-component'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee it's functionality if used elsewhere.`

/**
 * This higher order component will configure your PWA-Kit application with the legacy getProps API.
 */
const withGetPropsAPI = (Component) => {
    console.log('withGetPropsAPI')
    const wrappedComponentName = Component.displayName || Component.name
    console.log(`Adding getProps API to: `, wrappedComponentName)
    if (wrappedComponentName !== 'App') {
        console.warn(USAGE_WARNING)
    }

    // This will add all the getProps like features to the App component.
    Component = routeComponent(Component)

    const WrappedComponent = ({...passThroughProps}) => {
        return (
            <Component {...passThroughProps} />
        )
    }

    WrappedComponent.getRoutes = () => {
        // NOTE: We need to add logic that will allow use to iteratively enchance the
        // route components.
        return getRoutes()
    }

    /**
     * 
     */
    WrappedComponent.initAppState = async (args) => {
        const {App, AppJSX, route, match, req, res, location} = args 
        console.log('initAppState: ', AppJSX)
        
        // NOTE: This should not be blocking, so lets make it parallel before releasing.
        let wrappeeState
        if (Component.initAppState) {
            wrappeeState = await Component.initAppState()
        }

        const {params} = match
        const components = [App, route.component]
    
        const promises = components
            .map((c) =>
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

    // Expose statics from the wrapped component on the HOC
    hoistNonReactStatic(WrappedComponent, Component)

    WrappedComponent.displayName = `WithQueryClientProvider(${wrappedComponentName})`

    return WrappedComponent
}

export default withGetPropsAPI
