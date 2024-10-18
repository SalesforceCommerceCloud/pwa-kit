/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import {LoaderContext} from 'webpack'
import {PackageJson} from 'type-fest'

// Local
import {renderTemplate} from '../../utils'

// TODO: Move these to a better location.
interface ExtensionsLoaderOptions {
    pkg: PackageJson
    getConfig: () => any
    target: 'node' | 'web'
}

type ExtensionsLoaderContext = LoaderContext<ExtensionsLoaderOptions>

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
module.exports = function (this: ExtensionsLoaderContext): string {
    // TODO: Add some argument checks here.

    return renderTemplate(this.getOptions())
}
