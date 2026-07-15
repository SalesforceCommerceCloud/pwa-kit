#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-console */

'use strict'

/**
 * Copy Commerce Client Static Assets
 *
 * Copies the @cimulate/copilot-widget messaging UMD bundle into the app's static
 * directory so the Commerce Client shopper-agent widget can be served same-origin
 * (i.e. `commerceClientLoadingMode: 'static'`) instead of from the external
 * Cimulate CDN.
 *
 * This is the PWA Kit equivalent of the SFCC cartridge's copy-static-assets.js.
 *
 * Default source: node_modules/@cimulate/copilot-widget/dist/messaging.umd.js
 * Override:       --source <path-to-copilot-widget-directory>
 *
 * Usage:
 *   npm run copy:commerce-client
 *   npm run copy:commerce-client -- --source ../cimulate-scrt2/javascript/copilot-widget
 */

const fs = require('fs')
const path = require('path')

// --- Configuration ---

// Destination lives under app/static so it is picked up by the PWA Kit build and
// served from the same origin as the storefront (resolved at runtime via getAssetUrl).
const APP_STATIC_DIR = path.resolve(__dirname, '../app/static/commerce-client')

// Only the JS bundle is required — the UMD bundle injects its own styles, so
// (unlike the SFCC cartridge) there is no separate CSS file to copy.
const FILES_TO_COPY = [
    {
        src: 'dist/messaging.umd.js',
        dest: 'messaging.umd.js'
    }
]

// --- Parse CLI args ---

/**
 * Parses command line arguments.
 * @returns {{source: (string|null)}} Parsed args with source property
 */
function parseArgs() {
    const args = process.argv.slice(2)
    let source = null

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--source' && args[i + 1]) {
            source = args[i + 1]
            i++
        }
    }

    return {source}
}

// --- Resolve source directory ---

/**
 * Resolves the source directory for widget assets.
 * @param {string|null} cliSource - Path from --source flag, or null for default
 * @returns {string} Resolved absolute path to source directory
 */
function resolveSource(cliSource) {
    if (cliSource) {
        const resolved = path.resolve(cliSource)
        if (!fs.existsSync(resolved)) {
            console.error('ERROR: Specified source directory does not exist: ' + resolved)
            process.exit(1)
        }
        return resolved
    }

    // Default: node_modules/@cimulate/copilot-widget
    const nodeModulesPath = path.resolve(__dirname, '../node_modules/@cimulate/copilot-widget')
    if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath
    }

    console.error('ERROR: Could not find @cimulate/copilot-widget.')
    console.error('  Either install the package first, or provide --source <path>')
    console.error('')
    console.error('  Examples:')
    console.error('    npm run copy:commerce-client')
    console.error(
        '    npm run copy:commerce-client -- --source ../cimulate-scrt2/javascript/copilot-widget'
    )
    process.exit(1)
    return '' // unreachable, satisfies consistent-return
}

// --- Read version from source package.json ---

/**
 * Reads the version from the source package.json.
 * @param {string} sourceDir - Path to the widget source directory
 * @returns {string} Version string or 'unknown'
 */
function getVersion(sourceDir) {
    const pkgPath = path.join(sourceDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
            return pkg.version || 'unknown'
        } catch (e) {
            return 'unknown'
        }
    }
    return 'unknown'
}

// --- Ensure directory exists ---

/**
 * Creates a directory recursively if it doesn't exist.
 * @param {string} dirPath - Directory path to create
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true})
    }
}

// --- Format file size ---

/**
 * Formats a byte count to a human-readable string.
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g. "767.2 KB")
 */
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(1) + ' KB'
    return (kb / 1024).toFixed(2) + ' MB'
}

// --- Main ---

/**
 * Main entry point. Copies widget dist files into the app static directory.
 */
function main() {
    const args = parseArgs()
    const sourceDir = resolveSource(args.source)
    const version = getVersion(sourceDir)

    console.log('')
    console.log('=== Copy Commerce Client Static Assets ===')
    console.log('  Source:  ' + sourceDir)
    console.log('  Version: ' + version)
    console.log('  Target:  ' + APP_STATIC_DIR)
    console.log('')

    const errors = []

    FILES_TO_COPY.forEach(function (file) {
        const srcPath = path.join(sourceDir, file.src)
        const destPath = path.join(APP_STATIC_DIR, file.dest)

        if (!fs.existsSync(srcPath)) {
            errors.push('  MISSING: ' + srcPath)
            return
        }

        ensureDir(path.dirname(destPath))
        fs.copyFileSync(srcPath, destPath)

        const stats = fs.statSync(destPath)
        console.log('  COPIED: ' + file.dest + ' (' + formatSize(stats.size) + ')')
    })

    if (errors.length > 0) {
        console.log('')
        console.error('ERRORS:')
        errors.forEach(function (err) {
            console.error(err)
        })
        console.log('')
        console.error('Ensure the source has been built (run the widget build in the copilot-widget directory).')
        process.exit(1)
    }

    console.log('')
    console.log('Done! Commerce Client static assets ready for the build.')
    console.log(
        "Set commerceClientLoadingMode = 'static' in COMMERCE_AGENT_SETTINGS to use them."
    )
    console.log('')
}

main()
