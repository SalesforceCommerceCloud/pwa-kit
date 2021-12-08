#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */
const Promise = require('bluebird')
const _fs = require('fs')
const path = require('path')
const process = require('process')
const program = require('commander')
const childProcess = require('@lerna/child-process')
const Ajv = require('ajv')
const AjvMergePlugin = require('ajv-merge-patch/keywords/merge')
const configSchema = require('pwa-kit-react-sdk/config/schema.json')

const config = require('../app/pwa-kit.config.json')

const fs = Promise.promisifyAll(_fs)

const resolve = path.resolve
const resolveBin = (name) => resolve(__dirname, '..', 'node_modules', '.bin', name)
const buildPath = resolve(process.cwd(), 'build')
const marker = resolve(buildPath, 'build.marker')
const ssrJS = resolve(buildPath, 'ssr.js')

const development = 'development'
const isWindows = process.platform === 'win32'
const nodemon = resolveBin(isWindows ? 'nodemon.cmd' : 'nodemon')
const webpack = resolveBin(isWindows ? 'webpack.cmd' : 'webpack')

const spawnStreaming = ({command, args, opts, name}) => {
    return childProcess.spawnStreaming(command, args, opts, name)
}

/**
 * Validate configurations based on pwa-kit-react-sdk schema
 * and custom properties added here. Errors will be thrown when
 * validation fails.
 */
const validateConfig = (config) => {
    const ajv = new Ajv()
    AjvMergePlugin(ajv)

    const customProperties = {
        commerceApi: {
            $id: 'commerceApi',
            title: 'Commerceapi',
            type: 'object',
            required: ['clientId', 'organizationId', 'shortCode', 'siteId'],
            properties: {
                clientId: {
                    $id: 'commerceApi/clientId',
                    title: 'Clientid',
                    type: 'string',
                    default: '',
                    examples: ['11111111-1111-1111-1111-111111111111'],
                    pattern: '^.*$'
                },
                organizationId: {
                    $id: 'commerceApi/organizationId',
                    title: 'Organizationid',
                    type: 'string',
                    default: '',
                    examples: ['f_ecom_zzrf_001'],
                    pattern: '^.*$'
                },
                shortCode: {
                    $id: 'commerceApi/shortCode',
                    title: 'Shortcode',
                    type: 'string',
                    default: '',
                    examples: ['9o7m175y'],
                    pattern: '^.*$'
                },
                siteId: {
                    $id: 'commerceApi/siteId',
                    title: 'Siteid',
                    type: 'string',
                    default: '',
                    examples: ['RefArchGlobal'],
                    pattern: '^.*$'
                }
            }
        },
        einsteinApi: {
            $id: 'einsteinApi',
            title: 'Einsteinapi',
            type: 'object',
            required: ['clientId', 'siteId'],
            properties: {
                clientId: {
                    $id: 'einsteinApi/clientId',
                    title: 'Clientid',
                    type: 'string',
                    default: '',
                    examples: ['11111111-1111-1111-1111-111111111111'],
                    pattern: '^.*$'
                },
                siteId: {
                    $id: 'einsteinApi/siteId',
                    title: 'Siteid',
                    type: 'string',
                    default: '',
                    examples: ['aaij-MobileFirst'],
                    pattern: '^.*$'
                }
            }
        }
    }

    ajv.addSchema(configSchema)

    const valid = ajv.validate(
        {
            $merge: {
                source: {$ref: configSchema.$id},
                with: {
                    required: [...configSchema.required, 'commerceApi', 'einsteinApi'],
                    properties: customProperties
                }
            }
        },
        config
    )

    if (!valid) {
        const message = ajv.errorsText(ajv.errors.filter((e) => e.schemaPath !== '#/$merge'), {
            separator: ', ',
            dataVar: 'config'
        })
        throw new Error(message)
    }
}

/**
 * Generate hash manifest that is expected to be in place before starting
 * the app.
 */
const beforeRun = () => {
    return Promise.resolve().then(() => {
        // Ensure required dirs exist for nodemon and webpack
        if (!fs.existsSync(buildPath)) {
            fs.mkdirSync(buildPath)
            fs.closeSync(fs.openSync(ssrJS, 'w'))
        }
        validateConfig(config)
    })
}

const runSSR = ({inspect}) => {
    const nodeEnv = process.env.NODE_ENV || development

    return Promise.resolve()
        .then(() => beforeRun())
        .then(() => {
            return [
                {
                    command: webpack,
                    args: ['--mode', nodeEnv, '--watch'],
                    opts: {
                        env: process.env
                    },
                    name: 'webpack'
                },
                {
                    command: nodemon,
                    args: [
                        '--watch',
                        marker,
                        '--on-change-only',
                        '--no-colours',
                        '--delay',
                        '0.25',
                        '--',
                        ...(inspect ? ['--inspect=localhost:9229'] : []),
                        ...[ssrJS]
                    ],
                    opts: {
                        env: process.env
                    },
                    name: 'ssr-server'
                }
            ].map(spawnStreaming)
        })
}

program.description('Startup script for the UPWA')

program
    .command('ssr')
    .description('Start the PWA in server-side rendering mode')
    .action(runSSR)
    .option('--inspect', 'Enable debugging (default: false)')

program.parse(process.argv)
