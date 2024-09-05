/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

export type ExtensionClass<T extends IApplicationExtension> = new (...args: any[]) => T

// TODO: Move this somewhere closer to the router code.
export interface IRouteConfig {
    path: string;
    exact?: boolean;
    component: React.ComponentType<any>
}

/**
 * This is the base interface for all React application extensions, you must follow this interface
 * to succesfully implement a new Application Extension.
 */
export interface IApplicationExtension {
    /**
     * The name of the extension that will be used for logging.
     */
    getName(): string;
    /**
     * Called during the rendering of the base application on the server (/ssr/server/react-rendering.js)
     * and on the client (./ssr/browser/main.js). It is predomenantly use to enhance the "base" application 
     * by wrapping it with React providers.
     */
    extendApp(App: React.ComponentType): React.ComponentType;
    /**
     * Called during server rendering and client application initialiation. This method allows you to modify
     * the routes of the base application. This is typically used to add new routes poting at page components
     * added by your application extension.
     */
    extendRoutes(routes: IRouteConfig[]): IRouteConfig[];
}