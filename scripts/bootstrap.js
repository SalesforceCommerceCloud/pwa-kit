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

// Note: For CI environments, we use optimized settings to reduce memory pressure
// and prevent timeout issues while maintaining reasonable verbosity.
const commandArgs = ciCommand ? '--ci' : '--no-ci'

// For bundle-size CI, only install essential packages to reduce memory usage
const isBundleSizeCI = process.env.CI_JOB_NAME === 'bundle-size' || process.env.GITHUB_JOB === 'pwa-kit-bundle-size'
const scopeArgs = isBundleSizeCI ? '--scope="@salesforce/retail-react-app" --scope="@salesforce/commerce-sdk-react" --include-dependencies' : ''

const environmentArgs = ciEnvironment ? '--concurrency 2 --loglevel warn' : ''
const cmd = `npm run lerna -- bootstrap ${commandArgs} ${environmentArgs} ${scopeArgs}`

childProc.execSync(cmd, {stdio: 'inherit'})

// Symlink local dependencies
// A bug manifests itself on Windows where lerna bootstrap fails to generate the `pwa-kit-dev` bin shims
// in the bin file. As a result, Windows runs the `pwa-kit-dev` bin file using Windows Host Script instead
// of Node. We run the lerna link command to fix the shims in the `pwa-kit-dev` bin file on Windows.
if (process.platform === 'win32') {
    childProc.execSync('npm run lerna link --force-local', {stdio: 'inherit'})
}
