/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {IRouteConfig} from './types'

/**
 * An abstract class representing an Application Extension. This class provides
 * foundational methods and properties for extending an application with additional
 * configuration and routing capabilities. It is designed to be subclassed
 * by other Application Extensions that need to augment the base application, particularly
 * during server and client-side rendering.
 *
 * @abstract
 */
export default abstract class ApplicationExtension {
    private config: Record<string, any>

    /**
     * Constructs a new instance of the ApplicationExtension class.
     *
     * @param {string} [name] - The name of the extension. Defaults to the class name if not provided.
     * @param {Record<string, any>} [config] - The configuration object used to set up the extension.
     */
    constructor(config?: any) {
        this.config = config
    }

    /**
     * Returns the configuration that was used to instantiate this application extension.
     *
     * @protected
     * @returns {Record<string, any>} The configuration object.
     */
    public getConfig(): Record<string, any> {
        return this.config
    }

    /**
     * Returns the name of the extension that will be used for logging.
     *
     * @protected
     * @returns {string} The name of the extension.
     */
    public getName(): string {
        return this.constructor.name
    }

    /**
     * Called during the rendering of the base application on the server and the client.
     * It is predominantly used to enhance the "base" application by wrapping it with React providers.
     *
     * @protected
     * @param {React.ComponentType} App - The base application component.
     * @returns {React.ComponentType} The enhanced application component.
     */
    public extendApp(App: React.ComponentType): React.ComponentType {
        return App
    }

    /**
     * Called during server rendering and client application initialization. This method allows
     * you to modify the routes of the base application, typically used to add new routes pointing
     * at page components added by your application extension.
     *
     * @protected
     * @param {IRouteConfig[]} routes - The base application routes.
     * @returns {IRouteConfig[]} The modified application routes.
     */
    public extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
        return routes
    }
}
