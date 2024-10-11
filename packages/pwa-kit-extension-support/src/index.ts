/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ApplicationExtensionConfig} from './types'

/**
 * An abstract class representing an Application Extension. This class provides
 * foundational methods and properties for extending an application with additional
 * configuration and routing capabilities. It is designed to be subclassed
 * by other Application Extensions that need to augment the base application, particularly
 * during server and client-side rendering.
 *
 * @abstract
 */
export abstract class ApplicationExtension<Config extends ApplicationExtensionConfig> {
    private config: Config

    /**
     * Constructs a new instance of the ApplicationExtension class.
     *
     * @param config - The configuration object used to set up the extension.
     */
    constructor(config: Config) {
        this.config = config
    }

    /**
     * Returns the configuration that was used to instantiate this application extension.
     *
     * @protected
     * @returns config - The configuration object.
     */
    public getConfig(): Config {
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
}
