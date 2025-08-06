#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * Check if ESLint-related dependencies from pwa-kit-dev are present in root package.json devDependencies.
 */
const fs = require('fs')
const path = require('path')
const PWA_KIT_DEV_PKG = path.join(__dirname, '..', 'packages', 'pwa-kit-dev', 'package.json')
const ROOT_PKG = path.join(__dirname, '..', 'package.json')

const ESLINT_DEP_PATTERNS = [/^@typescript-eslint\//, /^eslint$/, /^eslint-/, /^prettier$/]

function isESLintDependency(depName) {
    return ESLINT_DEP_PATTERNS.some((pattern) => pattern.test(depName))
}

function checkESLintDependencies() {
    const pwaKitDevPkg = JSON.parse(fs.readFileSync(PWA_KIT_DEV_PKG, 'utf8'))
    const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf8'))

    const pwaKitDevESLintDeps = Object.keys(pwaKitDevPkg.dependencies || {}).filter((depName) =>
        isESLintDependency(depName)
    )
    const rootESLintDeps = new Set(
        Object.keys(rootPkg.devDependencies || {}).filter((depName) => isESLintDependency(depName))
    )
    const missingDeps = pwaKitDevESLintDeps.filter((dep) => !rootESLintDeps.has(dep))

    if (missingDeps.length > 0) {
        console.error(
            `⚠️  The root package.json is missing these pwa-kit-dev's eslint dependencies: ${missingDeps.join(
                ', '
            )}`
        )
        console.error(
            'Due to our monorepo setup, those eslint dependencies are discoverable only if they are also at the root.'
        )
        process.exit(1)
    }
}

if (require.main === module) {
    checkESLintDependencies()
}

module.exports = {checkESLintDependencies}
