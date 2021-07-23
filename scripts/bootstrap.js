#!/usr/bin/env node
/* eslint import/no-commonjs:0 */

/**
 * Bootstrap all packages, intended to be used as a post-install hook.
 *
 * If the user did `npm install` at the root, do `npm install` for all packages,
 * if they did `npm ci` at the root use ci everywhere.
 */
const childProc = require('child_process')
const argv = JSON.parse(process.env.npm_config_argv).original

// Is this a CI environment?
const ciEnvironment = Boolean(process.env.CI)

// Did the user explicitly invoke `npm ci`?
const ciCommand = argv[0] === 'ci'

// Note: We reduce concurrency and increase verbosity on CI environments.
// They are often memory-constrained and kill processes which produce no
// output for too long.
const commandArgs = ciCommand ? '--ci' : '--no-ci'
const environmentArgs = ciEnvironment ? '--concurrency 1 --loglevel debug' : ''
const cmd = `npm run lerna -- bootstrap ${commandArgs} ${environmentArgs}`
childProc.execSync(cmd, {stdio: 'inherit'})
