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
