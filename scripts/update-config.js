#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Script to update configuration properties in config/default.js
 *
 * This script can update simple properties (strings, numbers, booleans) using dot notation
 * for nested properties. It preserves existing formatting and comments.
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
 * Parse value from string to appropriate type
 */
function parseValue(valueString) {
    // Handle boolean values
    if (valueString.toLowerCase() === 'true') return true
    if (valueString.toLowerCase() === 'false') return false

    // Handle null and undefined
    if (valueString.toLowerCase() === 'null') return null
    if (valueString.toLowerCase() === 'undefined') return undefined

    // Handle numbers
    if (/^-?\d+$/.test(valueString)) {
        return parseInt(valueString, 10)
    }
    if (/^-?\d*\.\d+$/.test(valueString)) {
        return parseFloat(valueString)
    }

    // Handle arrays (simple JSON format)
    if (valueString.startsWith('[') && valueString.endsWith(']')) {
        try {
            return JSON.parse(valueString)
        } catch (error) {
            throw new Error(`Invalid array format: ${valueString}`)
        }
    }

    // Handle objects (simple JSON format)
    if (valueString.startsWith('{') && valueString.endsWith('}')) {
        try {
            return JSON.parse(valueString)
        } catch (error) {
            throw new Error(`Invalid object format: ${valueString}`)
        }
    }

    // Default to string (remove quotes if present)
    if (
        (valueString.startsWith('"') && valueString.endsWith('"')) ||
        (valueString.startsWith("'") && valueString.endsWith("'"))
    ) {
        return valueString.slice(1, -1)
    }

    return valueString
}

/**
 * Escape a string for safe usage inside a RegExp pattern
 */
function escapeForRegExp(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Convert value to JavaScript code representation
 */
function valueToCode(value) {
    if (typeof value === 'string') {
        return `'${value.replace(/'/g, "\\'")}'`
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
        return value.toString()
    }
    if (value === null) {
        return 'null'
    }
    if (value === undefined) {
        return 'undefined'
    }
    if (Array.isArray(value)) {
        return JSON.stringify(value, null, 4).replace(/"/g, "'")
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 4).replace(/"/g, "'")
    }
    return value.toString()
}

/**
 * Update a property in the config file using dot notation
 */
function updateConfigProperty(configFilePath, propertyPath, newValue) {
    const content = fs.readFileSync(configFilePath, 'utf8')
    const pathParts = propertyPath.split('.')

    // Compute expected indentation for the final property line based on nesting depth
    const finalPropertyName = pathParts[pathParts.length - 1]
    const indent = '    '.repeat(pathParts.length)

    // Build a regex that matches the final property at the expected indentation
    const propertyPattern = new RegExp(
        `(${escapeForRegExp(indent)}${escapeForRegExp(finalPropertyName)}\\s*:\\s*)([^,\\n}]+)(,?)`,
        'g'
    )

    const replacement = `$1${valueToCode(newValue)}$3`
    const newContent = content.replace(propertyPattern, replacement)

    if (newContent === content) {
        throw new Error(`Property '${propertyPath}' not found in config file`)
    }

    return newContent
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2)
    const filteredArgs = args.filter((arg, index) => {
        return !(arg === '--config-path' || args[index - 1] === '--config-path')
    })

    // Show help if insufficient arguments
    if (filteredArgs.length < 2) {
        console.log(`
Usage:
  node scripts/update-config.js <property-path> <value> [--config-path <path>]

Description:
  Updates configuration properties in config/default.js using dot notation for nested properties.
  Supports strings, numbers, booleans, arrays, and objects.

Options:
  --config-path <path>  - Custom path to config/default.js (default: packages/template-retail-react-app/config/default.js)

Examples:
  # Update a boolean property
  node scripts/update-config.js app.partialHydrationEnabled true

  # Update a string property
  node scripts/update-config.js app.defaultSite "MyNewSite"

  # Update a nested property
  node scripts/update-config.js app.commerceAPI.parameters.siteId "NewSiteId"

  # Update a number
  node scripts/update-config.js app.someNumber 42

  # Update with custom config path
  node scripts/update-config.js --config-path custom/path/default.js app.partialHydrationEnabled true

Supported Value Types:
  - Booleans: true, false
  - Numbers: 42, 3.14
  - Strings: hello, 'hello', or "hello" (quotes optional; both single and double quotes are supported)
  - Arrays: ["item1", "item2"] (JSON format)
  - Objects: {"key": "value"} (JSON format)
  - Null: null
        `)
        process.exit(1)
    }

    const configFilePath = getConfigFilePath(args)
    const propertyPath = filteredArgs[0]
    const valueString = filteredArgs[1]

    try {
        // Validate config file exists
        if (!fs.existsSync(configFilePath)) {
            throw new Error(`Config file not found: ${configFilePath}`)
        }

        // Parse the new value
        const newValue = parseValue(valueString)

        console.log(`🔄 Updating ${propertyPath} to:`, newValue)

        // Update the config file
        const updatedContent = updateConfigProperty(configFilePath, propertyPath, newValue)
        fs.writeFileSync(configFilePath, updatedContent, 'utf8')

        console.log(`✅ Successfully updated ${propertyPath} in ${configFilePath}`)
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

// Run the script
if (require.main === module) {
    main()
}

module.exports = {
    updateConfigProperty,
    parseValue,
    valueToCode,
    getConfigFilePath
}
