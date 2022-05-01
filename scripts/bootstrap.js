#!/usr/bin/env node
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
    // Deliberate eslint rule violation for testing eslint

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
