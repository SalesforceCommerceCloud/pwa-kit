#!/usr/bin/env node
/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const packageJson = require('../package.json')

const dependencies = Object.keys(packageJson.dependencies || {})
const devDependencies = Object.keys(packageJson.devDependencies || {})
const peerDependencies = Object.keys(packageJson.peerDependencies || {})
const allDependencies = [...dependencies, ...devDependencies, ...peerDependencies]

// Not wanting pwa-kit-runtime, to avoid circular dependency
const UNWANTED_DEPENDENCIES = ['@salesforce/pwa-kit-runtime']
UNWANTED_DEPENDENCIES.forEach((dep) => {
    if (allDependencies.includes(dep)) {
        console.error(`Error: Unwanted dependency found: ${dep}`)
        process.exit(1)
    }
})
