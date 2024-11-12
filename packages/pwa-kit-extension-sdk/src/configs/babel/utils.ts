/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fse from 'fs-extra'
import * as p from 'path'
import {getConfiguredExtensions} from '../../shared/utils/helpers'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Constants used for building Babel extensibility arguments:
 *
 * IGNORE_PATH: Provides a placeholder path that does not exist, used in Babel's `--ignore`
 * option to prevent processing of any unintended files by specifying a path that cannot match
 * any actual file. This effectively disables Babel's ignore behavior when no other paths are specified.
 *
 * SERVER_PATH: Absolute path to the server entry point (`build-remote-server.js`) within the
 * `@salesforce/pwa-kit-runtime` package. Required for Babel processing to ensure that server-side
 * code, especially for SSR, is correctly transpiled as part of the extensibility setup.
 *
 * PLACEHOLDER_PATH: Absolute path to `application-extensions.js`, a placeholder file in the
 * `@salesforce/pwa-kit-extension-sdk` package. This file acts as a stand-in for extensions
 * that may or may not be present, allowing Babel to process extensibility placeholders even
 * if no actual extensions are added.
 */
const NODE_MODULES_PATH = 'node_modules'
const IGNORE_PATH = `${NODE_MODULES_PATH}/does_not_exist`
const SERVER_PATH = `${NODE_MODULES_PATH}/@salesforce/pwa-kit-runtime/ssr/server/build-remote-server.js`
const PLACEHOLDER_PATH = `${NODE_MODULES_PATH}/@salesforce/pwa-kit-extension-sdk/express/placeholders/application-extensions.js`

/**
 * Builds Babel extensibility arguments for processing specific files and paths.
 * Accessing files via "node_modules" ensures compatibility in both mono-repos and
 * developers' environments working on templates with extensibility. Avoids relative paths
 * or symlinked paths that Babel doesn't support by using realpathSync.
 */
export const buildBabelExtensibilityArgs = () => {
    const extensions = getConfiguredExtensions(getConfig())

    const serverPath = fse.realpathSync(p.resolve(SERVER_PATH))
    const placeHolderPath = fse.realpathSync(p.resolve(PLACEHOLDER_PATH))

    const extensionSrcPaths =
        extensions.length > 0
            ? extensions.map(([packageName]) =>
                  fse.realpathSync(p.resolve(`${NODE_MODULES_PATH}/${packageName}/src`))
              )
            : []

    const extensionsPathsStr = extensionSrcPaths.length > 0 ? `,${extensionSrcPaths.join(',')}` : ''

    return `--ignore "${IGNORE_PATH}" --only "app/**,${serverPath},${placeHolderPath}${extensionsPathsStr}/**"`
}
