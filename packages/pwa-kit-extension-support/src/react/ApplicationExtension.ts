/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {RouteProps} from 'react-router-dom'

// Local
import {ApplicationExtension as ApplicationExtensionBase} from ".."

// Types
import {ApplicationExtensionConfig} from "../types"

// type GenericHocType<C> = (component: React.ComponentType<C>) => React.ComponentType<C>

/**
 * An abstract class representing an Application Extension. This class provides
 * foundational methods and properties for extending an application with additional
 * configuration and routing capabilities. It is designed to be subclassed
 * by other Application Extensions that need to augment the base application, particularly
 * during server and client-side rendering.
 *
 * @abstract
 */
export class ApplicationExtension<Config extends ApplicationExtensionConfig> extends ApplicationExtensionBase<Config>{
    /**
     * Called during the rendering of the base application on the server and the client.
     * It is predominantly used to enhance the "base" application by wrapping it with React providers.
     *
     * @protected
     * @param App - The base application component.
     * @returns EnhancedApp - The enhanced application component.
     */
    public extendApp<T extends React.ComponentType<T>>(App: React.ComponentType<T>): React.ComponentType<T> {
        return App
    }

    /**
     * Called during server rendering and client application initialization. This method allows
     * you to modify the routes of the base application, typically used to add new routes pointing
     * at page components added by your application extension.
     *
     * @protected
     * @param routes - The base application routes.
     * @returns routes - The modified application routes.
     */
    public extendRoutes(routes: RouteProps[]): RouteProps[] {
        return routes
    }
}