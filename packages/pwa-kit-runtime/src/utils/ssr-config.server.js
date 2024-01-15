/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* istanbul ignore next */
const SUPPORTED_FILE_TYPES = ['js', 'yml', 'yaml', 'json']

const IS_REMOTE = Object.hasOwn(process?.env, 'AWS_LAMBDA_FUNCTION_NAME')
const DEPLOY_TARGET = process?.env?.DEPLOY_TARGET || ''

/**
 * Returns the express app configuration file in object form. The file will be resolved in the
 * the following order:
 *
 * `{deploy_target}.{ext}` - When the `DEPLOY_TARGET` environment is set (predominantly on remote environments)
 *  - Default application config file aptly named after the environment will be loaded first.
 *      E.g., `production.json`, or `development.json`.
 *  - Custom config file named with the environment suffix. E.g., `my-config.production.json`,
 *      or `my-config.development.json`
 *  - If the custom config is a directory, default naming conventions will be apply
 *      E.g., `my-config/production.json`, or `my-config/development.json`
 *
 * `local.{ext}` - Only loaded on local development environments
 *  - This file is used if you want a configuration that will not be used on deployed remote environments.
 *  - Custom config file named with the `local` suffix. E.g., `my-config.local.json`
 *  - If the custom config is a directory, default naming conventions will be apply
 *      E.g., `my-config/local.json`
 *
 * `default.{ext}`
 *  - If you have no requirement for environment specific configurations the `default` config file
 *      will be used.
 *  - Custom config file uses its own name. E.g., `my-config.json`
 *  - If the custom config file is a directory, default naming conventions will be apply
 *      E.g., `my-config/default.json`
 *
 * `package.json`
 *  - If none of the files after have been found the `mobify` object defined in the projects
 *      `package.json` file.
 *  - This file only used for default application configuration.
 *
 * Each file marked with `ext` can optionally be terminated with `js`, `yml|yaml` or
 * `json`. The file loaded is also determined based on that precidence of file extension.
 *
 * Custom configuration files should be placed in a sub-directory to avoid environment name conflicts.
 *      E.g., `config/sites/RefArch/my-config.js`, `config/global/my-config.js`
 *
 * @param {object} opts
 * @param {string} [opts.buildDirectory] - Option path to the folder containing the configution.
 *      By default it is the `build` folder when running remotely and the project folder when developing locally.
 * @param {string} [opts.configFile] - Custom config file/path that containing the configution
 *
 * @returns {object} - the application configuration object.
 */
/* istanbul ignore next */
export const getConfig = (opts = {}) => {
    const {buildDirectory, configFile = 'config'} = opts
    const configDirBase = IS_REMOTE ? 'build' : ''
    const searchFrom = buildDirectory || process.cwd() + '/' + configDirBase
    const isCustom = configFile !== 'config'

    const searchPlaces = [
        isCustom && DEPLOY_TARGET && `${configFile}.${DEPLOY_TARGET}`,
        isCustom && !IS_REMOTE && `${configFile}.local`,
        isCustom && `${configFile}`,
        DEPLOY_TARGET && `${configFile}/${DEPLOY_TARGET}`,
        !IS_REMOTE && `${configFile}/local`,
        `${configFile}/default`
    ]
        .reduce((searchPlaces, configFile) => {
            if (configFile) {
                searchPlaces.push(...SUPPORTED_FILE_TYPES.map((ext) => `${configFile}.${ext}`))
            }

            return searchPlaces
        }, [])
        .concat(!isCustom ? ['package.json'] : [])

    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const {cosmiconfigSync} = require('cosmiconfig')

    // Match config files based on the specificity from most to most general.
    const explorerSync = cosmiconfigSync(DEPLOY_TARGET, {
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
            [
                'Application configuration not found!',
                'Possible configuration file locations:',
                ...searchPlaces
            ].join('\n')
        )
    }

    return config
}

/**
 * Gets site specific configurations
 *
 * @param {string} siteId The `siteId` that containing the configution.
 * @param {string} [configFile] Optional `configFile` that containing the configution.
 * @param {object} [opts] Option object used by `getConfig` method
 * @param {string} [opts.buildDirectory] Option path to the folder containing the configution.
 *
 * @returns {object} The configution object
 */
export function getSiteConfig(siteId, {configFile = '', ...opts} = {}) {
    return getConfig({
        ...opts,
        configFile: `config/sites/${siteId}` + (configFile ? `/${configFile}` : '')
    })
}
