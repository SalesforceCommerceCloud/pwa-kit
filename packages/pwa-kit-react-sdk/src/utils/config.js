/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {cosmiconfigSync} from 'cosmiconfig'

/**
 * Returns the express app configuration file in object form. The object resolution will
 * be as follows (from highest to lowest priority):
 *
 * > {target_name}.ext
 * > local.ext
 * > default.ext
 * > package.json (mobify.key)
 *
 * Each file marked with `ext` can optionally be terminated with `yml`, `yaml` or
 * `json` in that priority.
 *
 * NOTE: This is an isomorphic function, when run on the browser the config returned will
 * be the value serialized in the html.
 *
 * @returns - the application configuration object.
 */
/* istanbul ignore next */
export const loadConfig = () => {
    const isRemote = Object.prototype.hasOwnProperty.call(process.env, 'AWS_LAMBDA_FUNCTION_NAME')
    let moduleName = process?.env?.DEPLOY_TARGET || ''

    // Search options.
    const searchPlaces = [
        `config/${moduleName}.yml`,
        `config/${moduleName}.yaml`,
        `config/${moduleName}.json`,
        `config/local.yml`,
        `config/local.yaml`,
        `config/local.json`,
        `config/default.yml`,
        `config/default.yaml`,
        `config/default.json`,
        `package.json`
    ]

    // Match config files based on the specificity from most to most general.
    const explorerSync = cosmiconfigSync(moduleName, {
        packageProp: 'mobify',
        searchPlaces: searchPlaces.map((path) => (isRemote ? `build/${path}` : path))
    })

    // Load the config synchronously using a custom "searchPlaces".
    const {config} = explorerSync.search() || {}

    if (!config) {
        throw new Error(
            `Application configuration not found!\nPossible configuration file locations:\n${searchPlaces.join(
                '\n'
            )}`
        )
    }

    return config
}
