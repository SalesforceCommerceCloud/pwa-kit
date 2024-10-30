/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Local
import {renderTemplate} from '../utils'
import {getApplicationExtensionInfo} from '../../shared/utils'

// Types
import {ApplicationExtensionsLoaderContext} from './types'

// Constants
const DEFAULT_TARGET = 'node'

/**
 * The `extensions-loader` as a mechanism to get all configured extensions for a given pwa-kit
 * application. We use this loader as a simple way to determine what extension code in required in
 * the application bundle, without this we would have to rely on other more complex ways of
 * including application extensions in the bundle, like custom webpack entry points for extension.
 *
 * With this solution we can rely on the fact that all installed application extensions are referenced
 * in code and will be in the bundle.
 *
 * The named export `getExtensions` will only return the application extensions required/configured by
 * the current PWA-Kit application.
 *
 * @returns {string} The string representation of a module exporting all the named application extension modules.
 */
export default function ApplicationExtensibilityLoader(
    this: ApplicationExtensionsLoaderContext
): string {
    // TODO: Add checking for arguments.

    // Get the installed and configured application extensions as well as the requested
    // target type. For web targets the loader takes advantage of react-loadabled but node
    // targets (server) do not require this optimization.
    const data = this.getOptions()

    return renderTemplate(data)
}

/**
 * Generates a Webpack rule for application extensibility, configuring the loader for
 * handling application extensions based on the target (e.g., 'node' for server-side,
 * 'react' for client-side).
 *
 * @param {Object} [options={}] - Options to customize the Webpack rule.
 * @param {Object} [options.loaderOptions={}] - Loader-specific options.
 * @param {string} [options.loaderOptions.target=DEFAULT_TARGET] - The target environment, either 'node' or 'react'.
 * @param {Object} [options.loaderOptions.appConfig] - Optional application configuration to pass to the loader.
 *
 * @returns {Object} A Webpack rule configuration object for handling application extensions.
 */
export const ruleForApplicationExtensibility = (options: any = {}) => {
    const {loaderOptions = {}} = options
    const {target = DEFAULT_TARGET, appConfig} = loaderOptions

    return {
        test: new RegExp(
            `${target === 'node' ? 'express' : 'react'}/placeholders/application-extensions.js`,
            'i'
        ),
        use: {
            loader: '@salesforce/pwa-kit-extension-sdk/configs/webpack/application-extensions-loader',
            options: {
                ...getApplicationExtensionInfo(appConfig),
                target
            }
        }
    }
}
