#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Script to add new CSP directive values to existing configuration in config/default.js (app.contentSecurityPolicy)
 *
 * This script only adds new values - it cannot remove or modify existing directives.
 * It prevents duplicate values.
 *
 * NOTE: This operation is lossy - existing comments in the CSP configuration will be removed.
 */

const fs = require('fs')

/**
 * Get the config file path from command line args
 */
function getConfigFilePath(args) {
    const pathIndex = args.indexOf('--config-path')
    if (pathIndex !== -1 && pathIndex + 1 < args.length) {
        return args[pathIndex + 1]
    }
    return null
}

/**
 * Parse current CSP directives from config default.js
 * NOTE: This function ignores existing comments (lossy operation)
 */
function getCurrentCSPConfig(configFilePath) {
    const content = fs.readFileSync(configFilePath, 'utf8')
    // Find the directives object under contentSecurityPolicy
    const directivesMatch = content.match(
        /contentSecurityPolicy\s*:\s*{[\s\S]*?directives\s*:\s*{([\s\S]*?)}[\s\S]*?}/
    )

    if (!directivesMatch) {
        throw new Error('Could not find contentSecurityPolicy.directives in config/default.js')
    }

    const directivesContent = directivesMatch[1]
    const config = {}

    // Match each directive and its array (simplified - no comment handling)
    const directiveMatches = directivesContent.matchAll(/'([^']+)':\s*\[([^\]]+)\]/gs)

    Array.from(directiveMatches).forEach((match) => {
        const directiveName = match[1]
        const valuesContent = match[2]

        config[directiveName] = []

        // Parse values only (ignore comments)
        const valueMatches = valuesContent.matchAll(/'([^']+)'/g)
        Array.from(valueMatches).forEach((valueMatch) => {
            config[directiveName].push(valueMatch[1])
        })
    })

    return config
}

/**
 * Add new CSP directive values to existing configuration
 */
function addCSPDirectives(existingConfig, newConfig) {
    const mergedConfig = {...existingConfig}

    Object.entries(newConfig).forEach(([directiveName, newEntries]) => {
        if (!mergedConfig[directiveName]) {
            mergedConfig[directiveName] = []
        }

        newEntries.forEach((newEntry) => {
            // Check if value already exists (simplified - direct string comparison)
            if (!mergedConfig[directiveName].includes(newEntry)) {
                mergedConfig[directiveName].push(newEntry)
            }
        })
    })

    return mergedConfig
}

/**
 * Generate CSP directives string from config (simplified - no comments)
 */
function generateCSPDirectives(config) {
    const directiveLines = []

    Object.entries(config).forEach(([directiveName, entries]) => {
        if (entries.length === 0) return

        const valueLines = entries.map(
            (value, i) => `                        '${value}'${i < entries.length - 1 ? ',' : ''}`
        )

        const valuesString = valueLines.join('\n')
        directiveLines.push(
            `                    '${directiveName}': [\n${valuesString}\n                    ]`
        )
    })

    return directiveLines.join(',\n')
}

/**
 * Parse input from file path
 */
function parseInputFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Config file not found: ${filePath}`)
    }

    const configContent = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(configContent)
}

/**
 * Parse input from stdin
 */
function parseInputFromStdin() {
    return new Promise((resolve, reject) => {
        let stdinData = ''

        process.stdin.setEncoding('utf8')

        process.stdin.on('data', (chunk) => {
            stdinData += chunk
        })

        process.stdin.on('end', () => {
            try {
                const config = JSON.parse(stdinData.trim())
                resolve(config)
            } catch (error) {
                reject(new Error(`Invalid JSON from stdin: ${error.message}`))
            }
        })

        process.stdin.on('error', (error) => {
            reject(new Error(`Error reading from stdin: ${error.message}`))
        })
    })
}

/**
 * Update config default.js file with the enhanced CSP configuration
 */
function updateConfigFile(config, configFilePath) {
    const content = fs.readFileSync(configFilePath, 'utf8')
    const directivesString = generateCSPDirectives(config)

    const newContent = content.replace(
        /directives:\s*{[\s\S]*?}/s,
        `directives: {\n${directivesString}\n                }`
    )

    fs.writeFileSync(configFilePath, newContent, 'utf8')
    console.log(`✅ Successfully added CSP directives to ${configFilePath}`)
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2)
    const filteredArgs = args.filter((arg, index) => {
        return !(arg === '--config-path' || args[index - 1] === '--config-path')
    })

    // Show help if no file argument and stdin is a TTY (not piped)
    if (filteredArgs.length === 0 && process.stdin.isTTY) {
        console.log(`
Usage:
  node e2e/scripts/add-csp-directives.js <config.json> --config-path <path>
  echo '{"img-src": ["*.example.com"]}' | node e2e/scripts/add-csp-directives.js --config-path <path>

Description:
  Adds new CSP directive values to existing configuration in config/default.js under app.contentSecurityPolicy
  - Prevents duplicate values
  - Cannot remove or modify existing directives
  - NOTE: This operation is lossy - existing comments will be removed

Options:
  --config-path <path>  - Path to config/default.js (REQUIRED)

Examples:
  # Add CSP directives from configuration file
  node e2e/scripts/add-csp-directives.js csp-config.json --config-path storefront/config/default.js

  # Add CSP directives from JSON via stdin/pipe
  echo '{"img-src": ["*.example.com"]}' | node e2e/scripts/add-csp-directives.js --config-path storefront/config/default.js
  cat csp-config.json | node e2e/scripts/add-csp-directives.js --config-path storefront/config/default.js

Config JSON Format (simplified - just arrays of strings):
{
  "img-src": [
    "*.commercecloud.salesforce.com",
    "*.example.com"
  ],
  "script-src": [
    "cdn.example.com",
    "another-cdn.com"
  ]
}
        `)
        process.exit(1)
    }

    const configFilePath = getConfigFilePath(args)

    // Check if config path was provided
    if (!configFilePath) {
        console.error(`
❌ Error: --config-path parameter is required.

The --config-path parameter must be provided to specify the location of the config/default.js file.

Usage:
  node e2e/scripts/add-csp-directives.js <config.json> --config-path <path>
  echo '{"img-src": ["*.example.com"]}' | node e2e/scripts/add-csp-directives.js --config-path <path>

Example:
  node e2e/scripts/add-csp-directives.js csp-config.json --config-path storefront/config/default.js
        `)
        process.exit(1)
    }

    try {
        let newConfig

        // Check if we have a file argument or should read from stdin
        if (filteredArgs.length > 0) {
            // Read from file
            const configFile = filteredArgs[0]
            newConfig = parseInputFile(configFile)
        } else {
            // Read from stdin
            newConfig = await parseInputFromStdin()
        }

        // Validate config structure
        Object.entries(newConfig).forEach(([directive, entries]) => {
            if (!Array.isArray(entries)) {
                throw new Error(`Directive '${directive}' must be an array`)
            }

            entries.forEach((entry) => {
                if (typeof entry !== 'string') {
                    throw new Error(`Each entry must be a string`)
                }
            })
        })

        // Get current configuration and add new directives to it
        const currentConfig = getCurrentCSPConfig(configFilePath)
        const mergedConfig = addCSPDirectives(currentConfig, newConfig)

        updateConfigFile(mergedConfig, configFilePath)
        console.log(`✅ Added CSP directives successfully`)
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

// Run the script
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error:', error.message)
        process.exit(1)
    })
}

module.exports = {
    getCurrentCSPConfig,
    addCSPDirectives,
    generateCSPDirectives,
    updateConfigFile,
    getConfigFilePath,
    parseInputFile,
    parseInputFromStdin
}
