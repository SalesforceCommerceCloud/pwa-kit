/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* istanbul ignore next */
const SUPPORTED_FILE_TYPES = ['js', 'yml', 'yaml', 'json']

const IS_REMOTE = Object.prototype.hasOwnProperty.call(process.env, 'AWS_LAMBDA_FUNCTION_NAME')

/**
 * The implementation of getConfig below is expensive as it performs a file lookup.
 *
 * Since the environment config will not change unless the bundle is redeployed,
 * this global variable helps prevent unnecessary file lookups when the server calls getConfig multiple times.
 */
let memoizedConfig

/**
 * Returns the express app configuration file in object form. The file will be resolved in the
 * the following order:
 *
 * {deploy_target}.ext - When the DEPLOY_TARGET environment is set (predominantly on remote environments)
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
 * Each file marked with `ext` can optionally be terminated with `js`, `yml|yaml` or
 * `json`. The file loaded is also determined based on that precidence of file extension.
 *
 * @param {Object} opts.buildDirectory - Option path to the folder containing the configution. Byt default
 * it is the `build` folder when running remotely and the project folder when developing locally.
 * @returns - the application configuration object.
 */
/* istanbul ignore next */
export const getConfig = (opts = {}) => {
    if (memoizedConfig) return memoizedConfig

    const {buildDirectory} = opts
    const configDirBase = IS_REMOTE ? 'build' : ''
    let targetName = process?.env?.DEPLOY_TARGET || ''
    const targetSearchPlaces = SUPPORTED_FILE_TYPES.map((ext) => `config/${targetName}.${ext}`)
    const localeSearchPlaces = SUPPORTED_FILE_TYPES.map((ext) => `config/local.${ext}`)
    const defaultSearchPlaces = SUPPORTED_FILE_TYPES.map((ext) => `config/default.${ext}`)

    const searchFrom = buildDirectory || process.cwd() + '/' + configDirBase

    // Combined search places.
    const searchPlaces = [
        ...(targetName ? targetSearchPlaces : []),
        ...(!IS_REMOTE ? localeSearchPlaces : []),
        ...defaultSearchPlaces,
        'package.json'
    ]

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {cosmiconfigSync} = require('cosmiconfig')

    // Match config files based on the specificity from most to most general.
    const explorerSync = cosmiconfigSync(targetName, {
        packageProp: 'mobify',
        searchPlaces: searchPlaces,
        loaders: {
            '.js': (filepath) => {
                // Because `require` is bootstrapped by webpack, the builtin
                // loader for `.js` files doesn't work. We have to ensure we use
                // the right `require`.
                const _require = eval('require')
                const result = _require(filepath)

                return result
            }
        }
    })

    // Load the config synchronously using a custom "searchPlaces".
    const {config} = explorerSync.search(searchFrom) || {}

    if (!config) {
        throw new Error(
            `Application configuration not found!\nPossible configuration file locations:\n${searchPlaces.join(
                '\n'
            )}`
        )
    }

    memoizedConfig = config
    return config
}
