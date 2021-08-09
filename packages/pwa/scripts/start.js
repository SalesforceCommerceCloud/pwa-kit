#!/usr/bin/env node

/* eslint import/no-commonjs:0 */
/* eslint-env node */
const Promise = require('bluebird')
const _fs = require('fs')
const path = require('path')
const process = require('process')
const program = require('commander')

const childProcess = require('@lerna/child-process')
const execa = require('execa')

const fs = Promise.promisifyAll(_fs)

const resolve = path.resolve
const resolveBin = (name) => resolve(__dirname, '..', 'node_modules', '.bin', name)
const buildPath = resolve(process.cwd(), 'build')
const marker = resolve(buildPath, 'build.marker')
const ssrJS = resolve(buildPath, 'ssr.js')
const packagesPath = resolve(__dirname, '..', '..')

const development = 'development'
const isWindows = process.platform === 'win32'
const nodemon = resolveBin(isWindows ? 'nodemon.cmd' : 'nodemon')
const webpack = resolveBin(isWindows ? 'webpack.cmd' : 'webpack')
const sdkCreateHashManifest = resolveBin(
    isWindows ? 'sdk-create-hash-manifest.cmd' : 'sdk-create-hash-manifest'
)

const spawnStreaming = ({command, args, opts, name}) => {
    return childProcess.spawnStreaming(command, args, opts, name)
}

/**
 * Generate hash manifest that is expected to be in place before starting
 * the app.
 */
const beforeRun = () => {
    return Promise.resolve()
        .then(() =>
            execa(
                sdkCreateHashManifest,
                ['--config', resolve(process.cwd(), 'cache-hash-config.json')],
                {stdio: 'ignore'},
                'sdk-create-hash-manifest'
            )
        )
        .then(() => {
            // Ensure required dirs exist for nodemon and webpack
            if (!fs.existsSync(buildPath)) {
                fs.mkdirSync(buildPath)
                fs.closeSync(fs.openSync(ssrJS, 'w'))
            }
        })
}

/**
 * Return command args for processes that need to run in the background
 * *outside* of this package.
 */
const getCommonCommands = () => {
    return [
        {
            command: 'npm',
            args: ['run', 'start'],
            opts: {cwd: path.resolve(packagesPath, 'connector')},
            name: 'connector'
        }
    ]
}

const runSSR = ({inspect}) => {
    const nodeEnv = process.env.NODE_ENV || development

    return Promise.resolve()
        .then(() => beforeRun())
        .then(() => {
            return [
                {
                    command: webpack,
                    args: [
                        '--mode',
                        nodeEnv,
                        '--watch',
                        '--config',
                        resolve('webpack', 'webpack.config.js')
                    ],
                    opts: {
                        env: Object.assign({}, process.env, {
                            TOUCH_BUILD_MARKER: 1,
                            DEVTOOL: nodeEnv === development ? 'source-map' : 'cheap-source-map'
                        })
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
                        env: Object.assign({}, process.env, {
                            NODE_EXTRA_CA_CERTS: resolve('dev-server', 'localhost.pem')
                        })
                    },
                    name: 'ssr-server'
                },
                ...getCommonCommands()
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
