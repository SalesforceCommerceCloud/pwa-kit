#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Diagnostic script to identify CI-specific issues, particularly TypeScript compilation
 * errors that might occur after commerce-sdk-isomorphic@4.0.0 upgrade
 */

const childProc = require('child_process')
const fs = require('fs')
const path = require('path')

const ciEnvironment = Boolean(process.env.CI)

console.log('=== CI DIAGNOSTIC SCRIPT ===')
console.log(`Environment: ${ciEnvironment ? 'CI' : 'LOCAL'}`)
console.log(`Timestamp: ${new Date().toISOString()}`)

// Function to run command with detailed logging
function runCommand(description, command, options = {}) {
    console.log(`\n📋 ${description}`)
    console.log(`🔧 Command: ${command}`)
    
    const startTime = Date.now()
    try {
        const result = childProc.execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: options.timeout || 300000, // 5 minutes default
            ...options
        })
        const duration = Date.now() - startTime
        console.log(`✅ SUCCESS (${duration}ms)`)
        if (options.showOutput && result) {
            console.log(`📄 Output:\n${result}`)
        }
        return { success: true, output: result, duration }
    } catch (error) {
        const duration = Date.now() - startTime
        console.log(`❌ FAILED (${duration}ms)`)
        console.log(`📄 Error: ${error.message}`)
        if (error.stdout) {
            console.log(`📄 Stdout:\n${error.stdout}`)
        }
        if (error.stderr) {
            console.log(`📄 Stderr:\n${error.stderr}`)
        }
        return { success: false, error, duration }
    }
}

// Function to check package versions
function checkPackageVersions() {
    console.log('\n=== PACKAGE VERSION ANALYSIS ===')
    
    const commerceSdkPath = path.join(process.cwd(), 'packages/commerce-sdk-react/package.json')
    try {
        const pkg = JSON.parse(fs.readFileSync(commerceSdkPath, 'utf8'))
        console.log(`📦 Commerce SDK React: ${pkg.version}`)
        console.log(`📦 Commerce SDK Isomorphic dependency: ${pkg.dependencies['commerce-sdk-isomorphic']}`)
        
        // Check if lockfile exists and get installed version
        const lockfilePath = path.join(path.dirname(commerceSdkPath), 'package-lock.json')
        if (fs.existsSync(lockfilePath)) {
            console.log('✅ package-lock.json exists')
            
            // Try to get actual installed version
            const nodeModulesPath = path.join(path.dirname(commerceSdkPath), 'node_modules/commerce-sdk-isomorphic/package.json')
            if (fs.existsSync(nodeModulesPath)) {
                const installedPkg = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf8'))
                console.log(`📦 Actually installed version: ${installedPkg.version}`)
            } else {
                console.log('⚠️ commerce-sdk-isomorphic not found in node_modules')
            }
        } else {
            console.log('❌ package-lock.json missing')
        }
    } catch (error) {
        console.log(`❌ Failed to read package.json: ${error.message}`)
    }
}

// Main diagnostic sequence
async function runDiagnostics() {
    console.log('\n=== SYSTEM INFORMATION ===')
    console.log(`Node: ${process.version}`)
    console.log(`Platform: ${process.platform}`)
    console.log(`Architecture: ${process.arch}`)
    console.log(`Memory:`, process.memoryUsage())
    console.log(`Working Directory: ${process.cwd()}`)
    
    checkPackageVersions()
    
    // Test npm configuration
    runCommand(
        'Check npm configuration',
        'npm config list',
        { showOutput: true }
    )
    
    // Test lerna version
    runCommand(
        'Check lerna version',
        'npm run lerna -- --version',
        { showOutput: true }
    )
    
    // Test TypeScript compilation in commerce-sdk-react
    console.log('\n=== TYPESCRIPT COMPILATION TESTS ===')
    
    // Change to commerce-sdk-react directory for specific tests
    const commerceSdkDir = path.join(process.cwd(), 'packages/commerce-sdk-react')
    
    runCommand(
        'TypeScript type checking (commerce-sdk-react)',
        'npm run typecheck',
        { cwd: commerceSdkDir, timeout: 600000 } // 10 minutes
    )
    
    runCommand(
        'Build commerce-sdk-react',
        'npm run build',
        { cwd: commerceSdkDir, timeout: 600000 } // 10 minutes
    )
    
    runCommand(
        'Lint commerce-sdk-react',
        'npm run lint',
        { cwd: commerceSdkDir, timeout: 300000 } // 5 minutes
    )
    
    // Test individual package installs
    console.log('\n=== DEPENDENCY INSTALLATION TESTS ===')
    
    runCommand(
        'Clean install commerce-sdk-react',
        'npm ci',
        { cwd: commerceSdkDir, timeout: 600000 }
    )
    
    runCommand(
        'List installed dependencies',
        'npm ls --depth=0',
        { cwd: commerceSdkDir, showOutput: true }
    )
    
    // Test specific commerce-sdk-isomorphic features
    console.log('\n=== COMMERCE SDK INTEGRATION TESTS ===')
    
    runCommand(
        'Quick smoke test of commerce-sdk-isomorphic import',
        'node -e "console.log(\\"Testing import...\\"); const sdk = require(\\"commerce-sdk-isomorphic\\"); console.log(\\"ShopperSEO available:\\", !!sdk.ShopperSEO); console.log(\\"Version:\\", require(\\"commerce-sdk-isomorphic/package.json\\").version)"',
        { cwd: commerceSdkDir, showOutput: true }
    )
    
    console.log('\n=== DIAGNOSTIC COMPLETE ===')
    console.log(`Completed at: ${new Date().toISOString()}`)
}

runDiagnostics().catch(error => {
    console.error('\n❌ DIAGNOSTIC SCRIPT FAILED')
    console.error(error)
    process.exit(1)
})
