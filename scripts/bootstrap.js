#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * Bootstrap all packages, intended to be used as a post-install hook.
 *
 * If the user did `npm install` at the root, do `npm install` for all packages,
 * if they did `npm ci` at the root use ci everywhere.
 */
const childProc = require('child_process')

// Is this a CI environment?
const ciEnvironment = Boolean(process.env.CI)

// Did the user explicitly invoke `npm ci`?
const npmCmd = process.env.npm_config_argv
    ? JSON.parse(process.env.npm_config_argv).original[0]
    : process.env.npm_command
const ciCommand = npmCmd === 'ci'

// Note: We reduce concurrency and increase verbosity on CI environments.
// They are often memory-constrained and kill processes which produce no
// output for too long.
const commandArgs = ciCommand ? '--ci' : '--no-ci'
const environmentArgs = ciEnvironment ? '--concurrency 1 --loglevel debug' : ''
const cmd = `npm run lerna -- bootstrap ${commandArgs} ${environmentArgs}`

childProc.execSync(cmd, {stdio: 'inherit'})

// Symlink local dependencies
// A bug manifests itself on Windows where lerna bootstrap fails to generate the `pwa-kit-dev` bin shims
// in the bin file. As a result, Windows runs the `pwa-kit-dev` bin file using Windows Host Script instead
// of Node. We run the lerna link command to fix the shims in the `pwa-kit-dev` bin file on Windows.
if (process.platform === 'win32') {
    childProc.execSync('npm run lerna link --force-local', {stdio: 'inherit'})
}
