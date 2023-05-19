#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const p = require('path')
const sh = require('shelljs')
const cp = require('child_process')

sh.set('-e')

const main = () => {
    const verdaccioBinary = p.join(__dirname, '..', 'node_modules', '.bin', 'verdaccio')
    const verdaccioConfigDir = p.join(__dirname, '..', 'local-npm-repo')

    // Clear any cached packages from a previous run.
    sh.rm('-rf', p.join(verdaccioConfigDir, 'storage'))
    sh.mkdir(p.join(verdaccioConfigDir, 'storage'))

    let verdaccioServerProcess

    const cleanup = () => {
        console.log('Shutting down local NPM repository')
        // delete process.env['npm_config_registry']
        sh.exec('npm config delete registry')
        verdaccioServerProcess.kill()
    }

    console.log('Starting up local NPM repository')

    verdaccioServerProcess = cp.exec(`${verdaccioBinary} --config config.yaml`, {
        cwd: verdaccioConfigDir,
        stdio: 'inherit',
        env: {
            ...process.env,
            OPENCOLLECTIVE_HIDE: 'true',
            DISABLE_OPENCOLLECTIVE: 'true',
            OPEN_SOURCE_CONTRIBUTOR: 'true'
        }
    })

    verdaccioServerProcess.stdout.on('data', (data) => {
        // we know verdaccio server is up when
        // 'http address' is in log output
        if (data.includes('http address')) {
            console.log('local NPM repository is up')

            sh.exec('npm config set registry=http://localhost:4873/')
            // process.env['npm_config_registry'] = 'http://localhost:4873/'
        }
    })

    verdaccioServerProcess.on('exit', (code, signal) => {
        console.log(`Child process exited with code ${code} and signal ${signal}`)
        cleanup()
        process.exit(code) // Exit the main process when the child process exits
    })
    verdaccioServerProcess.on('error', (err) => {
        console.error('Child process error:', err)
    })

    process.on('SIGINT', () => {
        cleanup()
        process.exit(0)
    })
    // Keep the main process running
    setInterval(() => {}, 1000)
}

main()
