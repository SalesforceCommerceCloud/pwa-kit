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

const sh = require('shelljs')
const cp = require('child_process')
const {withLocalNPMRepo} = require('internal-lib-build/verdaccio-server.js')

sh.set('-e')

const runGenerator = (repoUrl) => {
    try {
        process.env['npm_config_registry'] = repoUrl
        // Shelljs can't run interactive programs, so we have to switch to child_process.
        // See https://github.com/shelljs/shelljs/wiki/FAQ#running-interactive-programs-with-exec
        const cmd = 'npx'
        const args = ['pwa-kit-create-app', ...process.argv.slice(2)]
        cp.execFileSync(cmd, args, {stdio: 'inherit'})
    } finally {
        delete process.env['npm_config_registry']
    }
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
