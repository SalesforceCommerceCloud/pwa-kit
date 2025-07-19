#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * Sync ESLint-related dependencies from pwa-kit-dev to root package.json
 * to maintain centralized ESLint dependencies for IDE compatibility.
 */
const fs = require('fs')
const path = require('path')

const PWA_KIT_DEV_PKG = path.join(__dirname, '..', 'packages', 'pwa-kit-dev', 'package.json')
const ROOT_PKG = path.join(__dirname, '..', 'package.json')

// ESLint-related dependency patterns
const ESLINT_PATTERNS = [/^@typescript-eslint\//, /^eslint$/, /^eslint-/, /^prettier$/]

// Root-specific ESLint plugins that should NOT be removed
const ROOT_SPECIFIC_PLUGINS = ['eslint-plugin-header', 'eslint-plugin-no-relative-import-paths']

function isESLintDependency(depName) {
    return ESLINT_PATTERNS.some((pattern) => pattern.test(depName))
}

function syncESLintDependencies() {
    console.log('🔄 Syncing ESLint dependencies from pwa-kit-dev to root package.json...')

    // Read both package.json files
    const pwaKitDevPkg = JSON.parse(fs.readFileSync(PWA_KIT_DEV_PKG, 'utf8'))
    const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf8'))

    // Get all ESLint dependencies from pwa-kit-dev
    const eslintDeps = {}
    const allDeps = {
        ...(pwaKitDevPkg.dependencies || {}),
        ...(pwaKitDevPkg.devDependencies || {})
    }

    for (const [depName, version] of Object.entries(allDeps)) {
        if (isESLintDependency(depName)) {
            eslintDeps[depName] = version
        }
    }

    // Ensure devDependencies exists in root
    if (!rootPkg.devDependencies) {
        rootPkg.devDependencies = {}
    }

    // Track changes
    const added = []
    const updated = []
    const removed = []

    // Update root devDependencies with ESLint deps
    for (const [depName, version] of Object.entries(eslintDeps)) {
        const currentVersion = rootPkg.devDependencies[depName]

        if (!currentVersion) {
            rootPkg.devDependencies[depName] = version
            added.push(`${depName}@${version}`)
        } else if (currentVersion !== version) {
            rootPkg.devDependencies[depName] = version
            updated.push(`${depName}: ${currentVersion} → ${version}`)
        }
    }

    // Remove ESLint deps from root that are no longer in pwa-kit-dev
    // (but preserve root-specific plugins)
    for (const depName of Object.keys(rootPkg.devDependencies)) {
        if (
            isESLintDependency(depName) &&
            !eslintDeps[depName] &&
            !ROOT_SPECIFIC_PLUGINS.includes(depName)
        ) {
            delete rootPkg.devDependencies[depName]
            removed.push(depName)
        }
    }

    // Only write if there are changes
    if (added.length > 0 || updated.length > 0 || removed.length > 0) {
        fs.writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + '\n')
    }

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
