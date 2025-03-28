/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Local
import {ApplicationExtension as ApplicationExtensionBase} from '../../shared/classes/application-extension-base'
import {cacheMethodResult, isServerSide} from '../utils/helpers'

// Types
import {
    ApplicationExtensionConfig,
    BeforeRouteMatchParams,
    ComponentMap,
    GetRoutesParams,
    RouteProps,
    SerializedExtension
} from '../../types'

export type ReactApplicationExtensionConfig = ApplicationExtensionConfig

/**
 * An abstract class representing an Application Extension. This class provides
 * foundational methods and properties for extending an application with additional
 * configuration and routing capabilities. It is designed to be subclassed
 * by other Application Extensions that need to augment the base application, particularly
 * during server and client-side rendering.
 *
 * @abstract
 */
export class ApplicationExtension<
    Config extends ReactApplicationExtensionConfig
> extends ApplicationExtensionBase<Config> {
    protected _cachedRoutes: RouteProps[] | null = null

    constructor(config: Config) {
        super(config)
        cacheMethodResult(this, 'getRoutesAsync', '_cachedRoutes')
    }

    /**
     * Called during the rendering of the base application on the server and the client.
     * It is predominantly used to enhance the "base" application by wrapping it with React providers.
     *
     * @protected
     * @param App - The base application component.
     * @returns EnhancedApp - The enhanced application component.
     */
    public extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        return App
    }

    /**
     * Called during server rendering and client application initialization. This method allows
     * you to add new routes, typically routes pointing at page components added by your application extension.
     *
     * @protected
     * @returns new routes to be added
     */
    public getRoutes(params: GetRoutesParams): RouteProps[] {
        return []
    }

    /**
     * Called during server rendering and client application initialization. This method allows
     * you to add new routes, typically routes pointing at page components added by your application extension.
     *
     * If you wish to add new routes asynchronously (e.g. via API call), please implement this method.
     *
     * @protected
     * @returns a promise resolving to new routes to be added
     */
    public getRoutesAsync?(params: GetRoutesParams): Promise<RouteProps[]>

    /**
     * Called before route matching is evaluated. This method gives each extension the opportunity
     * to modify the routes knowing that the list of routes passed-in is complete.
     *
     * @protected
     * @param routes - All the application routes from both extensions and base application.
     * @returns routes - The modified application routes.
     */
    public beforeRouteMatch(params: BeforeRouteMatchParams): RouteProps[] {
        const {allRoutes} = params
        return allRoutes
    }

    /**
     * Called on the server to serialize the extension data that will be sent to the client.
     *
     * @returns SerializedExtension - The serialized extension data.
     * @returns null if there's no asynchronous state that needs to be serialized
     * @throws Error if the routes have not been loaded.
     */
    public serialize(): SerializedExtension | null {
        if (typeof this.getRoutesAsync === 'undefined') return null

        if (this._cachedRoutes === null) {
            throw new Error(`Routes have not been loaded. Call getRoutesAsync() before serializing`)
        }
        console.log(
            'serialize(): routes for extension',
            this.getName(),
            'cachedRoutes:',
            this._cachedRoutes
        )
        const serializedRoutes = this._cachedRoutes.map((route) => {
            if (!route.componentName && !route.component) {
                throw new Error(
                    `Route with path "${String(
                        route.path
                    )}" must contain either a componentName or component to be serializable in in the ${this.getName()} extension`
                )
            }

            // Check if the route is already serialized
            if (route.componentName) {
                return route
            }

            if (!route.component?.displayName) {
                throw new Error(
                    `Component for route with path "${String(
                        route.path
                    )}" is missing a displayName in the ${this.getName()} extension`
                )
            }

            return {
                ...route,
                componentName: route.component.displayName,
            }
        })

        console.log('--- serialized', this.getName(), 'extension :', {
            routes: serializedRoutes
        })

        return {
            routes: serializedRoutes
        }
    }

    /**
     * Returns a map of component names to components used for deserializing extension data
     * when `getRoutesAsync()` is asynchronous.
     *
     * This method is required only if `getRoutesAsync()` is asynchronous.
     *
     * It is recommended to use loadable components whenever possible to reduce bundle size.
     *
     * @returns ComponentMap - The map of component names to components.
     */
    public getComponentMap(allRoutes: RouteProps[]): ComponentMap | undefined {
        if (typeof this.getRoutesAsync !== 'undefined') {
            throw new Error(
                `${this.getComponentMap.name} must be defined when getRoutesAsync() is defined in the ${this.getName()} extension`
            )
        }
        return
    }

    /**
     * Called on the client to deserialize the extension data that was serialized on the server.
     *
     * @param serializedExtension - The serialized extension data.
     * @returns DeserializedExtension - The deserialized extension data.
     * @throws Error if getComponentMap() is not defined.
     * @throws Error if the deserialized component cannot be found in the component map.
     */
    public deserialize(componentMap: ComponentMap) {
        if (typeof this.getRoutesAsync === 'undefined') {
            return null
        }

        let serializedRoutes
        if (!isServerSide()) {
            serializedRoutes = window.__EXTENSIONS__[this.getName()].routes
        } else {
            serializedRoutes = this._cachedRoutes
        }

        console.log('JINSU deserialize(): serializedRoutes', serializedRoutes)
        const routes = serializedRoutes?.map(({componentName, ...route}) => {
            if (!componentName) {
                throw new Error(
                    `Missing componentName for the route with path: "${String(
                        route.path
                    )}". Ensure that ${
                        this.serialize.name
                    }() correctly assigns a componentName to the serialized route in the ${this.getName()} extension`
                )
            }

            const component = componentMap[componentName]

            if (!component) {
                throw new Error(
                    `"${componentName}" was not found in the component map. Ensure that getComponentMap() includes a mapping for it in the ${this.getName()} extension`
                )
            }

            if (route.props) {
                // const WrappedComponent = (props: any) => <Component {...props} />
            }

            return {
                ...route,
                component
            }
        })
        console.log('deserialize(): ', this.getName(), 'extension :', {routes})
        this._cachedRoutes = routes || null
        return {routes}
    }
}
