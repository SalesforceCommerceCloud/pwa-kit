#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-env node */

const p = require('path')
const sh = require('shelljs')

sh.set('-e')

const monorepoRoot = p.resolve(__dirname, '..', '..', '..')
const pkgRoot = p.resolve(__dirname, '..')
const verdaccio = p.join(
    require.resolve('verdaccio/bin/verdaccio'),
    '..',
    '..',
    '..',
    '.bin',
    'verdaccio'
)
console.log(verdaccio)

let server

const defaultOpts = {
    fatal: true,
    silent: false,
}

const startServer = async () => {
    const server = sh.exec(`${verdaccio} --config verdaccio.yaml`, {
        ...defaultOpts,
        cwd: pkgRoot,
        async: true,
    })
    await new Promise((resolve) => {
        server.stdout.on('data', (data) => {
            if (data.includes('http address')) {
                // Verdaccio is running
                resolve()
            }
        })
    })
    return server
}

const cleanup = () => {
    if (server) {
        server.kill()
        server = undefined
    }
    sh.rm('-rf', p.join(pkgRoot, 'verdaccio-storage'))
}

export const withLocalNPMRepo = async (fn) => {
    try {
        console.log('Starting up local NPM repository')
        server = await startServer()
        const url = 'http://localhost:4873/'
        sh.exec(
            `npm run lerna -- publish from-package --yes --concurrency 1 --loglevel warn --registry ${url}`,
            {...defaultOpts, cwd: monorepoRoot}
        )
        console.log('Local NPM repository is ready')
        console.log(`Serving on ${url}`)
        await fn(url)
    } finally {
        cleanup()
    }
}

