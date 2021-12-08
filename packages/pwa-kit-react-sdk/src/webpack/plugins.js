/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import webpack from 'webpack'
import path from 'path'
import fs from 'fs'
import Ajv from 'ajv'
import AjvMergePlugin from 'ajv-merge-patch/keywords/merge'

import schema from '../config/schema.json'

/**
 * Return a NormalModuleReplacementPlugin that is used to override SDK builtins
 * with user code for special overridable components, eg. the Document.
 *
 * @param {Object} options
 * @param {Array} [options.replacements] - An array of objects consisting of a match path
 * and a replacement path.
 * @returns {webpack.NormalModuleReplacementPlugin} a module replacement plugin
 * configured with the passed in file replacements array.
 */
export const createModuleReplacementPlugin = (options = {}) => {
    const replacements = options.replacements || []

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        const replacement = replacements.find(({path}) => resolved.includes(path))

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
 * Watches a webpack build and touches a "build marker" file when all files in the
 * webpack build have been compiled. Tools like nodemon can use the build marker
 * to restart the dev-server, for example.
 */
export class BuildMarkerPlugin {
    /**
     * @constructor
     * @param {Object} options
     * @param {String} [options.filename] - The path of the marker file you want to
     * touch once the current build is complete.
     */
    constructor(options = {}) {
        this.fileName = options.filename || 'build/build.marker'
        this.done = this.done.bind(this)
        this.compile = this.compile.bind(this)
        this.inProgress = 0
    }

    /**
     * Called by webpack when this plugin is attached.
     *
     * @param compiler {Object} the webpack compiler
     */
    apply(compiler) {
        if (compiler.hooks) {
            compiler.hooks.done.tap({name: 'BuildMarkerPlugin'}, this.done)
            compiler.hooks.compile.tap({name: 'BuildMarkerPlugin'}, this.compile)
        } else {
            compiler.plugin('done', this.done)
            compiler.plugin('compile', this.compile)
        }
    }

    /**
     * Called by webpack when a compilation starts.
     */
    compile() {
        this.inProgress += 1
    }

    /**
     * Called by webpack when a compilation ends. "Touches" the marker file when
     * there are no more compilations in progress.
     */
    done() {
        this.inProgress -= 1
        if (!this.inProgress) {
            fs.closeSync(fs.openSync(this.fileName, 'w'))
        }
    }
}

/**
 * Validate configurations
 */
export class PwaKitConfigPlugin {
    /**
     * @constructor
     * @param {String} [options.path] - The relative path of the config file
     * @param {Object[]} [options.customSchemas] - The object that include
     * custom property schemas, you want to use this when you extend the schema.
     * @param {String} [options.customSchemas.key] - The key of the property.
     * @param {Boolean} [options.customSchemas.required] - Required.
     * @param {Object} [options.customSchemas.schema] - The JSON schema for the
     * custom property.
     */
    constructor(options = {}) {
        this.path = options.path || './pwa-kit.config.json'
        this.customSchemas = options.customSchemas || []
    }

    /**
     * Called by webpack when this plugin is attached.
     *
     * @param compiler {Object} the webpack compiler
     */
    apply(compiler) {
        compiler.hooks.compilation.tap('PwaKitConfigPlugin', (compilation) => {
            const config = this.getConfig(compiler)
            try {
                this.validate(config)
            } catch (e) {
                compilation.errors.push(e)
            }
        })
    }

    getConfig(compiler) {
        const {fileSystem} = compiler.inputFileSystem
        const absolutePath = path.resolve(this.path)
        let configFile
        try {
            configFile = fileSystem.readFileSync(absolutePath)
        } catch (e) {
            throw new Error(`Missing PWA Kit config file, the file is required: ${absolutePath}`)
        }
        return JSON.parse(configFile)
    }

    /**
     * Validate configurations based on pwa-kit-react-sdk schema
     * and custom properties added here. Errors will be thrown when
     * validation fails.
     */
    validate(config) {
        const ajv = new Ajv()
        AjvMergePlugin(ajv)
        ajv.addSchema(schema)
        let valid

        if (this.customSchemas.length) {
            const required = [...schema.required]
            const properties = this.customSchemas.reduce((prev, curr) => {
                if (curr.required) {
                    required.push(curr.key)
                }
                return {...prev, [curr['key']]: curr.schema}
            }, {})
            valid = ajv.validate(
                {
                    $merge: {
                        source: {$ref: schema.$id},
                        with: {
                            required,
                            properties
                        }
                    }
                },
                config
            )
        } else {
            valid = ajv.validate(schema, config)
        }

        if (!valid) {
            const message = ajv.errorsText(ajv.errors.filter((e) => e.schemaPath !== '#/$merge'), {
                separator: ', ',
                dataVar: 'config'
            })
            throw new Error(message)
        }
    }
}
