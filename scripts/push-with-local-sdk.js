#!/usr/bin/env node
/*
 * Run from repo root, e.g.:
 *   npm run push-with-local-sdk -- -m "turnstile" -s stretch-armstrong -t stretch --credentialsFile ~/.mobify--cloud-staging.mrt-staging.com --cloud-origin https://cloud-staging.mrt-staging.com
 */
const path = require('path')
const {spawnSync} = require('child_process')

const repoRoot = path.resolve(__dirname, '..')

// 1. Run verification (same as verify-commerce-sdk-react-local.js)
require('./verify-commerce-sdk-react-local.js')

// 2. Build commerce-sdk-react so dist/ has the Turnstile fix before template build
console.log('\nBuilding @salesforce/commerce-sdk-react...\n')
const buildSdk = spawnSync('npm', ['run', 'build', '--prefix', path.join(repoRoot, 'packages/commerce-sdk-react')], {
    stdio: 'inherit',
    cwd: repoRoot
})
if (buildSdk.status !== 0) {
    console.error('commerce-sdk-react build failed')
    process.exit(1)
}

// 3. Run push from template app with all args forwarded
const pushArgs = process.argv.slice(2)
const npmArgs = [
    'run',
    'push',
    '--prefix',
    path.join(repoRoot, 'packages/template-retail-react-app'),
    '--',
    ...pushArgs
]

console.log('\nRunning: npm', npmArgs.join(' '), '\n')

const result = spawnSync('npm', npmArgs, {
    stdio: 'inherit',
    cwd: repoRoot
})

process.exit(result.status ?? 1)
