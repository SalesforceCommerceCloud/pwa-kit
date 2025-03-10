#!/usr/bin/env node
/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

/**
 * Recursively lists all files in a directory
 * @param {string} dir - Directory to scan
 * @param {string[]} fileList - Accumulator for file list
 * @returns {string[]} - List of all files in the directory and subdirectories
 */
const getAllFiles = (dir, fileList = []) => {
    if (!fs.existsSync(dir)) {
        return fileList
    }

    const files = fs.readdirSync(dir)

    files.forEach((file) => {
        const filePath = path.join(dir, file)
        const isDirectory = fs.statSync(filePath).isDirectory()

        isDirectory
            ? (fileList = getAllFiles(filePath, fileList))
            : fileList.push(path.normalize(filePath))
    })

    return fileList
}

/**
 * Reads the overrides stats file and processes the data
 * @returns {StatsData} Object containing overridable files and stats data
 */
const readOverrideStats = () => {
    const statsPath = path.join(process.cwd(), 'build', 'overrides-stats.json')

    if (!fs.existsSync(statsPath)) {
        console.error(chalk.red('Error: Stats file not found.'))
        console.log(
            chalk.yellow('Please build with RECORD_OVERRIDES=true to generate the stats file:')
        )
        console.log(chalk.cyan('RECORD_OVERRIDES=true pwa-kit-dev build'))
        process.exit(1)
    }

    try {
        const statsData = JSON.parse(fs.readFileSync(statsPath, 'utf8'))

        // Extract unique original paths (overridable files)
        const overridableFiles = [...new Set(statsData.map(({original}) => original))]

        return {
            overridableFiles,
            statsData
        }
    } catch ({message}) {
        console.error(chalk.red(`Error reading stats file: ${message}`))
        process.exit(1)
    }
}

/**
 * Checks for unused override files in the overrides directory
 * @param {StatsData} stats - Stats data from readOverrideStats
 */
const checkUnusedOverrides = ({statsData}) => {
    const overridesDir = path.join(process.cwd(), 'app', 'overrides')

    // No overrides directory, nothing to check
    if (!fs.existsSync(overridesDir)) {
        return
    }

    console.log(chalk.cyan('\nChecking for unused overrides...'))

    // Get all files in the overrides directory
    const overrideFiles = getAllFiles(overridesDir)

    // Get all resolved paths from the stats
    const resolvedPaths = statsData.map(({resolved}) => path.normalize(resolved))

    // Find override files that aren't being used
    const unusedOverrides = overrideFiles.filter((file) => !resolvedPaths.includes(file))

    if (unusedOverrides.length > 0) {
        console.log(
            chalk.yellow(`\nWarning: Found ${unusedOverrides.length} unused override file(s):`)
        )
        unusedOverrides.forEach((file) => {
            const relativePath = path.relative(process.cwd(), file)
            console.log(chalk.yellow(`- ${relativePath} is not overriding any file`))
        })
    } else {
        console.log(chalk.green('All override files are being used.'))
    }
}

/**
 * Main function to list overridable files
 */
const listOverrides = () => {
    console.log(chalk.cyan('Listing overridable files...\n'))

    const stats = readOverrideStats()
    const {overridableFiles} = stats

    if (overridableFiles.length === 0) {
        console.log(chalk.yellow('No overridable files found.'))
        return
    }

    console.log(chalk.green(`Found ${overridableFiles.length} overridable file(s):\n`))

    // Group files by extension package
    const filesByExtension = {}

    overridableFiles.forEach((file) => {
        // Extract extension name from path
        const pathParts = file.split(path.sep)
        const extensionIndex = pathParts.findIndex((part) => part.startsWith('extension-'))

        if (extensionIndex !== -1) {
            const extensionName = pathParts[extensionIndex]
            const relativePath = pathParts.slice(extensionIndex + 1).join(path.sep)

            filesByExtension[extensionName] ??= []

            filesByExtension[extensionName].push({
                fullPath: file,
                relativePath
            })
        } else {
            // Handle files not in an extension
            filesByExtension.other ??= []

            filesByExtension.other.push({
                fullPath: file,
                relativePath: path.relative(process.cwd(), file)
            })
        }
    })

    // Print files grouped by extension
    Object.entries(filesByExtension).forEach(([extension, files]) => {
        console.log(chalk.cyan(`${extension}:`))

        files.forEach(({relativePath}) => {
            console.log(`  - ${relativePath}`)
        })

        // Empty line between extensions
        console.log('')
    })

    // Check for unused overrides
    checkUnusedOverrides(stats)
}

// Export for use in pwa-kit-dev
module.exports = {
    listOverrides
}

// Allow direct execution
if (require.main === module) {
    listOverrides()
}
