/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import {spawn} from 'cross-spawn'
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'
import os from 'os'
import {exec} from 'child_process'

// CONSTANTS
const CREATE_APP_VERSION = 'latest'

// Private schema used to generate the JSON schema
const emptySchema = z.object({}).strict()

export const EmptyJsonSchema = zodToJsonSchema(emptySchema)

/**
 * Converts a string to PascalCase (e.g., product-card -> ProductCard)
 */
export const toPascalCase = (str) =>
    str.replace(/(^\w|[-_\s]\w)/g, (match) => match.replace(/[-_\s]/, '').toUpperCase())

/**
 * Runs a shell command and captures its stdout/stderr as a string.
 *
 * @param {string} command - The executable to run (e.g. "node", "npx", "ls").
 * @param {string[]} args - Arguments to pass to the command.
 * @param {Object} [options] - Optional spawn options (e.g. cwd).
 * @returns {Promise<string>} - Resolves with combined stdout and stderr.
 */
export const runCommand = async (command, args = [], options = {}) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            ...options,
            stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, pipe out/err
            shell: false // be explicit — set to true if you want shell features
        })

        let output = ''

        child.stdout.on('data', (chunk) => {
            output += chunk.toString()
        })

        child.stderr.on('data', (chunk) => {
            output += chunk.toString() // combine stderr into output
        })

        child.on('error', (err) => {
            reject(err)
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output)
            } else {
                const error = new Error(`Command failed with exit code ${code}`)
                error.output = output
                error.code = code
                reject(error)
            }
        })
    })
}

/**
 * Checks if the project is a monorepo by verifying the existence of lerna.json in the root directory.
 *
 * @returns {boolean} True if lerna.json exists in the current workspace, false otherwise.
 */
export function isMonoRepo() {
    const lernaPath = path.resolve(
        ...(process.env.WORKSPACE_FOLDER_PATHS ? [process.env.WORKSPACE_FOLDER_PATHS] : []),
        'lerna.json'
    )
    return fs.existsSync(lernaPath)
}

/**
 * Returns the command or path to use for creating a new PWA Kit app.
 *
 * If the project is a monorepo (detected by the presence of lerna.json),
 * it returns the absolute path to the local create-mobify-app.js script.
 * Otherwise, it returns the npm package name with a specific version.
 *
 * @returns {string} The command or path to use for app creation.
 */
export const getCreateAppCommand = () => {
    return isMonoRepo()
        ? path.resolve(
              `${process.env.WORKSPACE_FOLDER_PATHS}/packages/pwa-kit-create-app/scripts/create-mobify-app.js`
          )
        : `@salesforce/pwa-kit-create-app@${CREATE_APP_VERSION}`
}

/**
 * Runs an NPX command and captures its output.
 *
 * @returns {Promise<string>} - Resolves with the command output.
 */
export async function runNpxCommand(NPX_COMMAND, CREATE_APP_COMMAND, DISPLAY_PROGRAM_COMMAND) {
    return new Promise((resolve, reject) => {
        const tempDir = os.tmpdir()
        const outputFilePath = path.join(tempDir, 'npx-output.json')
        const errorFilePath = path.join(tempDir, 'npx-error.log')
        const command = `${NPX_COMMAND} ${CREATE_APP_COMMAND} ${DISPLAY_PROGRAM_COMMAND} > ${outputFilePath} 2> ${errorFilePath}`

        exec(command, (error) => {
            if (error) {
                reject(error)
                return
            }

            fsPromises.promises
                .readFile(outputFilePath, 'utf-8')
                .then((data) => resolve(data))
                .catch((err) => reject(err))
        })
    })
}

/**
 * Returns the copyright header with the current year
 * @returns {string} The copyright header text
 */
export const getCopyrightHeader = () => {
    const year = new Date().getFullYear()
    return `/*
 * Copyright (c) ${year}, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */`
}

/**
 * Converts a string to kebab-case (e.g., ProductCard -> product-card)
 */
export function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase()
}

/**
 * Logs a message to the mcp-debug.log file in the current directory.
 * @param {string} message - The message to log.
 */
export async function logMCPMessage(message) {
    if (process.env.DEBUG) {
        // Check if DEBUG mode is enabled
        const logFilePath = path.join(__dirname, 'mcp-debug.log')
        const timestamp = new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})
        const logMessage = `[${timestamp}] ${message}\n`
        try {
            // Ensure the log file exists, create it if it doesn't
            await fs.access(logFilePath).catch(async () => {
                await fs.writeFile(logFilePath, '', 'utf8')
            })
            await fs.appendFile(logFilePath, logMessage, 'utf8')
        } catch (error) {
            console.error(`Failed to write to log file: ${error.message}`)
        }
    }
}
