#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Simple script to update the CSP directives in ssr.js by merging in the new configuration
 */

const fs = require('fs')
const path = require('path')

// Default path to the ssr.js file
const DEFAULT_SSR_FILE_PATH = path.join(
    __dirname,
    '../packages/template-retail-react-app/app/ssr.js'
)

/**
 * Get the SSR file path from command line args or use default
 */
function getSSRFilePath(args) {
    const pathIndex = args.indexOf('--ssr-path')
    if (pathIndex !== -1 && pathIndex + 1 < args.length) {
        return args[pathIndex + 1]
    }
    return DEFAULT_SSR_FILE_PATH
}

/**
 * Parse current CSP directives from ssr.js
 */
function getCurrentCSPConfig(ssrFilePath = DEFAULT_SSR_FILE_PATH) {
    const content = fs.readFileSync(ssrFilePath, 'utf8')
    const directivesMatch = content.match(/directives:\s*{([^}]+)}/s)

    if (!directivesMatch) {
        throw new Error('Could not find CSP directives in ssr.js')
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
 * Merge new CSP configuration with existing configuration
 */
function mergeCSPConfig(existingConfig, newConfig) {
    const mergedConfig = {...existingConfig}

    Object.entries(newConfig).forEach(([directiveName, newEntries]) => {
        if (!mergedConfig[directiveName]) {
            mergedConfig[directiveName] = []
        }

        newEntries.forEach((newEntry) => {
            // Handle both string values and object format for backward compatibility
            const newValue = typeof newEntry === 'string' ? newEntry : newEntry.value

            // Check if value already exists
            const existingEntry = mergedConfig[directiveName].find(
                (existing) => existing.value === newValue
            )

            if (!existingEntry) {
                // Add new entry (no comment since input format is simplified)
                mergedConfig[directiveName].push({
                    value: newValue
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
 * Update ssr.js with new CSP configuration
 */
function updateSSRFile(config, ssrFilePath = DEFAULT_SSR_FILE_PATH) {
    const content = fs.readFileSync(ssrFilePath, 'utf8')
    const directivesString = generateCSPDirectives(config)

    const newContent = content.replace(
        /directives:\s*{[^}]+}/s,
        `directives: {\n${directivesString}\n                }`
    )

    fs.writeFileSync(ssrFilePath, newContent, 'utf8')
    console.log('✅ Successfully updated CSP directives in ssr.js')
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2)
    const filteredArgs = args.filter((arg, index) => {
        return !(arg === '--ssr-path' || args[index - 1] === '--ssr-path')
    })

    // Show help if no file argument and stdin is a TTY (not piped)
    if (filteredArgs.length === 0 && process.stdin.isTTY) {
        console.log(`
Usage:
  node scripts/update-csp-directives-simple.js <config.json>
  echo '{"img-src": ["*.example.com"]}' | node scripts/update-csp-directives-simple.js

Options:
  --ssr-path <path>    - Custom path to ssr.js file (default: packages/template-retail-react-app/app/ssr.js)

Examples:
  # Merge CSP from configuration file
  node scripts/update-csp-directives-simple.js csp-config.json

  # Merge CSP from JSON via stdin/pipe
  echo '{"img-src": ["*.example.com"]}' | node scripts/update-csp-directives-simple.js
  cat csp-config.json | node scripts/update-csp-directives-simple.js

  # Use custom ssr.js path
  node scripts/update-csp-directives-simple.js --ssr-path custom/path/ssr.js csp-config.json
  echo '{"script-src": ["cdn.example.com"]}' | node scripts/update-csp-directives-simple.js --ssr-path custom/path/ssr.js

Config JSON Format:
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

    const ssrFilePath = getSSRFilePath(args)

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
                if (typeof entry !== 'string' && (typeof entry !== 'object' || !entry.value)) {
                    throw new Error(`Each entry must be a string or object with 'value' property`)
                }
            })
        })

        // Get current configuration and merge with new configuration
        const currentConfig = getCurrentCSPConfig(ssrFilePath)
        const mergedConfig = mergeCSPConfig(currentConfig, newConfig)

        updateSSRFile(mergedConfig, ssrFilePath)
        console.log(`✅ Merged CSP directives successfully`)
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
    mergeCSPConfig,
    generateCSPDirectives,
    updateSSRFile,
    getSSRFilePath,
    parseInputFile,
    parseInputFromStdin
}
