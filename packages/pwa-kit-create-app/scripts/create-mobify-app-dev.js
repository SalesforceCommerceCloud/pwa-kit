#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a small wrapper around the generator script that we intend to use during
 * development and testing only. This script behaves identically to the wrapped
 * script but does setup/teardown of a local NPM repository that lets us test some
 * important edge-cases. Those are:
 *
 * 1. Testing `npx pwa-kit-create-app` without publishing to the public NPM repo.
 * 2. Realistically testing generated projects as though they were installed from
 *    the public NPM repo.
 *
 * Both cases can be tested by publishing all monorepo packages to a private, local
 * NPM repository before running the generator script.
 *
 * ## Detailed Explanations
 *
 * ### Testing `npx pwa-kit-create-app`
 *
 * It is simply not possible to test the behaviour of the `npx` command without
 * first publishing the package under test. We don't want to publish to the public
 * NPM repo all the time, so we use a private repo.
 *
 * ### Testing generated projects as installed from NPM
 *
 * NPM installs packages differently, depending on whether the package is being
 * installed in "development mode" or not. In the monorepo all our packages are
 * installed in development mode, but in end-user projects, they are not.
 *
 * The big difference between the two modes is that in development mode, NPM will
 * install a package's devDependencies; in production mode it will not. Properly
 * testing production installs ensures, therefore, that eg. the progressive-web-sdk
 * lists its dependencies in the right section. Without this, it's *super* easy to
 * accidentally add a devDependency to a package and then forget that the
 * devDependency won't actually be installed for the end-user!
 */

const p = require('path')
const sh = require('shelljs')
const fs = require('fs')
const cp = require('child_process')

sh.set('-e')

const logFileName = p.join(__dirname, '..', 'local-npm-repo', 'verdaccio.log')

/**
 * Run the provided function with a local NPM repository running in the background.
 */
const withLocalNPMRepo = (func) => {
    const monorepoRoot = p.resolve(__dirname, '..', '..', '..')
    const verdaccio = p.join(__dirname, '..', 'node_modules', '.bin', 'verdaccio')
    const verdaccioConfigDir = p.join(__dirname, '..', 'local-npm-repo')

    // Clear any cached packages from a previous run.
    sh.rm('-rf', p.join(verdaccioConfigDir, 'storage'))
    sh.mkdir(p.join(verdaccioConfigDir, 'storage'))

    let child

    const cleanup = () => {
        console.log('Shutting down local NPM repository')
        delete process.env['npm_config_registry']
        child.kill()
    }

    return Promise.resolve()
        .then(
            () =>
                new Promise((resolve) => {
                    console.log('Starting up local NPM repository')

                    child = cp.exec(`${verdaccio} --config config.yaml`, {
                        cwd: verdaccioConfigDir,
                        stdio: 'inherit',
                        env: {
                            ...process.env,
                            OPENCOLLECTIVE_HIDE: 'true',
                            DISABLE_OPENCOLLECTIVE: 'true',
                            OPEN_SOURCE_CONTRIBUTOR: 'true'
                        }
                    })

                    const CHECK_TIME = 1000

                    const waitForLogFileExists = () => {
                        setTimeout(() => {
                            fs.readFile(logFileName, 'utf8', (err, data) => {
                                if (err || !data) {
                                    waitForLogFileExists()
                                } else {
                                    const readStream = fs.createReadStream(logFileName, 'utf8')

                                    readStream.on('error', (error) => {
                                        console.error(
                                            `Failed to read ${logFileName}: ${error.message}`
                                        )
                                        waitForLogFileExists()
                                    })

                                    readStream.on('data', (data) => {
                                        if (data.includes('http address')) {
                                            // Verdaccio is running once it logs the HTTP address. Configure
                                            // NPM to use the local repo, through env vars.
                                            process.env['npm_config_registry'] =
                                                'http://localhost:4873/'
                                            resolve()
                                        } else {
                                            waitForLogFileExists()
                                        }
                                    })
                                }
                            })
                        }, CHECK_TIME)
                    }

                    waitForLogFileExists()
                })
        )
        .then(() => {
            // Now that we're set up to use the local NPM repo, publish the monorepo
            // packages to it. This is safe to do – Verdaccio does not forward these
            // the public NPM repo.
            console.log('Publishing packages to the local NPM repository')
            sh.exec('npm run lerna -- publish from-package --yes --concurrency 1 --loglevel warn', {
                cwd: monorepoRoot,
                fatal: true,
                silent: false
            }).toEnd(logFileName)
            console.log('Published successfully')
        })
        .then(() => func())
        .then(() => cleanup())
        .catch((err) => {
            cleanup()
            throw err
        })
}

const runGenerator = () => {
    // Shelljs can't run interactive programs, so we have to switch to child_process.
    // See https://github.com/shelljs/shelljs/wiki/FAQ#running-interactive-programs-with-exec

    cp.execSync(`npx pwa-kit-create-app ${process.argv.slice(2).join(' ')}`, {
        stdio: 'inherit'
    })
}

const main = () => {
    return Promise.resolve()
        .then(() => withLocalNPMRepo(runGenerator))
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
}

if (require.main === module) {
    main()
}
