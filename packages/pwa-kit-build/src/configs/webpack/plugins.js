/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import webpack from 'webpack'
import path, {resolve} from 'path'
import fs from 'fs'
import Ajv from 'ajv'

import schema from '../../schemas/sdk-config.json'

/**
 * Allows users to override special SDK components by placing override
 * files in certain magic locations in a project.
 *
 * @param {string} projectDir - absolute path to the project root.
 * @returns {webpack.NormalModuleReplacementPlugin}
 */
export const createModuleReplacementPlugin = (projectDir) => {
    const overridables = [
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_app-config$/,
            newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index')
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_document$/,
            newPath: resolve(projectDir, 'app', 'components', '_document', 'index')
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_app$/,
            newPath: resolve(projectDir, 'app', 'components', '_app', 'index')
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_error$/,
            newPath: resolve(projectDir, 'app', 'components', '_error', 'index')
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/routes$/,
            newPath: resolve(projectDir, 'app', 'routes')
        }
    ]
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    const replacements = []
    overridables.forEach(({path, newPath}) => {
        extensions.forEach((ext) => {
            const replacement = newPath + ext
            if (fs.existsSync(replacement)) {
                replacements.push({path, newPath: replacement})
            }
        })
    })

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)

        const replacement = replacements.find(({path}) => resolved.match(path))

        const sdkPaths = [
            path.join('packages', 'pwa-kit-react-sdk'),
            path.join('node_modules', 'pwa-kit-react-sdk')
        ]

        const requestedFromSDK = sdkPaths.some((p) => resource.context.includes(p))

        if (requestedFromSDK && replacement) {
            resource.request = replacement.newPath
        }
    })
}

/**
 * This webpack plugin takes pwa kit configuration from the project,
 * and validate the config object against the schema. It also supports
 * schema extension which allow users to add custom schemas.
 */
export class PwaKitConfigPlugin {
    // the path is relative to project directory
    CONFIG_PATH = './pwa-kit.config.json'

    /**
     * Called by webpack when this plugin is attached.
     *
     * @param compiler {Object} the webpack compiler
     */
    apply(compiler) {
        compiler.hooks.compilation.tap('PwaKitConfigPlugin', (compilation) => {
            try {
                const config = this.getConfig(compiler)
                if (!config) {
                    // Project is on older version that
                    // doesn't have the config file
                    return
                }
                this.validate(config)
            } catch (e) {
                compilation.errors.push(e)
            }
        })
    }

    /**
     * Find the file from project based on its relative path.
     *
     * @param compiler {Object} the webpack compiler
     * @param path {String} the relative path from the project directory
     * @returns {String} - The file content
     */
    getFile(compiler, relativePath) {
        const {fileSystem} = compiler.inputFileSystem
        const absolutePath = path.resolve(relativePath)
        const file = fileSystem.readFileSync(absolutePath)
        return file
    }

    /**
     * Find the config file from project and return the value.
     *
     * @param compiler {Object} the webpack compiler
     * @returns {object} - The configuration object
     */
    getConfig(compiler) {
        let file
        try {
            file = this.getFile(compiler, this.CONFIG_PATH)
        } catch (e) {
            // Config file is optional
            // so we swallow the error
            return
        }
        try {
            return file ? JSON.parse(file) : undefined
        } catch {
            throw new Error('PWA Kit config file (pwa-kit.config.json) contains invalid JSON data.')
        }
    }

    /**
     * Validate configurations based on pwa-kit-react-sdk schema
     * and custom schema. Errors will be thrown when validation fails.
     *
     * @param config {Object} - the configuration object
     */
    validate(config) {
        const ajv = new Ajv()
        const valid = ajv.validate(schema, config)

        if (!valid) {
            const message = ajv.errorsText(ajv.errors, {
                separator: ', ',
                dataVar: 'config'
            })
            throw new Error(message)
        }
    }
}
