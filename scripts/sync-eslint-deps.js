#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * Sync ESLint-related dependencies from pwa-kit-dev to template-retail-react-app
 * to ensure IDE compatibility in the monorepo.
 */
const fs = require('fs')
const path = require('path')

const PWA_KIT_DEV_PKG = path.join(__dirname, '..', 'packages', 'pwa-kit-dev', 'package.json')
const RETAIL_APP_PKG = path.join(
    __dirname,
    '..',
    'packages',
    'template-retail-react-app',
    'package.json'
)

// ESLint-related dependency patterns
const ESLINT_PATTERNS = [/^@typescript-eslint\//, /^eslint$/, /^eslint-/, /^prettier$/]

function isESLintDependency(depName) {
    return ESLINT_PATTERNS.some((pattern) => pattern.test(depName))
}

function syncESLintDependencies() {
    console.log('🔄 Syncing ESLint dependencies from pwa-kit-dev to template-retail-react-app...')

    // Read both package.json files
    const pwaKitDevPkg = JSON.parse(fs.readFileSync(PWA_KIT_DEV_PKG, 'utf8'))
    const retailAppPkg = JSON.parse(fs.readFileSync(RETAIL_APP_PKG, 'utf8'))

    // Get all ESLint dependencies from pwa-kit-dev
    const eslintDeps = {}

    // Check dependencies and devDependencies in pwa-kit-dev
    const allDeps = {
        ...(pwaKitDevPkg.dependencies || {}),
        ...(pwaKitDevPkg.devDependencies || {})
    }

    for (const [depName, version] of Object.entries(allDeps)) {
        if (isESLintDependency(depName)) {
            eslintDeps[depName] = version
        }
    }

    // Ensure devDependencies exists in retail-app
    if (!retailAppPkg.devDependencies) {
        retailAppPkg.devDependencies = {}
    }

    // Track changes
    const added = []
    const updated = []
    const removed = []

    // Update retail-app devDependencies with ESLint deps
    for (const [depName, version] of Object.entries(eslintDeps)) {
        const currentVersion = retailAppPkg.devDependencies[depName]

        if (!currentVersion) {
            retailAppPkg.devDependencies[depName] = version
            added.push(`${depName}@${version}`)
        } else if (currentVersion !== version) {
            retailAppPkg.devDependencies[depName] = version
            updated.push(`${depName}: ${currentVersion} → ${version}`)
        }
    }

    // Remove ESLint deps that are no longer in pwa-kit-dev
    for (const depName of Object.keys(retailAppPkg.devDependencies)) {
        if (isESLintDependency(depName) && !eslintDeps[depName]) {
            delete retailAppPkg.devDependencies[depName]
            removed.push(depName)
        }
    }

    // Write updated package.json
    fs.writeFileSync(RETAIL_APP_PKG, JSON.stringify(retailAppPkg, null, 2) + '\n')

    // Report changes
    if (added.length > 0) {
        console.log('✅ Added:', added.join(', '))
    }
    if (updated.length > 0) {
        console.log('🔄 Updated:', updated.join(', '))
    }
    if (removed.length > 0) {
        console.log('🗑️  Removed:', removed.join(', '))
    }

    if (added.length === 0 && updated.length === 0 && removed.length === 0) {
        console.log('✨ Already in sync!')
    } else {
        console.log('✅ Sync complete! Run `npm install` to update dependencies.')
    }
}

if (require.main === module) {
    syncESLintDependencies()
}

module.exports = {syncESLintDependencies}
