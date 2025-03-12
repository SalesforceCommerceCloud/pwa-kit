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

        isDirectory ? getAllFiles(filePath, fileList) : fileList.push(filePath)
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
        throw new Error('Stats file not found')
    }

    try {
        const statsData = JSON.parse(fs.readFileSync(statsPath, 'utf8'))

        // Extract unique original paths (overridable files)
        const overridableFiles = statsData.map((entry) => entry.original)

        return {
            overridableFiles,
            rawStats: statsData
        }
    } catch (error) {
        throw new Error(`Failed to read override stats: ${error.message}`)
    }
}

/**
 * Checks for unused override files in the overrides directory
 * @param {StatsData} statsData - Stats data from readOverrideStats
 */
const checkUnusedOverrides = ({rawStats}) => {
    const overridesDir = path.join(process.cwd(), 'app', 'overrides')

    // No overrides directory, nothing to check
    if (!fs.existsSync(overridesDir)) {
        return
    }

    // Get all resolved paths from the stats
    const resolvedPaths = rawStats.map(({resolved}) => path.normalize(resolved))

    // Get all files in the overrides directory
    const overrideFiles = getAllFiles(overridesDir)

    // Find override files that aren't being used
    const unusedOverrides = overrideFiles.filter(
        (file) => !resolvedPaths.includes(path.normalize(file))
    )

    if (unusedOverrides.length > 0) {
        console.log(
            chalk.yellow(`\n⚠️  Warning: Found ${unusedOverrides.length} unused override file(s):`)
        )
        unusedOverrides.forEach((file) => {
            console.log(chalk.yellow(`  ${path.relative(process.cwd(), file)}`))
        })
    } else if (overrideFiles.length > 0) {
        console.log(chalk.green('\n✅ All override files are being used.'))
    }
}

/**
 * Groups files by their source extension
 * @param {string[]} files - List of files to group
 * @param {OverrideStatsEntry[]} rawStats - Raw stats data
 * @returns {FilesByExtension} Files grouped by extension
 */
const groupFilesByExtension = (files, rawStats) => {
    const filesByExtension = {}

    // Create a map of original paths to their stats entries
    const originalToStats = {}
    rawStats.forEach((entry) => {
        originalToStats[entry.original] = entry
    })

    files.forEach((file) => {
        // Get the stats entry for this file
        const statsEntry = originalToStats[file]

        if (!statsEntry) {
            console.warn(chalk.yellow(`Warning: No stats entry found for ${file}`))
            return
        }

        // Use the sourceExtension property from the stats entry
        const extensionName = statsEntry.sourceExtension || 'other'

        // Extract the relative path (everything after src/)
        const srcIndex = file.indexOf(`${path.sep}src${path.sep}`)
        const relativePath =
            srcIndex !== -1
                ? file.substring(srcIndex + 5).replace(/\\/g, '/') // Normalize path separators to forward slashes
                : file.replace(/\\/g, '/')

        // Initialize the array for this extension if it doesn't exist
        if (!filesByExtension[extensionName]) {
            filesByExtension[extensionName] = []
        }

        // Add the file to the appropriate extension group
        filesByExtension[extensionName].push(relativePath)
    })

    return filesByExtension
}

/**
 * Main function to list overridable files
 */
const main = () => {
    try {
        console.log(chalk.cyan('Listing overridable files...\n'))

        const statsData = readOverrideStats()

        if (!statsData || !statsData.overridableFiles || !statsData.rawStats) {
            console.error(chalk.red('No override stats found. Run a build first.'))
            process.exit(1)
        }

        const filesByExtension = groupFilesByExtension(
            statsData.overridableFiles,
            statsData.rawStats
        )

        if (Object.keys(filesByExtension).length > 0) {
            console.log(chalk.cyan('\nOverridable files by extension:'))

            // Print files grouped by extension
            Object.keys(filesByExtension)
                .sort()
                .forEach((extension) => {
                    console.log(`\n${chalk.bold(extension)}:`)
                    filesByExtension[extension].sort().forEach((file) => {
                        console.log(`  ${file}`)
                    })
                })
        } else {
            console.log(chalk.cyan('\nNo overridable files found.'))
        }

        // Check for unused overrides
        checkUnusedOverrides(statsData)
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`))
        process.exit(1)
    }
}

// Allow direct execution
if (require.main === module) {
    main()
}
