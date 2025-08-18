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

// Set npm configuration for CI environments to be more robust
if (ciEnvironment) {
    process.env.npm_config_network_timeout = '600000' // 10 minutes
    process.env.npm_config_fetch_retries = '5'
    process.env.npm_config_fetch_retry_factor = '2'
    process.env.npm_config_fetch_retry_mintimeout = '10000'
    process.env.npm_config_fetch_retry_maxtimeout = '60000'
}

console.log('=== BOOTSTRAP PROCESS STARTING ===')
console.log(`Environment: ${ciEnvironment ? 'CI' : 'LOCAL'}`)
console.log(`Command: ${npmCmd}`)
console.log(`Args: ${commandArgs} ${environmentArgs}`)
console.log(`Full command: ${cmd}`)

if (ciEnvironment) {
    console.log('=== CI CONFIGURATION ===')
    console.log('Enhanced npm configuration applied:')
    console.log(`- Network timeout: ${process.env.npm_config_network_timeout}ms`)
    console.log(`- Fetch retries: ${process.env.npm_config_fetch_retries}`)
    console.log(`- Retry factor: ${process.env.npm_config_fetch_retry_factor}`)
    console.log(`- Min timeout: ${process.env.npm_config_fetch_retry_mintimeout}ms`)
    console.log(`- Max timeout: ${process.env.npm_config_fetch_retry_maxtimeout}ms`)
    
    // Log system information
    console.log('=== SYSTEM INFO ===')
    console.log(`Node version: ${process.version}`)
    console.log(`Platform: ${process.platform}`)
    console.log(`Architecture: ${process.arch}`)
    console.log(`Memory usage:`, process.memoryUsage())
    console.log(`Working directory: ${process.cwd()}`)
    
    // Log package.json commerce-sdk-isomorphic version
    try {
        const commerceSdkPkg = require('./packages/commerce-sdk-react/package.json')
        console.log(`Commerce SDK React version: ${commerceSdkPkg.version}`)
        console.log(`Commerce SDK Isomorphic dependency: ${commerceSdkPkg.dependencies['commerce-sdk-isomorphic']}`)
    } catch (e) {
        console.log('Could not read commerce-sdk-react package.json:', e.message)
    }
}

// Run commerce SDK validation in CI to catch issues early
if (ciEnvironment) {
    console.log('\n=== RUNNING COMMERCE SDK UPGRADE VALIDATION ===')
    try {
        childProc.execSync('node ./scripts/validate-commerce-sdk-upgrade.js', {
            stdio: 'inherit',
            timeout: 300000 // 5 minutes
        })
        console.log('✅ Commerce SDK validation passed')
    } catch (error) {
        console.log('❌ Commerce SDK validation failed - this may cause bootstrap issues')
        console.log('Continuing with bootstrap, but expect potential failures...')
    }
}

const startTime = Date.now()
console.log(`=== STARTING LERNA BOOTSTRAP at ${new Date().toISOString()} ===`)

try {
    childProc.execSync(cmd, {
        stdio: 'inherit',
        // Increase timeout for CI environments (30 minutes)
        timeout: ciEnvironment ? 1800000 : undefined
    })
    
    const duration = Date.now() - startTime
    console.log(`=== BOOTSTRAP COMPLETED SUCCESSFULLY in ${duration}ms ===`)
    
} catch (error) {
    const duration = Date.now() - startTime
    console.error(`=== BOOTSTRAP FAILED after ${duration}ms ===`)
    console.error('Error details:')
    console.error(`- Message: ${error.message}`)
    console.error(`- Signal: ${error.signal}`)
    console.error(`- Status: ${error.status}`)
    console.error(`- PID: ${error.pid}`)
    
    if (ciEnvironment) {
        console.error('=== CI-SPECIFIC ERROR ANALYSIS ===')
        if (error.signal === 'SIGTERM') {
            console.error('❌ Process was terminated - likely due to timeout or memory constraints')
        } else if (error.signal === 'SIGKILL') {
            console.error('❌ Process was killed - likely due to OOM or resource limits')
        } else if (error.status === 1) {
            console.error('❌ Command failed - likely due to compilation errors or dependency issues')
        } else if (error.status === 2) {
            console.error('❌ TypeScript compilation errors or prepare script failures')
        }
        
        console.error('💡 Troubleshooting suggestions:')
        console.error('1. Check for TypeScript compilation errors in commerce-sdk-react')
        console.error('2. Verify commerce-sdk-isomorphic@4.0.0 breaking changes are properly handled')
        console.error('3. Review prepare scripts in affected packages')
        console.error('4. Consider memory/timeout constraints in CI environment')
        
        // Log current memory usage
        console.error('Current memory usage:', process.memoryUsage())
    }
    
    throw error
}

// Symlink local dependencies
// A bug manifests itself on Windows where lerna bootstrap fails to generate the `pwa-kit-dev` bin shims
// in the bin file. As a result, Windows runs the `pwa-kit-dev` bin file using Windows Host Script instead
// of Node. We run the lerna link command to fix the shims in the `pwa-kit-dev` bin file on Windows.
if (process.platform === 'win32') {
    childProc.execSync('npm run lerna link --force-local', {stdio: 'inherit'})
}
