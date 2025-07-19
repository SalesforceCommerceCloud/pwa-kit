#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * Sync ESLint-related dependencies from pwa-kit-dev to template packages
 * to ensure IDE compatibility in the monorepo.
 */
const fs = require('fs')
const path = require('path')

const PWA_KIT_DEV_PKG = path.join(__dirname, '..', 'packages', 'pwa-kit-dev', 'package.json')

// Template and test packages that developers work on directly (need ESLint plugins for IDE support)
const TARGET_PACKAGES = [
    'packages/template-retail-react-app',
    'packages/template-typescript-minimal',
    'packages/template-express-minimal',
    'packages/template-mrt-reference-app',
    'packages/test-commerce-sdk-react'
]

// ESLint-related dependency patterns
const ESLINT_PATTERNS = [/^@typescript-eslint\//, /^eslint$/, /^eslint-/, /^prettier$/]

function isESLintDependency(depName) {
    return ESLINT_PATTERNS.some((pattern) => pattern.test(depName))
}

function syncPackage(targetPackagePath, eslintDeps) {
    const packageName = path.basename(path.dirname(targetPackagePath))

    if (!fs.existsSync(targetPackagePath)) {
        console.log(`⏭️  Skipping ${packageName} (package.json not found)`)
        return {added: [], updated: [], removed: []}
    }

    const targetPkg = JSON.parse(fs.readFileSync(targetPackagePath, 'utf8'))

    // Ensure devDependencies exists
    if (!targetPkg.devDependencies) {
        targetPkg.devDependencies = {}
    }

    // Track changes
    const added = []
    const updated = []
    const removed = []

    // Update devDependencies with ESLint deps
    for (const [depName, version] of Object.entries(eslintDeps)) {
        const currentVersion = targetPkg.devDependencies[depName]

        if (!currentVersion) {
            targetPkg.devDependencies[depName] = version
            added.push(`${depName}@${version}`)
        } else if (currentVersion !== version) {
            targetPkg.devDependencies[depName] = version
            updated.push(`${depName}: ${currentVersion} → ${version}`)
        }
    }

    // Remove ESLint deps that are no longer in pwa-kit-dev
    for (const depName of Object.keys(targetPkg.devDependencies)) {
        if (isESLintDependency(depName) && !eslintDeps[depName]) {
            delete targetPkg.devDependencies[depName]
            removed.push(depName)
        }
    }

    // Only write if there are changes
    if (added.length > 0 || updated.length > 0 || removed.length > 0) {
        fs.writeFileSync(targetPackagePath, JSON.stringify(targetPkg, null, 2) + '\n')
    }

    return {added, updated, removed, packageName}
}

function syncESLintDependencies() {
    console.log('🔄 Syncing ESLint dependencies from pwa-kit-dev to template packages...')

    // Read source package.json file
    const pwaKitDevPkg = JSON.parse(fs.readFileSync(PWA_KIT_DEV_PKG, 'utf8'))

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

    console.log(`📦 Found ${Object.keys(eslintDeps).length} ESLint dependencies to sync`)

    // Process each target package
    let totalChanges = 0

    for (const packagePath of TARGET_PACKAGES) {
        const fullPath = path.join(__dirname, '..', packagePath, 'package.json')
        const result = syncPackage(fullPath, eslintDeps)

        if (result.added.length > 0 || result.updated.length > 0 || result.removed.length > 0) {
            console.log(`\n📦 ${result.packageName}:`)
            if (result.added.length > 0) {
                console.log(`  ✅ Added: ${result.added.join(', ')}`)
            }
            if (result.updated.length > 0) {
                console.log(`  🔄 Updated: ${result.updated.join(', ')}`)
            }
            if (result.removed.length > 0) {
                console.log(`  🗑️  Removed: ${result.removed.join(', ')}`)
            }
            totalChanges += result.added.length + result.updated.length + result.removed.length
        }
    }

    if (totalChanges === 0) {
        console.log('✨ All packages already in sync!')
    } else {
        console.log(
            `\n✅ Sync complete! ${totalChanges} changes made. Run \`npm install\` to update dependencies.`
        )
    }
}

if (require.main === module) {
    syncESLintDependencies()
}

module.exports = {syncESLintDependencies}
