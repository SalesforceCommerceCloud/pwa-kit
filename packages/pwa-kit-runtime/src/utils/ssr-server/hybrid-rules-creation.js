/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs'

// Core Matching rules (always included)
const CORE_RULES = [
    'http.request.uri.path eq "/"',
    'http.request.uri.path matches "^/callback"',
    'http.request.uri.path matches "^/mobify"',
    'http.request.uri.path matches "^/worker.js"',
    'http.request.uri.path matches "^/(\\w+)/([-\\w]+)/$"'
]

// Read route paths from a routes.jsx file (no JSX import)
const readPathFromRoutesFile = (routesFilePath) => {
    try {
        const file = routesFilePath
        const src = fs.readFileSync(file, 'utf8')
        const re = /path:\s*(["'])(.*?)\1/g
        const results = []
        let m
        while ((m = re.exec(src)) !== null) results.push(m[2])
        return Array.from(new Set(results)).filter(
            (p) => p && p !== '*' && p !== '/callback' && p !== '/'
        )
    } catch (_) {
        return []
    }
}

// Convert Express-like route path to regex fragment
const toParamRegex = (routePath) =>
    routePath.replace(/:(\w+)\?/g, '(?:/([-\\w]+))?').replace(/:(\w+)/g, '([-\\w]+)')

export const buildHybridRules = (filePath) => {
    const paths = readPathFromRoutesFile(filePath)
    const rules = [...CORE_RULES]
    paths.forEach((p) => {
        const rx = toParamRegex(p)
        rules.push(
            `http.request.uri.path matches "^/(\\w+)/([-\\w]+)${rx}"`,
            `http.request.uri.path matches "^${rx}"`
        )
    })
    // Safety nets for catalog-like URLs
    rules.push(
        'http.request.uri.path contains "/category/"',
        'http.request.uri.path contains "/product/"'
    )
    return Array.from(new Set(rules))
}
