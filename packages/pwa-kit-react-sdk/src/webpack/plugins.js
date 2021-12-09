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

import schema from '../schemas/sdk-config.json'

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
 * This webpack plugin takes pwa kit configuration from the project,
 * and validate the config object against the schema. It also supports
 * schema extension which allow users to add custom schemas.
 */
export class PwaKitConfigPlugin {
    // the path is relative to project directory
    CONFIG_PATH = './pwa-kit.config.json'
    SCHEMA_PATH = './pwa-kit.config.schema.json'

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
                const customSchema = this.getCustomSchema(compiler)
                this.validate(config, customSchema)
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
            console.warn(`Warning: PWA Kit config file (pwa-kit.config.json) is not found.`)
        }
        try {
            return file ? JSON.parse(file) : undefined
        } catch {
            throw new Error('PWA Kit config file (pwa-kit.config.json) contains invalid JSON data.')
        }
    }

    /**
     * Find the custom schema file from project and return the value.
     *
     * @param compiler {Object} the webpack compiler
     * @returns {object} - The custom JSON schema object
     */
    getCustomSchema(compiler) {
        let file
        try {
            file = this.getFile(compiler, this.SCHEMA_PATH)
        } catch (e) {
            // No need to throw error
            // because custom schema is optional
        }
        try {
            return file ? JSON.parse(file) : undefined
        } catch {
            throw new Error(
                'PWA Kit custom config schema file (pwa-kit.config.schema.json) contains invalid JSON data.'
            )
        }
    }

    /**
     * Validate configurations based on pwa-kit-react-sdk schema
     * and custom schema. Errors will be thrown when validation fails.
     *
     * @param config {Object} - the configuration object
     * @param customSchema {Object} - The custom JSON schema object
     */
    validate(config, customSchema) {
        const ajv = new Ajv()
        AjvMergePlugin(ajv)
        ajv.addSchema(schema)
        let valid

        if (customSchema) {
            valid = ajv.validate(
                {
                    $merge: {
                        source: {$ref: schema.$id},
                        with: {
                            properties: customSchema
                        }
                    }
                },
                config
            )
        } else {
            valid = ajv.validate(schema, config)
        }

        if (!valid) {
            // when we use the ajv merge functionality
            // ajv will always append an extra duplicated error
            // we don't want that, so we filter that out
            const message = ajv.errorsText(ajv.errors.filter((e) => e.schemaPath !== '#/$merge'), {
                separator: ', ',
                dataVar: 'config'
            })
            throw new Error(message)
        }
    }
}
