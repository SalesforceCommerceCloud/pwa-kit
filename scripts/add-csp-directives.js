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
 * It preserves existing comments and prevents duplicate values.
 */

const fs = require('fs')
const path = require('path')

// Default path to the config default.js file
const DEFAULT_CONFIG_FILE_PATH = path.join(
    __dirname,
    '../packages/template-retail-react-app/config/default.js'
)

/**
 * Get the config file path from command line args or use default
 */
function getConfigFilePath(args) {
    const pathIndex = args.indexOf('--config-path')
    if (pathIndex !== -1 && pathIndex + 1 < args.length) {
        return args[pathIndex + 1]
    }
    return DEFAULT_CONFIG_FILE_PATH
}

/**
 * Parse current CSP directives from config default.js
 */
function getCurrentCSPConfig(configFilePath = DEFAULT_CONFIG_FILE_PATH) {
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

    // Match each directive and its array
    const directiveMatches = directivesContent.matchAll(/'([^']+)':\s*\[([^\]]+)\]/gs)

    Array.from(directiveMatches).forEach((match) => {
        const directiveName = match[1]
        const valuesContent = match[2]

        config[directiveName] = []

        // Parse values and comments from existing CSP
        const lines = valuesContent.split('\n')
        let currentComment = null

        lines.forEach((line) => {
            const trimmedLine = line.trim()

            if (trimmedLine.startsWith('//')) {
                currentComment = trimmedLine.substring(2).trim()
            } else if (trimmedLine.includes("'")) {
                const valueMatch = trimmedLine.match(/'([^']+)'/)
                if (valueMatch) {
                    config[directiveName].push({
                        comment: currentComment,
                        value: valueMatch[1]
                    })
                    currentComment = null
                }
            }
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
            // Check if value already exists
            const existingEntry = mergedConfig[directiveName].find(
                (existing) => existing.value === newEntry
            )

            if (!existingEntry) {
                // Add new entry
                mergedConfig[directiveName].push({
                    value: newEntry
                })
            }
        })
    })

    return mergedConfig
}

/**
 * Generate CSP directives string from config
 */
function generateCSPDirectives(config) {
    const directiveLines = []

    Object.entries(config).forEach(([directiveName, entries]) => {
        if (entries.length === 0) return

        const valueLines = []
        entries.forEach((entry, i) => {
            if (entry.comment) {
                valueLines.push(`                        // ${entry.comment}`)
            }
            valueLines.push(
                `                        '${entry.value}'${i < entries.length - 1 ? ',' : ''}`
            )
        })

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
function updateConfigFile(config, configFilePath = DEFAULT_CONFIG_FILE_PATH) {
    const content = fs.readFileSync(configFilePath, 'utf8')
    const directivesString = generateCSPDirectives(config)

    const newContent = content.replace(
        /directives:\s*{[\s\S]*?}/s,
        `directives: {\n${directivesString}\n                }`
    )

    fs.writeFileSync(configFilePath, newContent, 'utf8')
    console.log('✅ Successfully added CSP directives to config/default.js')
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
  node scripts/add-csp-directives.js <config.json>
  echo '{"img-src": ["*.example.com"]}' | node scripts/add-csp-directives.js

Description:
  Adds new CSP directive values to existing configuration in config/default.js under app.contentSecurityPolicy
  - Preserves existing comments and values
  - Prevents duplicate values
  - Cannot remove or modify existing directives

Options:
  --config-path <path>  - Custom path to config/default.js (default: packages/template-retail-react-app/config/default.js)

Examples:
  # Add CSP directives from configuration file
  node scripts/add-csp-directives.js csp-config.json

  # Add CSP directives from JSON via stdin/pipe
  echo '{"img-src": ["*.example.com"]}' | node scripts/add-csp-directives.js
  cat csp-config.json | node scripts/add-csp-directives.js

  # Use custom config path
  node scripts/add-csp-directives.js --config-path custom/path/default.js csp-config.json
  echo '{"script-src": ["cdn.example.com"]}' | node scripts/add-csp-directives.js --config-path custom/path/default.js

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

        // TODO: Fix any linting errors by `npm run lint:fix` from the folder containing the ssr.js file
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
