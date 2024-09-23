/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Application} from './types'

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
     * @param config - The configuration object used to set up the extension.
     */
    constructor(config?: any) {
        this.config = config
    }

    /**
     * Returns the configuration that was used to instantiate this application extension.
     *
     * @protected
     * @returns config - The configuration object.
     */
    public getConfig(): Record<string, any> {
        return this.config
    }

    /**
     * Returns the name of the extension that will be used for logging.
     *
     * @protected
     * @returns name - The name of the extension.
     */
    public getName(): string {
        return this.constructor.name
    }

    /**
     * Called during the rendering of the base application on the server and the client.
     * It is predominantly used to enhance the "base" application by wrapping it with React providers.
     *
     * @protected
     * @param App - The base application component.
     * @returns EnhancedApp - The enhanced application component.
     */
    public extendApp(App: Application): Application {
        return App
    }
}
