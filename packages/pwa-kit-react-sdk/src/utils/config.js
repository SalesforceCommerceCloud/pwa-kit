/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {cosmiconfigSync} from 'cosmiconfig'

/**
 * Returns the express app configuration file in object form. The file will be resolved in the
 * the following order:
 *
 * {deploy_target}.ext - When the DEPLOY_TARGET environment is set (predomenantly on remote environments)
 * a file aptly named after the environment will be loaded first. Examples of this are `production.json`, or
 * `development.json`.
 *
 * local.ext - Only loaded on local development environments, this file is used if you want a custom
 * configuration that will not be used on deployed remote environments.
 *
 * default.ext - If you have no requirement for environment specific configurations the `default`
 * config file will be used.
 *
 * package.json - If none of the files after have been found the `mobify` object defined in the 
 * projects `package.json` file.
 * 

 * Each file marked with `ext` can optionally be terminated with `yml`, `yaml` or
 * `json` in that priority.
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
        ...(isRemote ? [] : ['config/local.yml', 'config/local.yaml', 'config/local.json']),
        'config/default.yml',
        'config/default.yaml',
        'config/default.json',
        'package.json'
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
